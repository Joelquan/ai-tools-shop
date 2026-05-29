// Daily cron job — runs at 8am UTC
// Updates sitemap with articles scheduled for today
// Vercel Cron: runs via vercel.json crons config

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Verify this is a cron call (Vercel sends Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const blogDir = path.join(process.cwd(), 'public', 'blog');
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

    // Read all blog articles and find ones published today or earlier
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

    const published = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const dateMatch = content.match(/"datePublished":"([^"]+)"/);
      if (dateMatch && dateMatch[1] <= today) {
        published.push({
          slug: file.replace('.html', ''),
          date: dateMatch[1]
        });
      }
    }

    // Regenerate sitemap
    const toolPages = [
      'temperament','knowthyself','eq','moneymindset','relationshipstyle',
      'leadership','career','entrepreneur','ideas','stress','marriage'
    ];

    let sitemapEntries = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://signaturewithin.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://signaturewithin.com/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    for (const tool of toolPages) {
      sitemapEntries += `
  <url>
    <loc>https://signaturewithin.com/${tool}.html</loc>
    <lastmod>2026-05-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    for (const article of published) {
      sitemapEntries += `
  <url>
    <loc>https://signaturewithin.com/blog/${article.slug}.html</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    sitemapEntries += '\n</urlset>';
    fs.writeFileSync(sitemapPath, sitemapEntries);

    return res.status(200).json({
      success: true,
      date: today,
      articlesPublished: published.length,
      message: `Sitemap updated with ${published.length} articles`
    });

  } catch (err) {
    console.error('Publish cron error:', err);
    return res.status(500).json({ error: err.message });
  }
};
