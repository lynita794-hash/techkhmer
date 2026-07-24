// Helper for calling the admin-protected /api/dramas endpoints with the JWT token.

async function request(path, token, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'មានបញ្ហាកើតឡើង សូមព្យាយាមម្តងទៀត។')
  }
  return data
}

export function fetchDramas() {
  return fetch('/api/dramas').then((res) => res.json())
}

export function fetchDrama(id) {
  return fetch(`/api/dramas/${id}`).then((res) => res.json())
}

// Fire-and-forget: records one view for this drama (called once per Watch
// page visit). Never throws — a failed view-count ping should never break
// video playback.
export function recordDramaView(id) {
  return fetch(`/api/dramas/${id}/view`, { method: 'POST' }).catch(() => {})
}

export function createDrama(token, payload) {
  return request('/dramas', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDrama(token, id, payload) {
  return request(`/dramas/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteDrama(token, id) {
  return request(`/dramas/${id}`, token, { method: 'DELETE' })
}

export function bulkDeleteDramas(token, ids) {
  return request('/dramas/bulk-delete', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function bulkChangeCategory(token, ids, category) {
  return request('/dramas/bulk-category', token, {
    method: 'POST',
    body: JSON.stringify({ ids, category }),
  })
}

export function reorderDramas(token, ids) {
  return request('/dramas/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function moveDrama(token, id, direction) {
  return request(`/dramas/${id}/move`, token, {
    method: 'PUT',
    body: JSON.stringify({ direction }),
  })
}

// --- Categories ---
export function fetchCategories() {
  return fetch('/api/categories').then((res) => res.json())
}

export function createCategory(token, payload) {
  return request('/categories', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCategory(token, id, payload) {
  return request(`/categories/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(token, id) {
  return request(`/categories/${id}`, token, { method: 'DELETE' })
}

// --- Users (admin management) ---
export function fetchUsers(token) {
  return request('/users', token)
}

export function setUserBlocked(token, id, blocked) {
  return request(`/users/${id}/block`, token, {
    method: 'PUT',
    body: JSON.stringify({ blocked }),
  })
}

export function deleteUser(token, id) {
  return request(`/users/${id}`, token, { method: 'DELETE' })
}

// --- Site settings ---
export function fetchSettings() {
  return fetch('/api/settings').then((res) => res.json())
}

export function updateHomeSections(token, homeSections) {
  return request('/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ homeSections }),
  })
}

export function fetchAdminSettings(token) {
  return request('/settings/admin', token)
}

export function updateSettings(token, payload) {
  return request('/settings', token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// --- Stats ---
export function fetchStats(token) {
  return request('/stats', token)
}

// --- Comments ---
export function fetchComments(dramaId) {
  return fetch(`/api/comments?dramaId=${dramaId}`).then((res) => res.json())
}

// Every comment site-wide (with drama title attached), for Admin Panel >
// Comment Moderation. Optional `search` filters by comment content,
// commenter name, or drama title.
export function fetchAllComments(token, search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request(`/comments/all${query}`, token)
}

export function bulkDeleteComments(token, ids) {
  return request('/comments/bulk-delete', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

// Posting uses a signed-in visitor's JWT (not the admin token), but the
// generic `request()` helper works the same either way — it just sends
// whatever bearer token it's given.
export function postComment(token, dramaId, content) {
  return request('/comments', token, {
    method: 'POST',
    body: JSON.stringify({ dramaId, content }),
  })
}

export function deleteComment(token, id) {
  return request(`/comments/${id}`, token, { method: 'DELETE' })
}

// --- Admin password ---
export function changeAdminPassword(token, currentPassword, newPassword) {
  return request('/auth/password', token, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// --- Menus ---
export function fetchMenus(location) {
  const query = location ? `?location=${encodeURIComponent(location)}` : ''
  return fetch(`/api/menus${query}`).then((res) => res.json())
}

export function createMenu(token, payload) {
  return request('/menus', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMenu(token, id, payload) {
  return request(`/menus/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMenu(token, id) {
  return request(`/menus/${id}`, token, { method: 'DELETE' })
}

export function reorderMenus(token, ids) {
  return request('/menus/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

// --- Footer groups (columns) ---
export function fetchFooterGroups() {
  return fetch('/api/footer-groups').then((res) => res.json())
}

export function createFooterGroup(token, payload) {
  return request('/footer-groups', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFooterGroup(token, id, payload) {
  return request(`/footer-groups/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteFooterGroup(token, id) {
  return request(`/footer-groups/${id}`, token, { method: 'DELETE' })
}

export function reorderFooterGroups(token, ids) {
  return request('/footer-groups/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

// --- Watchlist (signed-in visitors) ---
export function fetchWatchlist(token) {
  return request('/watchlist', token)
}

export function fetchWatchlistIds(token) {
  return request('/watchlist/ids', token)
}

export function addToWatchlist(token, dramaId) {
  return request('/watchlist', token, {
    method: 'POST',
    body: JSON.stringify({ dramaId }),
  })
}

export function removeFromWatchlist(token, dramaId) {
  return request(`/watchlist/${dramaId}`, token, { method: 'DELETE' })
}

// --- Ads Manager ---
export function fetchAds() {
  return fetch('/api/ads').then((res) => res.json())
}

export function fetchAdsAdmin(token) {
  return request('/ads/admin', token)
}

export function createAd(token, payload) {
  return request('/ads', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAd(token, id, payload) {
  return request(`/ads/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAd(token, id) {
  return request(`/ads/${id}`, token, { method: 'DELETE' })
}

export function reorderAds(token, ids) {
  return request('/ads/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

// --- Homepage slider ---
export function fetchSlides() {
  return fetch('/api/slides').then((res) => res.json())
}

// Looks up the slide auto-linked to a given drama (if any) — used by
// AdminDramaForm to decide whether to create, update, or remove that
// drama's Banner Slider entry as its Backdrop URL changes.
export function fetchSlideByDrama(token, dramaId) {
  return request(`/slides/by-drama/${dramaId}`, token)
}

export function createSlide(token, payload) {
  return request('/slides', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSlide(token, id, payload) {
  return request(`/slides/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSlide(token, id) {
  return request(`/slides/${id}`, token, { method: 'DELETE' })
}

// --- Preroll Video Ads (pool — one picked at random per Watch session) ---
export function fetchRandomPrerollAd() {
  return fetch('/api/preroll-ads/random').then((res) => res.json())
}

export function fetchPrerollAds(token) {
  return request('/preroll-ads', token)
}

export function createPrerollAd(token, payload) {
  return request('/preroll-ads', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePrerollAd(token, id, payload) {
  return request(`/preroll-ads/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePrerollAd(token, id) {
  return request(`/preroll-ads/${id}`, token, { method: 'DELETE' })
}

export function reorderPrerollAds(token, ids) {
  return request('/preroll-ads/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function reorderSlides(token, ids) {
  return request('/slides/reorder', token, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function updateSliderEnabled(token, sliderEnabled) {
  return request('/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ sliderEnabled }),
  })
}

// --- TMDB import ---
export function searchTmdb(token, query, type = 'tv') {
  const params = new URLSearchParams({ query, type })
  return request(`/tmdb/search?${params.toString()}`, token)
}

export function fetchTmdbDetails(token, id, type = 'tv') {
  const params = new URLSearchParams({ id, type })
  return request(`/tmdb/details?${params.toString()}`, token)
}

// --- Full site backup (export/import) ---
export async function exportBackup(token) {
  const res = await fetch('/api/backup/export', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Export បរាជ័យ')
  }
  return res.blob()
}

export function importBackup(token, backupJson) {
  return request('/backup/import', token, {
    method: 'POST',
    body: JSON.stringify({ data: backupJson.data }),
  })
}

export async function uploadPoster(token, file) {
  const formData = new FormData()
  formData.append('poster', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Upload ជាមួយបញ្ហា')
  }
  return data.url
}

// --- Forgot password (visitor users) ---
export function requestPasswordReset(email) {
  return fetch('/api/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'មានបញ្ហាកើតឡើង')
    return data
  })
}

export function confirmPasswordReset(token, newPassword) {
  return fetch('/api/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'មានបញ្ហាកើតឡើង')
    return data
  })
}

// --- Forgot password (admin) ---
export function requestAdminPasswordReset(username) {
  return fetch('/api/password-reset/admin-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'មានបញ្ហាកើតឡើង')
    return data
  })
}

export function confirmAdminPasswordReset(token, newPassword) {
  return fetch('/api/password-reset/admin-confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'មានបញ្ហាកើតឡើង')
    return data
  })
}

// --- Watch History (Continue Watching) ---
export function fetchWatchHistory(token) {
  return request('/watch-history', token)
}

export function updateWatchHistory(token, dramaId, episodeNumber, positionSeconds) {
  return request('/watch-history', token, {
    method: 'PUT',
    body: JSON.stringify({ dramaId, episodeNumber, positionSeconds }),
  })
}

export function removeWatchHistory(token, dramaId) {
  return request(`/watch-history/${dramaId}`, token, { method: 'DELETE' })
}

// Every episode number the signed-in user has fully watched for this
// drama — used to show "watched" checkmarks in the Episode Playlist.
export function fetchWatchedEpisodes(token, dramaId) {
  return request(`/watch-history/watched/${dramaId}`, token)
}

export function markEpisodeWatched(token, dramaId, episodeNumber) {
  return request('/watch-history/watched', token, {
    method: 'POST',
    body: JSON.stringify({ dramaId, episodeNumber }),
  })
}

// --- Admin 2FA ---
export function setup2FA(token) {
  return request('/2fa/setup', token)
}

export function enable2FA(token, code) {
  return request('/2fa/enable', token, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function disable2FA(token, code) {
  return request('/2fa/disable', token, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function fetch2FAStatus(token) {
  return request('/2fa/status', token)
}

// --- Admin Activity Log ---
export function fetchActivityLog(token, limit = 100) {
  return request(`/activity-log?limit=${limit}`, token)
}
