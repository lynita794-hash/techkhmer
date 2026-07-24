import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import { logActivity } from '../activityLog.js'

const router = Router()

function mapDrama(row) {
  const episodeRows = db
    .prepare(
      'SELECT number, video_url AS videoUrl, subtitles, duration, sources, is_new AS isNew, is_end AS isEnd, is_cc AS isCc, cc_text AS ccText FROM episodes WHERE drama_id = ? ORDER BY number',
    )
    .all(row.id)

  const episodes = episodeRows.map((ep) => ({
    number: ep.number,
    videoUrl: ep.videoUrl,
    subtitles: JSON.parse(ep.subtitles || '[]'),
    duration: ep.duration || null,
    // Multi-server mirror links, e.g. [{ label: "Server 1", url }, ...].
    // Falls back to a single "Server 1" entry built from video_url for
    // episodes saved before this column existed.
    sources: ep.sources
      ? JSON.parse(ep.sources)
      : ep.videoUrl
        ? [{ label: 'Server 1', url: ep.videoUrl }]
        : [],
    // Manually flagged by the admin (Video Episodes section) — shows the
    // "NEW" badge in the Episode Playlist while the drama is ONGOING.
    isNew: !!ep.isNew,
    // Manually flagged "END" badge — marks the final episode of the
    // drama/season, independent of drama.status.
    isEnd: !!ep.isEnd,
    // Manually flagged CC/SUB footer tag — defaults to on (see db.js
    // migration) so older episodes keep behaving as before; admins can
    // turn it off per-episode for entries missing subtitles.
    isCc: ep.isCc === undefined ? true : !!ep.isCc,
    // Optional custom text typed by the admin to replace the default
    // "SUB" wording in the CC footer tag (e.g. "ENG SUB").
    ccText: ep.ccText || '',
  }))

  return {
    id: row.id,
    title: row.title,
    // Optional Khmer-language title, typed separately by the admin — not
    // auto-filled from TMDB (which only returns English/romanized
    // titles). Falls back to null when unset; UI decides how to display
    // it (e.g. alongside or instead of the main title).
    titleKh: row.title_kh || null,
    poster: row.poster,
    category: row.category,
    status: row.status,
    type: row.type,
    quality: row.quality || 'HD',
    premiered: row.premiered,
    broadcast: row.broadcast,
    dateAired: row.date_aired,
    duration: row.duration,
    contentRating: row.content_rating,
    backdrop: row.backdrop,
    producers: row.producers,
    studios: row.studios,
    source: row.source,
    country: row.country,
    rating: row.rating,
    votes: row.votes,
    description: row.description,
    genres: JSON.parse(row.genres || '[]'),
    ep: row.total_episodes,
    hasSubtitle: !!row.has_subtitle,
    sortOrder: row.sort_order,
    trailerUrl: row.trailer_url,
    updatedAt: row.updated_at,
    views: row.views || 0,
    episodes,
  }
}

// GET /api/dramas — list all dramas ordered by sort_order (public)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM dramas ORDER BY sort_order, id').all()
  res.json(rows.map(mapDrama))
})

// GET /api/dramas/:id — single drama with episodes (public)
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Drama not found' })
  res.json(mapDrama(row))
})

// POST /api/dramas/:id/view — record one view (public, called once per
// Watch page visit). No auth required since anonymous visitors count too;
// intentionally not de-duplicated per-visitor (keeping this simple, like
// a page-view counter rather than a strict unique-viewer count).
router.post('/:id/view', (req, res) => {
  const existing = db.prepare('SELECT id FROM dramas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Drama not found' })

  db.prepare('UPDATE dramas SET views = views + 1 WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/dramas — create a new drama (admin only)
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.title || !b.category) {
    return res.status(400).json({ error: 'title and category are required' })
  }

  const totalEpisodes = Number(b.ep) || 0

  const insertDrama = db.prepare(`
    INSERT INTO dramas (
      title, title_kh, poster, category, status, type, quality, premiered, broadcast, date_aired,
      duration, content_rating, backdrop, producers, studios, source, country, rating, votes,
      description, genres, total_episodes, has_subtitle, sort_order, trailer_url
    ) VALUES (
      @title, @title_kh, @poster, @category, @status, @type, @quality, @premiered, @broadcast, @date_aired,
      @duration, @content_rating, @backdrop, @producers, @studios, @source, @country, @rating, @votes,
      @description, @genres, @total_episodes, @has_subtitle, @sort_order, @trailer_url
    )
  `)

  // New dramas appear at the top of the list by default
  const minOrder = db.prepare('SELECT MIN(sort_order) AS m FROM dramas').get().m
  const newSortOrder = minOrder !== null ? minOrder - 1 : 0

  const result = insertDrama.run({
    title: b.title,
    title_kh: b.titleKh || null,
    poster: b.poster || null,
    category: b.category,
    status: b.status || 'ONGOING',
    type: b.type || 'TV Series',
    quality: b.quality || 'HD',
    premiered: b.premiered || null,
    broadcast: b.broadcast || null,
    date_aired: b.dateAired || null,
    duration: b.duration || null,
    content_rating: b.contentRating || null,
    backdrop: b.backdrop || null,
    producers: b.producers || null,
    studios: b.studios || null,
    source: b.source || null,
    country: b.country || null,
    rating: b.rating || 0,
    votes: b.votes || 0,
    description: b.description || '',
    genres: JSON.stringify(b.genres || []),
    total_episodes: totalEpisodes,
    has_subtitle: b.hasSubtitle === false ? 0 : 1,
    sort_order: newSortOrder,
    trailer_url: b.trailerUrl || null,
  })

  const dramaId = result.lastInsertRowid
  const insertEpisode = db.prepare(
    'INSERT INTO episodes (drama_id, number, video_url, subtitles, duration, sources, is_new, is_end, is_cc, cc_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const episodes = Array.isArray(b.episodes) ? b.episodes : []

  for (let i = 1; i <= totalEpisodes; i += 1) {
    const found = episodes.find((e) => Number(e.number) === i)
    const subtitles = Array.isArray(found?.subtitles)
      ? found.subtitles.filter((s) => s.url)
      : []
    // Normalize `sources` from the incoming payload (multi-server
    // mirrors); fall back to wrapping the legacy single `videoUrl` field
    // as a "Server 1" entry so older admin UIs / API calls still work.
    const sources = Array.isArray(found?.sources)
      ? found.sources.filter((s) => s.url?.trim())
      : found?.videoUrl
        ? [{ label: 'Server 1', url: found.videoUrl }]
        : []
    // video_url stays the primary/first source — this is what
    // VideoPlayer actually plays, keeping playback logic untouched.
    const primaryUrl = sources[0]?.url || found?.videoUrl || ''
    insertEpisode.run(
      dramaId,
      i,
      primaryUrl,
      JSON.stringify(subtitles),
      found?.duration || null,
      JSON.stringify(sources),
      found?.isNew ? 1 : 0,
      found?.isEnd ? 1 : 0,
      found?.isCc === false ? 0 : 1,
      found?.ccText || null,
    )
  }

  const row = db.prepare('SELECT * FROM dramas WHERE id = ?').get(dramaId)
  res.status(201).json(mapDrama(row))
})

// PUT /api/dramas/:id — update an existing drama (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Drama not found' })

  const b = req.body || {}
  const totalEpisodes = b.ep !== undefined ? Number(b.ep) : existing.total_episodes

  db.prepare(`
    UPDATE dramas SET
      title = @title, title_kh = @title_kh, poster = @poster, category = @category, status = @status,
      type = @type, quality = @quality, premiered = @premiered, broadcast = @broadcast, date_aired = @date_aired,
      duration = @duration, content_rating = @content_rating, backdrop = @backdrop, producers = @producers, studios = @studios, source = @source,
      country = @country, rating = @rating, votes = @votes, description = @description,
      genres = @genres, total_episodes = @total_episodes, has_subtitle = @has_subtitle,
      trailer_url = @trailer_url, updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id: existing.id,
    title: b.title ?? existing.title,
    title_kh: b.titleKh ?? existing.title_kh,
    poster: b.poster ?? existing.poster,
    category: b.category ?? existing.category,
    status: b.status ?? existing.status,
    type: b.type ?? existing.type,
    quality: b.quality ?? existing.quality,
    premiered: b.premiered ?? existing.premiered,
    broadcast: b.broadcast ?? existing.broadcast,
    date_aired: b.dateAired ?? existing.date_aired,
    duration: b.duration ?? existing.duration,
    content_rating: b.contentRating ?? existing.content_rating,
    backdrop: b.backdrop ?? existing.backdrop,
    producers: b.producers ?? existing.producers,
    studios: b.studios ?? existing.studios,
    source: b.source ?? existing.source,
    country: b.country ?? existing.country,
    rating: b.rating ?? existing.rating,
    votes: b.votes ?? existing.votes,
    description: b.description ?? existing.description,
    genres: JSON.stringify(b.genres ?? JSON.parse(existing.genres || '[]')),
    total_episodes: totalEpisodes,
    has_subtitle: b.hasSubtitle === undefined ? existing.has_subtitle : (b.hasSubtitle ? 1 : 0),
    trailer_url: b.trailerUrl ?? existing.trailer_url,
  })

  // Sync episodes: keep existing video URLs, add/remove rows to match totalEpisodes
  if (Array.isArray(b.episodes)) {
    const insertEpisode = db.prepare(
      'INSERT INTO episodes (drama_id, number, video_url, subtitles, duration, sources, is_new, is_end, is_cc, cc_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(drama_id, number) DO UPDATE SET video_url = excluded.video_url, subtitles = excluded.subtitles, duration = excluded.duration, sources = excluded.sources, is_new = excluded.is_new, is_end = excluded.is_end, is_cc = excluded.is_cc, cc_text = excluded.cc_text',
    )
    for (const ep of b.episodes) {
      const subtitles = Array.isArray(ep.subtitles)
        ? ep.subtitles.filter((s) => s.url)
        : []
      const sources = Array.isArray(ep.sources)
        ? ep.sources.filter((s) => s.url?.trim())
        : ep.videoUrl
          ? [{ label: 'Server 1', url: ep.videoUrl }]
          : []
      const primaryUrl = sources[0]?.url || ep.videoUrl || ''
      insertEpisode.run(
        existing.id,
        Number(ep.number),
        primaryUrl,
        JSON.stringify(subtitles),
        ep.duration || null,
        JSON.stringify(sources),
        ep.isNew ? 1 : 0,
        ep.isEnd ? 1 : 0,
        ep.isCc === false ? 0 : 1,
        ep.ccText || null,
      )
    }
    db.prepare('DELETE FROM episodes WHERE drama_id = ? AND number > ?').run(
      existing.id,
      totalEpisodes,
    )
  }

  const row = db.prepare('SELECT * FROM dramas WHERE id = ?').get(existing.id)
  res.json(mapDrama(row))
})

// DELETE /api/dramas/:id — remove a drama and its episodes (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id, title FROM dramas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Drama not found' })

  db.prepare('DELETE FROM dramas WHERE id = ?').run(existing.id)
  logActivity(req.admin, 'delete_drama', existing.title, `id=${existing.id}`)
  res.status(204).end()
})

// POST /api/dramas/bulk-delete — remove multiple dramas at once (admin only)
router.post('/bulk-delete', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const del = db.prepare('DELETE FROM dramas WHERE id = ?')
  for (const id of ids) del.run(Number(id))
  logActivity(req.admin, 'bulk_delete_dramas', `${ids.length} dramas`, ids.join(','))

  res.json({ deleted: ids.length })
})

// POST /api/dramas/bulk-category — change category for multiple dramas (admin only)
router.post('/bulk-category', requireAuth, (req, res) => {
  const { ids, category } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0 || !category) {
    return res.status(400).json({ error: 'ids and category are required' })
  }

  const update = db.prepare('UPDATE dramas SET category = ? WHERE id = ?')
  for (const id of ids) update.run(category, Number(id))

  res.json({ updated: ids.length })
})

// POST /api/dramas/reorder — persist a full new display order (admin only)
// Body: { ids: [dramaId, ...] } in the desired top-to-bottom order.
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const update = db.prepare('UPDATE dramas SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

// PUT /api/dramas/:id/move — move a single drama to top or bottom (admin only)
// Body: { direction: 'top' | 'bottom' }
router.put('/:id/move', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM dramas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Drama not found' })

  const { direction } = req.body || {}
  if (direction !== 'top' && direction !== 'bottom') {
    return res.status(400).json({ error: "direction must be 'top' or 'bottom'" })
  }

  if (direction === 'top') {
    const minOrder = db.prepare('SELECT MIN(sort_order) AS m FROM dramas').get().m || 0
    db.prepare('UPDATE dramas SET sort_order = ? WHERE id = ?').run(minOrder - 1, existing.id)
  } else {
    const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM dramas').get().m || 0
    db.prepare('UPDATE dramas SET sort_order = ? WHERE id = ?').run(maxOrder + 1, existing.id)
  }

  res.json({ ok: true })
})

export default router
