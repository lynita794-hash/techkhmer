import { Router } from 'express'
import db from '../db.js'
import { requireUserAuth } from '../auth.js'

const router = Router()

function mapDramaRow(row) {
  return {
    id: row.id,
    title: row.title,
    poster: row.poster,
    category: row.category,
    type: row.type,
    quality: row.quality,
    ep: row.total_episodes,
  }
}

// GET /api/watchlist — list the signed-in user's saved dramas
router.get('/', requireUserAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT d.* FROM watchlist w
       JOIN dramas d ON d.id = w.drama_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
    )
    .all(req.user.id)

  res.json(rows.map(mapDramaRow))
})

// GET /api/watchlist/ids — just the drama ids (cheap check for "is this
// drama already saved?" without fetching full drama rows every time).
router.get('/ids', requireUserAuth, (req, res) => {
  const rows = db
    .prepare('SELECT drama_id FROM watchlist WHERE user_id = ?')
    .all(req.user.id)
  res.json(rows.map((r) => r.drama_id))
})

// POST /api/watchlist — add a drama to the watchlist
router.post('/', requireUserAuth, (req, res) => {
  const { dramaId } = req.body || {}
  if (!dramaId) return res.status(400).json({ error: 'dramaId is required' })

  const drama = db.prepare('SELECT id FROM dramas WHERE id = ?').get(dramaId)
  if (!drama) return res.status(404).json({ error: 'Drama not found' })

  try {
    db.prepare('INSERT INTO watchlist (user_id, drama_id) VALUES (?, ?)').run(
      req.user.id,
      dramaId,
    )
  } catch {
    // Already saved (UNIQUE constraint) — treat as success, idempotent.
  }

  res.status(201).json({ ok: true })
})

// DELETE /api/watchlist/:dramaId — remove a drama from the watchlist
router.delete('/:dramaId', requireUserAuth, (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE user_id = ? AND drama_id = ?').run(
    req.user.id,
    req.params.dramaId,
  )
  res.status(204).end()
})

export default router
