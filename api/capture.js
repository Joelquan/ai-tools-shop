module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, matchedTool } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const SUPABASE_URL = 'https://oxtyixmbborwmncuvafl.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_KEY) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/search_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        query: query.toLowerCase().trim(),
        matched_tool: matchedTool || 'none',
      }),
    });

    if (response.ok) {
      return res.status(200).json({ saved: true });
    } else {
      const err = await response.text();
      console.error('Supabase error:', err);
      return res.status(200).json({ saved: false });
    }
  } catch (err) {
    console.error('Capture error:', err.message);
    return res.status(200).json({ saved: false });
  }
};
