import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapGroup(row, links) {
  return {
    id: row.id,
    label: row.label,
    labelEn: row.label_en || '',
    sortOrder: row.sort_order,
    links: links.map((l) => ({
      id: l.id,
      label: l.label,
      labelEn: l.label_en || '',
      url: l.url,
      openNewTab: !!l.open_new_tab,
      sortOrder: l.sort_order,
    })),
  }
}

// GET /api/footer-groups — list all footer columns with their links (public,
// used to render the Footer component)
router.get('/', (req, res) => {
  const groups = db
    .prepare('SELECT * FROM footer_groups ORDER BY sort_order, id')
    .all()
  const allLinks = db
    .prepare(
      "SELECT * FROM menus WHERE location = 'footer' AND group_id IS NOT NULL ORDER BY sort_order, id",
    )
    .all()

  const result = groups.map((g) =>
    mapGroup(g, allLinks.filter((l) => l.group_id === g.id)),
  )
  res.json(result)
})

// POST /api/footer-groups — create a new footer column (admin only)
router.post('/', requireAuth, (req, res) => {
  const { label, labelEn } = req.body || {}
  if (!label) return res.status(400).json({ error: 'label is required' })

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM footer_groups').get().m
  const result = db
    .prepare('INSERT INTO footer_groups (label, label_en, sort_order) VALUES (?, ?, ?)')
    .run(label, labelEn || null, (maxOrder ?? -1) + 1)

  const row = db.prepare('SELECT * FROM footer_groups WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapGroup(row, []))
})

// PUT /api/footer-groups/:id — rename a footer column (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM footer_groups WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Footer column not found' })

  const { label, labelEn } = req.body || {}
  db.prepare('UPDATE footer_groups SET label = ?, label_en = ? WHERE id = ?').run(
    label ?? existing.label,
    labelEn === undefined ? existing.label_en : labelEn || null,
    existing.id,
  )

  const links = db
    .prepare("SELECT * FROM menus WHERE location = 'footer' AND group_id = ? ORDER BY sort_order, id")
    .all(existing.id)
  const row = db.prepare('SELECT * FROM footer_groups WHERE id = ?').get(existing.id)
  res.json(mapGroup(row, links))
})

// DELETE /api/footer-groups/:id — remove a footer column. Links inside it
// are also deleted (a column with no links makes no sense to keep).
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM footer_groups WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Footer column not found' })

  db.prepare("DELETE FROM menus WHERE location = 'footer' AND group_id = ?").run(existing.id)
  db.prepare('DELETE FROM footer_groups WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/footer-groups/reorder — persist new column display order (admin only)
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' })

  const update = db.prepare('UPDATE footer_groups SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

export default router
