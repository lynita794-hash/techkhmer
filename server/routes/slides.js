import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapSlide(row) {
  return {
    id: row.id,
    image: row.image,
    title: row.title || '',
    link: row.link || '',
    sortOrder: row.sort_order,
    dramaId: row.drama_id || null,
  }
}

// GET /api/slides — public list of slides, ordered for the hero slider
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM slides ORDER BY sort_order, id').all()
  res.json(rows.map(mapSlide))
})

// GET /api/slides/by-drama/:dramaId — the slide auto-linked to a given
// drama, if any (admin only — used by AdminDramaForm to know whether to
// create vs. update vs. leave alone when the Backdrop URL changes).
router.get('/by-drama/:dramaId', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM slides WHERE drama_id = ?')
    .get(Number(req.params.dramaId))
  res.json(row ? mapSlide(row) : null)
})

// POST /api/slides — add a new slide (admin only)
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.image) {
    return res.status(400).json({ error: 'image is required' })
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM slides').get().m ?? -1

  const result = db
    .prepare('INSERT INTO slides (image, title, link, sort_order, drama_id) VALUES (?, ?, ?, ?, ?)')
    .run(b.image, b.title || '', b.link || '', maxOrder + 1, b.dramaId || null)

  const row = db.prepare('SELECT * FROM slides WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapSlide(row))
})

// PUT /api/slides/:id — update a slide (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM slides WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Slide not found' })

  const b = req.body || {}
  db.prepare('UPDATE slides SET image = ?, title = ?, link = ? WHERE id = ?').run(
    b.image ?? existing.image,
    b.title ?? existing.title,
    b.link ?? existing.link,
    existing.id,
  )

  const row = db.prepare('SELECT * FROM slides WHERE id = ?').get(existing.id)
  res.json(mapSlide(row))
})

// DELETE /api/slides/:id — remove a slide (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM slides WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Slide not found' })

  db.prepare('DELETE FROM slides WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/slides/reorder — persist a new display order (admin only)
// Body: { ids: [slideId, ...] } top-to-bottom order.
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const update = db.prepare('UPDATE slides SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

export default router
