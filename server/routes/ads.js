import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapAd(row) {
  return {
    id: row.id,
    name: row.name,
    placement: row.placement,
    code: row.code,
    enabled: !!row.enabled,
    sortOrder: row.sort_order,
  }
}

// GET /api/ads — public list of ENABLED ads only, ordered for rendering.
// The frontend groups these by `placement` and injects `code` into the
// matching <AdSlot placement="..." /> on the page.
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM ads WHERE enabled = 1 ORDER BY placement, sort_order, id')
    .all()
  res.json(rows.map(mapAd))
})

// GET /api/ads/admin — full list including disabled ads (admin only)
router.get('/admin', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM ads ORDER BY placement, sort_order, id').all()
  res.json(rows.map(mapAd))
})

// POST /api/ads — create a new ad unit (admin only)
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.name || !b.placement || !b.code) {
    return res.status(400).json({ error: 'name, placement and code are required' })
  }

  const maxOrder =
    db.prepare('SELECT MAX(sort_order) AS m FROM ads WHERE placement = ?').get(b.placement).m ?? -1

  const result = db
    .prepare(
      'INSERT INTO ads (name, placement, code, enabled, sort_order) VALUES (?, ?, ?, ?, ?)',
    )
    .run(b.name, b.placement, b.code, b.enabled === false ? 0 : 1, maxOrder + 1)

  const row = db.prepare('SELECT * FROM ads WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapAd(row))
})

// PUT /api/ads/:id — update an ad unit (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM ads WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Ad not found' })

  const b = req.body || {}
  db.prepare(
    `UPDATE ads SET name = ?, placement = ?, code = ?, enabled = ? WHERE id = ?`,
  ).run(
    b.name ?? existing.name,
    b.placement ?? existing.placement,
    b.code ?? existing.code,
    b.enabled === undefined ? existing.enabled : b.enabled ? 1 : 0,
    existing.id,
  )

  const row = db.prepare('SELECT * FROM ads WHERE id = ?').get(existing.id)
  res.json(mapAd(row))
})

// DELETE /api/ads/:id — remove an ad unit (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM ads WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Ad not found' })

  db.prepare('DELETE FROM ads WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/ads/reorder — persist new order within a single placement (admin only)
// Body: { ids: [adId, ...] } top-to-bottom order for that placement.
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const update = db.prepare('UPDATE ads SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

export default router
