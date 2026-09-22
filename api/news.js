const DEFAULT_OG_IMAGE = 'https://kolhapur-times24.vercel.app/og-image.png';
const SITE_URL = 'https://kolhapur-times24.vercel.app';

export default async function handler(req, res) {
  const { slug, _direct } = req.query;

  // ── Real user returning via the JS redirect below ──────────────────────────
  // When a real browser executes the <script> in the OG HTML, it redirects to
  // /news/<slug>?_direct=1.  We detect that here and serve the React SPA so
  // the user lands on the correct article page without an infinite loop.
  if (_direct === '1') {
    try {
      const spaRes = await fetch(`${SITE_URL}/`, {
        headers: { 'Accept': 'text/html' },
      });
      const html = await spaRes.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch {
      // Final fallback: hard-redirect to home and let the SPA sort it out
      res.setHeader('Location', '/');
      return res.status(302).end();
    }
  }

  // ── Fetch article data from Supabase ───────────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let title = 'Kolhapur Times24';
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
        image = data[0].featured_image || DEFAULT_OG_IMAGE;
        
        // Optimise Supabase images for WhatsApp Mobile compatibility (must be < 300KB)
        if (image.includes('/storage/v1/object/public/')) {
          image = image.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
          image += image.includes('?') ? '&' : '?';
          image += 'width=800&resize=contain&quality=70';
        }
        // Detect MIME type from file extension
        if (image.match(/\.png(\?|$)/i))           imageType = 'image/png';
        else if (image.match(/\.(jpg|jpeg)(\?|$)/i)) imageType = 'image/jpeg';
        else if (image.match(/\.webp(\?|$)/i))      imageType = 'image/webp';
        else if (image.match(/\.gif(\?|$)/i))        imageType = 'image/gif';
      }
    } catch (e) {
      console.error('Error fetching OG data:', e);
    }
  }

  // ── Sanitise values for HTML output ───────────────────────────────────────
  // escapeText  – for text nodes and non-URL attribute values
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

  // escapeAttr  – for URL attribute values: keeps & untouched in the path,
  //              but still HTML-encodes & → &amp; as required by the HTML spec
  //              so the browser/crawler parses the attribute correctly.
  const escapeAttr = (str) =>
    (str || '').replace(/[<>"']/g, (m) => {
      switch (m) {
        case '<':  return '&lt;';
        case '>':  return '&gt;';
        case '"':  return '&quot;';
        default:   return '&#039;';
      }
    }).replace(/&(?!amp;|lt;|gt;|quot;|#039;)/g, '&amp;');

  const safeTitle = escapeText(title);
  const safeDesc  = escapeText(description);
  const safeImage = escapeAttr(image);
  const safeUrl   = escapeAttr(articleUrl);
  const safeSlug  = encodeURIComponent(slug || '');

  // ── Serve OG HTML for EVERYONE ─────────────────────────────────────────────
  // • Crawlers (WhatsApp, Telegram, Facebook, iOS share-sheet, etc.) read the
  //   <meta> tags and never execute JS → they get the correct image preview.
  // • Real browsers execute the <script> and are redirected to ?_direct=1
  //   (handled above) which serves the React SPA.
  //
  // Why not use bot-detection?  Mobile native share sends the /news/<slug> URL
  // to the receiving app.  iOS's built-in link unfurler and some Android app
  // handlers fetch the URL using a generic Mobile Safari / Chrome UA — not a
  // recognised bot UA — so they previously received the bare SPA with no OG
  // tags and therefore no image.
  const html = `<!DOCTYPE html>
<html lang="mr">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}">
    <meta property="og:site_name" content="Kolhapur Times24">
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
      // Redirect real users to the React SPA.
      // We append ?_direct=1 so news.js knows to serve the SPA
      // instead of this OG page again (breaks the redirect loop).
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
