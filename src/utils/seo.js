// Helpers for building schema.org structured data (JSON-LD) on the Watch
// page — VideoObject for the single episode currently playing, plus a
// TVSeason/episode playlist, BreadcrumbList, and a WatchAction, so search
// engines can surface rich video results instead of a plain link.
import { buildWatchPath } from './slug'

// Converts a plain minutes value (e.g. "24" or "24 min") into an ISO 8601
// duration string schema.org expects (e.g. "PT24M"). Falls back to null
// when the input has no parseable number — better to omit the field
// entirely than emit an invalid duration Google would reject.
export function toIsoDuration(value) {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const minutes = parseFloat(match[1])
  if (!minutes || Number.isNaN(minutes)) return null
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  let iso = 'PT'
  if (hours) iso += `${hours}H`
  if (mins || !hours) iso += `${mins}M`
  return iso
}

// Best-effort ISO 8601 date for uploadDate/datePublished — schema.org
// wants a real date, not free text like "2024" or "every Friday", so
// anything that doesn't parse cleanly is left out.
function toIsoDate(value) {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

// #1 — VideoObject for the episode/movie currently being watched.
export function buildVideoObjectSchema({ drama, episode, activeEp, pageUrl }) {
  const duration = toIsoDuration(episode?.duration || drama.duration)
  return {
    '@type': 'VideoObject',
    name: drama.type === 'Movie' ? drama.title : `${drama.title} EP ${activeEp}`,
    description: drama.description,
    // Prefer the 16:9 backdrop for the thumbnail — Google recommends a
    // thumbnail matching the video's aspect ratio, and the 2:3 poster
    // gets awkwardly cropped in video-rich-result previews.
    thumbnailUrl: drama.backdrop || drama.poster ? [drama.backdrop || drama.poster] : undefined,
    uploadDate: toIsoDate(drama.dateAired) || toIsoDate(drama.premiered),
    duration: duration || undefined,
    contentUrl: episode?.videoUrl || undefined,
    embedUrl: pageUrl,
    inLanguage: 'km',
    contentRating: drama.contentRating || undefined,
  }
}

// #2 — Playlist structure for TV series: a TVSeason containing every
// episode as a TVEpisode, each linking to its own watch URL.
export function buildPlaylistSchema(drama) {
  if (drama.type === 'Movie' || !drama.episodes?.length) return undefined
  return {
    '@type': 'TVSeason',
    numberOfEpisodes: drama.episodes.length,
    episode: drama.episodes.map((ep) => ({
      '@type': 'TVEpisode',
      episodeNumber: ep.number,
      name: `${drama.title} EP ${ep.number}`,
      duration: toIsoDuration(ep.duration || drama.duration) || undefined,
      url:
        typeof window !== 'undefined'
          ? `${window.location.origin}${buildWatchPath(drama, ep.number)}`
          : buildWatchPath(drama, ep.number),
    })),
  }
}

// #5 — BreadcrumbList: Home > Category > Drama > Episode.
export function buildBreadcrumbSchema({ drama, categoryLabel, activeEp, pageUrl }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const items = [
    { name: 'ទំព័រដើម', url: `${origin}/` },
    categoryLabel
      ? { name: categoryLabel, url: `${origin}/?category=${drama.category}` }
      : null,
    { name: drama.title, url: `${origin}${buildWatchPath(drama, activeEp)}` },
    drama.type !== 'Movie' ? { name: `EP ${activeEp}`, url: pageUrl } : null,
  ].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// #6 — WatchAction: tells Google this page can be watched directly,
// which is what powers the "Watch" chip in Video/TV search results.
export function buildWatchActionSchema(pageUrl) {
  return {
    '@type': 'WatchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: pageUrl,
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
  }
}
