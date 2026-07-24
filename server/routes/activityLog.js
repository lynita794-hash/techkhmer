import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function mapRow(row) {
  return {
    id: row.id,
    adminUsername: row.admin_username,
    action: row.action,
    target: row.target,
    details: row.details,
    createdAt: row.created_at,
  }
}

// GET /api/activity-log — most recent admin actions (admin only)
router.get('/', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const rows = db
    .prepare('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT ?')
    .all(limit)
  res.json(rows.map(mapRow))
})

export default router
