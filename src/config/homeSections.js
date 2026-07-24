// Default homepage row-sections (LATEST UPDATED / MOVIE / TVSHOW). Admins can
// add, delete, reorder, rename, hide, or change the item count per section
// from Admin Panel > ការរៀបចំ Homepage. `type` drives which dramas populate
// the section; `key` is a unique id (React key + storage identity) so
// admins can add more than one section of the same type (e.g. two separate
// "By Category" rows). Older saved data may not have `type` yet — callers
// should fall back to `type || key` since the original 3 fixed keys match
// their type 1:1.
// sliderMode defaults to true so every default section renders as the same
// swipeable carousel on mobile (matches how MOVIE already looked) instead
// of a static wrapping grid — admins can still flip any section back to
// Grid from Admin Panel > ការរៀបចំ Homepage.
// autoPlaySpeed is the interval (in seconds) between auto-advances when
// autoPlay is on — defaults to 3.5s to match the slider's built-in
// fallback in DramaSlider.jsx.
export const DEFAULT_HOME_SECTIONS = [
  { key: 'latest', type: 'latest', label: 'LATEST UPDATED', visible: true, limit: 6, sliderMode: true, autoPlay: false, autoPlaySpeed: 3.5 },
  { key: 'movie', type: 'movie', label: 'MOVIE', visible: true, limit: 6, sliderMode: true, autoPlay: false, autoPlaySpeed: 3.5 },
  { key: 'tvshow', type: 'tvshow', label: 'TVSHOW', visible: true, limit: 6, sliderMode: true, autoPlay: false, autoPlaySpeed: 3.5 },
]

// Section types selectable when adding a new section in Admin Panel.
export const SECTION_TYPE_OPTIONS = [
  { value: 'latest', label: 'ថ្មីៗ (Latest Updated)' },
  { value: 'movie', label: 'ភាពយន្ត (Movie)' },
  { value: 'tvshow', label: 'រឿងភាគ (TV Show)' },
  { value: 'category', label: 'តាម Category' },
]

// Where the "»" (see all) link of a section should navigate to.
export function getSectionMoreHref(section) {
  const type = section.type || section.key
  if (type === 'movie') return '?type=Movie'
  if (type === 'tvshow') return '?type=TV Series'
  if (type === 'latest') return '?sort=latest'
  if (type === 'category' && section.categoryKey) {
    return `?category=${encodeURIComponent(section.categoryKey)}`
  }
  return '#'
}

// Generates a unique, storage-safe key for a newly added section.
export function generateSectionKey(type) {
  return `${type}-${Date.now()}-${Math.round(Math.random() * 1e6)}`
}
