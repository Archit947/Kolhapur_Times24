const DEFAULT_OG_IMAGE = 'https://kolhapur-times24.vercel.app/og-image.png';
const SITE_URL = 'https://kolhapur-times24.vercel.app';

export default async function handler(req, res) {
  const { slug } = req.query;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let title = 'KopMaza News';
  let description = 'कोल्हापूर माझा - शैक्षणिक, राजकीय, सामाजिक बातम्या';
  let image = DEFAULT_OG_IMAGE;
  let imageType = 'image/png';
  const articleUrl = `${SITE_URL}/news/${slug}`;

  if (slug && supabaseUrl && supabaseKey) {
    try {
      const apiUrl = `${supabaseUrl}/rest/v1/news?slug=eq.${encodeURIComponent(slug)}&select=title,short_description,featured_image&limit=1`;
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      const data = await response.json();
      if (data && data.length > 0) {
        title = data[0].title || title;
        description = data[0].short_description || description;
        // Use the raw stored image — images are pre-compressed to ≤250KB at upload time
        image = data[0].featured_image || DEFAULT_OG_IMAGE;

        // Detect MIME type from extension
        if (image.match(/\.png(\?|$)/i)) imageType = 'image/png';
        else if (image.match(/\.(jpg|jpeg)(\?|$)/i)) imageType = 'image/jpeg';
        else if (image.match(/\.webp(\?|$)/i)) imageType = 'image/webp';
        else if (image.match(/\.gif(\?|$)/i)) imageType = 'image/gif';
      }
    } catch (e) {
      console.error('Error fetching OG data:', e);
    }
  }

  // Escape HTML entities for safe insertion into HTML attributes/text.
  // IMPORTANT: Only escape text/attribute values, NOT the image URL —
  // image URLs can contain & in query strings which must stay as & in
  // the HTTP URL itself (inside content="..." they should be &amp; but
  // that only applies to the attribute value, and modern scrapers handle
  // both). We use a targeted escaper that keeps URLs intact.
  const escapeAttr = (str) =>
    (str || '').replace(/[<>"']/g, (m) => {
      switch (m) {
        case '<':  return '&lt;';
        case '>':  return '&gt;';
        case '"':  return '&quot;';
        default:   return '&#039;';
      }
    });

  const escapeText = (str) =>
    (str || '').replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&':  return '&amp;';
        case '<':  return '&lt;';
        case '>':  return '&gt;';
        case '"':  return '&quot;';
        default:   return '&#039;';
      }
    });

  const safeTitle   = escapeText(title);
  const safeDesc    = escapeText(description);
  // For URLs used inside HTML attributes we must encode & as &amp; per HTML spec
  // so that the browser / crawler parses the attribute correctly, while the URL
  // path/host chars stay untouched.
  const safeImage   = escapeAttr(image).replace(/&(?!amp;|lt;|gt;|quot;|#039;)/g, '&amp;');
  const safeUrl     = escapeAttr(articleUrl);
  const safeSlug    = encodeURIComponent(slug || '');

  const html = `<!DOCTYPE html>
<html lang="mr">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}">
    <meta property="og:site_name" content="KopMaza News">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:secure_url" content="${safeImage}">
    <meta property="og:image:type" content="${imageType}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
    <link rel="canonical" href="${safeUrl}">
    <script>
      // Redirect real users to the React app
      window.location.replace('/news/${safeSlug}?_direct=1');
    </script>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <img src="${safeImage}" alt="${safeTitle}">
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  res.status(200).send(html);
}
