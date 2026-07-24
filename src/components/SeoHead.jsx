import { Helmet } from 'react-helmet-async'
import { useLanguage } from '../context/LanguageContext'

// Per-page SEO meta tags — overrides the static defaults baked into
// index.html for whichever route is currently rendered. Without this,
// every page (drama watch pages included) shared identical title/
// description/og:image, so link previews and search results looked the
// same no matter what content was being shared.
function SeoHead({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd,
  // Open Graph video tags — only relevant on Watch pages, lets Facebook/
  // Discord/etc. render an inline player in link previews instead of a
  // plain image card.
  videoUrl,
}) {
  const { t } = useLanguage()
  const fullTitle = title ? `${title} - DramaTV` : t('seo.defaultTitle')
  // Accept either one jsonLd object or an array of them — the Watch page
  // needs to emit several distinct schema.org blocks (VideoObject +
  // BreadcrumbList) on the same page.
  const jsonLdBlocks = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : []

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {videoUrl && <meta property="og:video" content={videoUrl} />}
      {videoUrl && <meta property="og:video:type" content="video/mp4" />}
      {videoUrl && <meta property="og:video:width" content="1280" />}
      {videoUrl && <meta property="og:video:height" content="720" />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  )
}

export default SeoHead
