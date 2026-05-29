// Coupon API — verify and redeem single-use coupons
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = 'https://oxtyixmbborwmncuvafl.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  try {
    const { action, code, toolId } = req.body;

    // VERIFY — check if code is valid and unused
    if (action === 'verify') {
      if (!code || !toolId) return res.status(400).json({ valid: false, error: 'Missing code or toolId' });

      const cleanCode = code.trim().toUpperCase();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${cleanCode}&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      const data = await r.json();

      if (!data || data.length === 0) {
        return res.status(200).json({ valid: false, error: 'Code not found' });
      }

      const coupon = data[0];

      if (coupon.used) {
        return res.status(200).json({ valid: false, error: 'This code has already been redeemed' });
      }

      if (coupon.tool_id !== toolId) {
        return res.status(200).json({ valid: false, error: `This code is not valid for this tool` });
      }

      return res.status(200).json({ valid: true, discount: 50, couponId: coupon.id });
    }

    // REDEEM — mark as used when payment completes
    if (action === 'redeem') {
      if (!code) return res.status(400).json({ error: 'Missing code' });

      const cleanCode = code.trim().toUpperCase();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${cleanCode}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ used: true, used_at: new Date().toISOString() })
      });

      const data = await r.json();
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('Coupon error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
