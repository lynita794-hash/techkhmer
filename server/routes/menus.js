import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapMenu(row) {
  return {
    id: row.id,
    location: row.location,
    label: row.label,
    labelEn: row.label_en || '',
    url: row.url,
    openNewTab: !!row.open_new_tab,
    sortOrder: row.sort_order,
    groupId: row.group_id ?? null,
  }
}

// GET /api/menus — list all menu links, optionally filtered by ?location= (public)
router.get('/', (req, res) => {
  const { location } = req.query
  const rows = location
    ? db
        .prepare('SELECT * FROM menus WHERE location = ? ORDER BY sort_order, id')
        .all(location)
    : db.prepare('SELECT * FROM menus ORDER BY location, sort_order, id').all()

  res.json(rows.map(mapMenu))
})

// POST /api/menus — create a new menu link (admin only)
router.post('/', requireAuth, (req, res) => {
  const { location, label, labelEn, url, openNewTab, groupId } = req.body || {}
  if (!label || !url) {
    return res.status(400).json({ error: 'label and url are required' })
  }

  const loc = location || 'navbar'
  // Footer links are ordered per-column (group), everything else per-location.
  const maxOrder =
    loc === 'footer' && groupId
      ? db
          .prepare('SELECT MAX(sort_order) AS m FROM menus WHERE location = ? AND group_id = ?')
          .get(loc, groupId).m || 0
      : db.prepare('SELECT MAX(sort_order) AS m FROM menus WHERE location = ?').get(loc).m || 0

  const result = db
    .prepare(
      'INSERT INTO menus (location, label, label_en, url, open_new_tab, sort_order, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(loc, label, labelEn || null, url, openNewTab ? 1 : 0, maxOrder + 1, groupId || null)

  const row = db.prepare('SELECT * FROM menus WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapMenu(row))
})

// PUT /api/menus/:id — update a menu link (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Menu item not found' })

  const b = req.body || {}
  db.prepare(
    'UPDATE menus SET location = ?, label = ?, label_en = ?, url = ?, open_new_tab = ?, sort_order = ?, group_id = ? WHERE id = ?',
  ).run(
    b.location ?? existing.location,
    b.label ?? existing.label,
    b.labelEn === undefined ? existing.label_en : b.labelEn || null,
    b.url ?? existing.url,
    b.openNewTab === undefined ? existing.open_new_tab : b.openNewTab ? 1 : 0,
    b.sortOrder ?? existing.sort_order,
    b.groupId === undefined ? existing.group_id : b.groupId || null,
    existing.id,
  )

  const row = db.prepare('SELECT * FROM menus WHERE id = ?').get(existing.id)
  res.json(mapMenu(row))
})

// DELETE /api/menus/:id — remove a menu link (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM menus WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Menu item not found' })

  db.prepare('DELETE FROM menus WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/menus/reorder — bulk update sort order (admin only)
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' })
  }

  const update = db.prepare('UPDATE menus SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

export default router
