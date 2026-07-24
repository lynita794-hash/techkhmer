import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// GET /api/categories — list all categories (public, used by Navbar/filters)
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM categories ORDER BY sort_order, id')
    .all()
  res.json(
    rows.map((r) => ({ id: r.id, key: r.key, label: r.label, sortOrder: r.sort_order })),
  )
})

// POST /api/categories — create a new category (admin only)
router.post('/', requireAuth, (req, res) => {
  const { key, label } = req.body || {}
  if (!key || !label) {
    return res.status(400).json({ error: 'key and label are required' })
  }

  const existing = db.prepare('SELECT id FROM categories WHERE key = ?').get(key)
  if (existing) {
    return res.status(409).json({ error: 'A category with this key already exists' })
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM categories').get().m || 0
  const result = db
    .prepare('INSERT INTO categories (key, label, sort_order) VALUES (?, ?, ?)')
    .run(key, label, maxOrder + 1)

  res.status(201).json({ id: result.lastInsertRowid, key, label, sortOrder: maxOrder + 1 })
})

// PUT /api/categories/:id — update a category's label (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Category not found' })

  const { label } = req.body || {}
  db.prepare('UPDATE categories SET label = ? WHERE id = ?').run(
    label ?? existing.label,
    existing.id,
  )

  res.json({ id: existing.id, key: existing.key, label: label ?? existing.label })
})

// DELETE /api/categories/:id — remove a category (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Category not found' })

  db.prepare('DELETE FROM categories WHERE id = ?').run(existing.id)
  res.status(204).end()
})

export default router
