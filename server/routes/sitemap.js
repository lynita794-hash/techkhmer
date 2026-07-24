import { Router } from 'express'
import db from '../db.js'
import { buildTitleSlug } from '../utils/slug.js'

const router = Router()

const STATIC_PATHS = ['/', '/about', '/contact', '/privacy', '/terms', '/dmca']

function xmlEscape(str) {
  return String(str).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

// GET /sitemap.xml — auto-generated from the current drama list + static
// pages, so admins never have to hand-maintain it as content grows.
router.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  const dramas = db
    .prepare('SELECT id, title, updated_at FROM dramas ORDER BY updated_at DESC')
    .all()

  const staticUrls = STATIC_PATHS.map(
    (p) => `  <url>\n    <loc>${xmlEscape(baseUrl + p)}</loc>\n  </url>`,
  )

  const dramaUrls = dramas.map((d) => {
    const slug = buildTitleSlug({ id: d.id, title: d.title })
    const loc = `${baseUrl}/drama/${slug}/episode-1`
    const lastmod = d.updated_at ? new Date(d.updated_at).toISOString() : null
    return (
      `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n` +
      (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
      `  </url>`
    )
  })

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...staticUrls, ...dramaUrls].join('\n') +
    `\n</urlset>`

  res.type('application/xml').send(xml)
})

// Converts a free-text/minutes duration value into whole seconds for the
// <video:duration> tag, which the Google Video Sitemap spec requires as a
// plain integer between 1 and 28800. Returns null when unparseable so the
// tag can simply be omitted rather than emit an invalid value.
function toDurationSeconds(value) {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const minutes = parseFloat(match[1])
  if (!minutes || Number.isNaN(minutes)) return null
  const seconds = Math.round(minutes * 60)
  return seconds > 0 && seconds <= 28800 ? seconds : null
}

// GET /sitemap-video.xml — Google Video Sitemap extension, one <url> per
// episode/movie with <video:video> metadata (thumbnail, title, content
// location, duration, publication date). Separate from the main sitemap
// so it can be submitted independently in Search Console under
// "Video sitemaps" without mixing plain page URLs into it.
router.get('/sitemap-video.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  const dramas = db.prepare('SELECT * FROM dramas ORDER BY updated_at DESC').all()

  const urls = dramas.flatMap((d) => {
    const episodes = db
      .prepare('SELECT number, video_url AS videoUrl, duration FROM episodes WHERE drama_id = ? ORDER BY number')
      .all(d.id)
    if (episodes.length === 0) return []

    const slug = buildTitleSlug({ id: d.id, title: d.title })
    const publicationDate = d.date_aired
      ? (() => {
          const parsed = new Date(d.date_aired)
          return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
        })()
      : null

    return episodes
      .filter((ep) => ep.videoUrl)
      .map((ep) => {
        const loc = `${baseUrl}/drama/${slug}/episode-${ep.number}`
        const title = d.type === 'Movie' ? d.title : `${d.title} EP ${ep.number}`
        const durationSeconds = toDurationSeconds(ep.duration || d.duration)

        return (
          `  <url>\n` +
          `    <loc>${xmlEscape(loc)}</loc>\n` +
          `    <video:video>\n` +
          `      <video:thumbnail_loc>${xmlEscape(d.backdrop || d.poster || '')}</video:thumbnail_loc>\n` +
          `      <video:title>${xmlEscape(title)}</video:title>\n` +
          `      <video:description>${xmlEscape((d.description || title).slice(0, 2048))}</video:description>\n` +
          `      <video:content_loc>${xmlEscape(ep.videoUrl)}</video:content_loc>\n` +
          (durationSeconds ? `      <video:duration>${durationSeconds}</video:duration>\n` : '') +
          (publicationDate
            ? `      <video:publication_date>${publicationDate}</video:publication_date>\n`
            : '') +
          `      <video:family_friendly>yes</video:family_friendly>\n` +
          `    </video:video>\n` +
          `  </url>`
        )
      })
  })

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n` +
    urls.join('\n') +
    `\n</urlset>`

  res.type('application/xml').send(xml)
})

export default router
