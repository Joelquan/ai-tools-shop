// Called after successful payment to generate a unique coupon for retake
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  const SUPABASE_URL = 'https://oxtyixmbborwmncuvafl.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  const PREFIXES = {
    eq: 'EQ',
    moneymindset: 'MM',
    knowthyself: 'KTS',
    relationshipstyle: 'RS'
  };

  try {
    const { sessionId, toolId } = req.body;
    if (!sessionId || !toolId) return res.status(400).json({ error: 'Missing params' });

    const prefix = PREFIXES[toolId] || 'AI';
    // Generate unique code from session ID — take 6 chars from end
    const suffix = sessionId.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase();
    const code = `${prefix}-${suffix}`;

    // Check if already exists (idempotent)
    const check = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${code}&select=code`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const existing = await check.json();
    if (existing && existing.length > 0) {
      return res.status(200).json({ code, already_exists: true });
    }

    // Insert new coupon
    const r = await fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        code,
        tool_id: toolId,
        original_session_id: sessionId,
        used: false
      })
    });

    const data = await r.json();
    return res.status(200).json({ code, data });
  } catch (e) {
    console.error('Generate coupon error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
