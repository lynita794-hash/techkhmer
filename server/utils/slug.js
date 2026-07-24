// Server-side copy of the slug logic in src/utils/slug.js — kept in sync
// manually since the two run in different environments (browser vs Node).
// Used by the sitemap generator to build the same watch URLs the frontend
// produces for each drama.
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
