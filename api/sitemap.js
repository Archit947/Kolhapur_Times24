// api/sitemap.js
// Serves sitemap.xml with the correct Content-Type: application/xml
// so Google Search Console never mistakes it for HTML.

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kolhapur-times24.vercel.app/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
}
