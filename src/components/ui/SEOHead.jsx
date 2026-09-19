import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title = 'Kolhapur_Times24',
  description = 'Stay updated with the latest news from Kolhapur_Times24',
  image,
  url,
  type = 'website',
}) {
  const siteTitle = 'Kolhapur_Times24';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
}
