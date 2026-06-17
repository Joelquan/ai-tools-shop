// api/email-capture.js
// Captures email before assessment starts and adds contact to Brevo

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) {
    console.error('BREVO_API_KEY not set');
    // Still return success so user experience isn't broken
    return res.status(200).json({ success: true });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        attributes: {
          SOURCE: source || 'assessment',
          SIGNUP_DATE: new Date().toISOString().split('T')[0],
        },
        listIds: [2], // Default list — change to your Brevo list ID
        updateEnabled: true,
      }),
    });

    const data = await response.json();

    if (response.ok || response.status === 204) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Brevo error:', data);
      // Still return success — don't block user from taking assessment
      return res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error('Email capture error:', err.message);
    return res.status(200).json({ success: true });
  }
};
