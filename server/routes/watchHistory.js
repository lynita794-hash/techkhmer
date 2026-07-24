import { Router } from 'express'
import db from '../db.js'
import { requireUserAuth } from '../auth.js'

const router = Router()

function mapRow(row) {
  return {
    dramaId: row.drama_id,
    title: row.title,
    poster: row.poster,
    type: row.type,
    quality: row.quality,
    totalEpisodes: row.total_episodes,
    episodeNumber: row.episode_number,
    positionSeconds: row.position_seconds,
    updatedAt: row.updated_at,
  }
}

// GET /api/watch-history — "Continue Watching" list for the signed-in user,
// most recently watched first.
router.get('/', requireUserAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT wh.*, d.title, d.poster, d.type, d.quality, d.total_episodes
       FROM watch_history wh
       JOIN dramas d ON d.id = wh.drama_id
       WHERE wh.user_id = ?
       ORDER BY wh.updated_at DESC
       LIMIT 20`,
    )
    .all(req.user.id)

  res.json(rows.map(mapRow))
})

// PUT /api/watch-history — upsert the current watch position for a drama.
// Called periodically by the video player (e.g. every ~10s) and on
// episode change, so "Continue Watching" always reflects the latest spot.
router.put('/', requireUserAuth, (req, res) => {
  const { dramaId, episodeNumber, positionSeconds } = req.body || {}
  if (!dramaId || !episodeNumber) {
    return res.status(400).json({ error: 'dramaId and episodeNumber are required' })
  }

  const drama = db.prepare('SELECT id FROM dramas WHERE id = ?').get(dramaId)
  if (!drama) return res.status(404).json({ error: 'Drama not found' })

  db.prepare(
    `INSERT INTO watch_history (user_id, drama_id, episode_number, position_seconds, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, drama_id) DO UPDATE SET
       episode_number = excluded.episode_number,
       position_seconds = excluded.position_seconds,
       updated_at = datetime('now')`,
  ).run(req.user.id, dramaId, episodeNumber, positionSeconds || 0)

  res.json({ ok: true })
})

// DELETE /api/watch-history/:dramaId — remove one drama from history
// (e.g. a "Remove" button on the Continue Watching row)
router.delete('/:dramaId', requireUserAuth, (req, res) => {
  db.prepare('DELETE FROM watch_history WHERE user_id = ? AND drama_id = ?').run(
    req.user.id,
    req.params.dramaId,
  )
  res.status(204).end()
})

// GET /api/watch-history/watched/:dramaId — every episode number the
// signed-in user has finished for this drama, so the Episode Playlist can
// show a "watched" checkmark on each one (not just the most recent).
router.get('/watched/:dramaId', requireUserAuth, (req, res) => {
  const rows = db
    .prepare(
      'SELECT episode_number FROM episode_watched WHERE user_id = ? AND drama_id = ?',
    )
    .all(req.user.id, req.params.dramaId)

  res.json(rows.map((r) => r.episode_number))
})

// POST /api/watch-history/watched — mark one episode as fully watched.
// Called when playback reaches the end of an episode. Safe to call more
// than once for the same episode (UNIQUE constraint + INSERT OR IGNORE).
router.post('/watched', requireUserAuth, (req, res) => {
  const { dramaId, episodeNumber } = req.body || {}
  if (!dramaId || !episodeNumber) {
    return res.status(400).json({ error: 'dramaId and episodeNumber are required' })
  }

  const drama = db.prepare('SELECT id FROM dramas WHERE id = ?').get(dramaId)
  if (!drama) return res.status(404).json({ error: 'Drama not found' })

  db.prepare(
    'INSERT OR IGNORE INTO episode_watched (user_id, drama_id, episode_number) VALUES (?, ?, ?)',
  ).run(req.user.id, dramaId, episodeNumber)

  res.json({ ok: true })
})

export default router
