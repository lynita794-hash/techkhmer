import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapAd(row) {
  return {
    id: row.id,
    videoUrl: row.video_url,
    clickUrl: row.click_url || '',
    skipSeconds: row.skip_seconds,
    enabled: !!row.enabled,
    sortOrder: row.sort_order,
  }
}

// GET /api/preroll-ads/random — one random ENABLED ad from the pool
// (public). The Watch page calls this once per session instead of always
// showing the same ad, so admins can rotate multiple video creatives.
// Returns null if the pool is empty or every ad is disabled.
router.get('/random', (req, res) => {
  const rows = db.prepare('SELECT * FROM preroll_ads WHERE enabled = 1').all()
  if (rows.length === 0) return res.json(null)
  const picked = rows[Math.floor(Math.random() * rows.length)]
  res.json(mapAd(picked))
})

// GET /api/preroll-ads — full pool including disabled ads (admin only)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM preroll_ads ORDER BY sort_order, id').all()
  res.json(rows.map(mapAd))
})

// POST /api/preroll-ads — add a new ad to the pool (admin only)
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' })
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM preroll_ads').get().m ?? -1

  const result = db
    .prepare(
      'INSERT INTO preroll_ads (video_url, click_url, skip_seconds, enabled, sort_order) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      b.videoUrl,
      b.clickUrl || null,
      Math.min(120, Math.max(0, Number(b.skipSeconds) || 5)),
      b.enabled === false ? 0 : 1,
      maxOrder + 1,
    )

  const row = db.prepare('SELECT * FROM preroll_ads WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapAd(row))
})

// PUT /api/preroll-ads/:id — update an ad in the pool (admin only)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM preroll_ads WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Preroll ad not found' })

  const b = req.body || {}
  const skipSeconds =
    b.skipSeconds === undefined
      ? existing.skip_seconds
      : Math.min(120, Math.max(0, Number(b.skipSeconds) || 0))

  db.prepare(
    'UPDATE preroll_ads SET video_url = ?, click_url = ?, skip_seconds = ?, enabled = ? WHERE id = ?',
  ).run(
    b.videoUrl ?? existing.video_url,
    b.clickUrl ?? existing.click_url,
    skipSeconds,
    b.enabled === undefined ? existing.enabled : b.enabled ? 1 : 0,
    existing.id,
  )

  const row = db.prepare('SELECT * FROM preroll_ads WHERE id = ?').get(existing.id)
  res.json(mapAd(row))
})

// DELETE /api/preroll-ads/:id — remove an ad from the pool (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM preroll_ads WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Preroll ad not found' })

  db.prepare('DELETE FROM preroll_ads WHERE id = ?').run(existing.id)
  res.status(204).end()
})

// POST /api/preroll-ads/reorder — persist new order (admin only)
// Body: { ids: [adId, ...] } top-to-bottom order.
router.post('/reorder', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const update = db.prepare('UPDATE preroll_ads SET sort_order = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, Number(id)))

  res.json({ ok: true })
})

export default router
