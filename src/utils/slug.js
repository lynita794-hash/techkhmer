// Helpers to build SEO-friendly watch URLs like:
//   /drama/kumpy-yuthisil-banhchea-ke-ah-ka-cheat-khnhom-1/episode-3
// (drama / title-slug-id / episode-number)

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildTitleSlug(drama) {
  return `${slugify(drama.title)}-${drama.id}`
}

export function buildWatchPath(drama, ep = 1) {
  return `/drama/${buildTitleSlug(drama)}/episode-${ep}`
}

// Extracts the numeric drama id from a slug like "some-title-name-12"
export function extractIdFromSlug(slug) {
  const match = /-(\d+)$/.exec(String(slug || ''))
  return match ? Number(match[1]) : null
}

// Extracts the numeric episode number from a segment like "episode-3"
export function extractEpisodeNumber(epSlug) {
  const match = /(\d+)$/.exec(String(epSlug || ''))
  return match ? Number(match[1]) : 1
}
