const Stripe = require('stripe');

const SUPABASE_URL = 'https://oxtyixmbborwmncuvafl.supabase.co';
const PREFIXES = { eq:'EQ', moneymindset:'MM', knowthyself:'KTS', relationshipstyle:'RS' };

async function generateCoupon(sessionId, toolId) {
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const prefix = PREFIXES[toolId] || 'AI';
  const suffix = sessionId.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase();
  const code = `${prefix}-${suffix}`;

  try {
    // Check if already exists
    const check = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${code}&select=code`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const existing = await check.json();
    if (existing && existing.length > 0) return code;

    // Insert
    await fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, tool_id: toolId, original_session_id: sessionId, used: false })
    });
    return code;
  } catch(e) {
    console.error('Coupon gen error:', e);
    return code; // Return code even if DB fails
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = Stripe(key);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const toolId = session.metadata?.toolId;
      
      // Redeem coupon if one was used
      if (session.metadata?.couponCode) {
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        const code = session.metadata.couponCode;
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${code}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ used: true, used_at: new Date().toISOString() })
          });
        } catch(e) { console.error('Redeem error:', e); }
      }

      // Generate 30-day retake coupon for all PDF tools
      let retakeCoupon = null;
      if (['eq','moneymindset','knowthyself','relationshipstyle'].includes(toolId)) {
        retakeCoupon = await generateCoupon(sessionId, toolId);
      }

      return res.status(200).json({
        paid: true,
        toolId,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        retakeCoupon,
      });
    }
    return res.status(200).json({ paid: false });
  } catch (err) {
    console.error('Verify error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
