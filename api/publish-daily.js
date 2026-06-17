// api/publish-daily.js
// Runs daily at 8am UTC via Vercel Cron (configured in vercel.json)
// Pings Google + Bing to reindex the sitemap — keeps SEO crawl fresh

module.exports = async (req, res) => {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sitemapUrl = 'https://signaturewithin.com/sitemap.xml';
  const today = new Date().toISOString().split('T')[0];
  const results = {};

  // Ping Google
  try {
    const googleRes = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    results.google = { status: googleRes.status, ok: googleRes.ok };
  } catch (err) {
    results.google = { error: err.message };
  }

  // Ping Bing
  try {
    const bingRes = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    results.bing = { status: bingRes.status, ok: bingRes.ok };
  } catch (err) {
    results.bing = { error: err.message };
  }

  console.log(`[publish-daily] ${today}`, JSON.stringify(results));

  return res.status(200).json({
    success: true,
    date: today,
    sitemap: sitemapUrl,
    pings: results,
    message: `Sitemap pinged to Google and Bing on ${today}`
  });
};
