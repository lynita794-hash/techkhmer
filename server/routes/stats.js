import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// GET /api/stats — dashboard summary numbers (admin only)
router.get('/', requireAuth, (req, res) => {
  const totalDramas = db.prepare('SELECT COUNT(*) AS c FROM dramas').get().c
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  const totalEpisodes = db.prepare('SELECT COUNT(*) AS c FROM episodes').get().c
  const totalComments = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c
  const blockedUsers = db
    .prepare('SELECT COUNT(*) AS c FROM users WHERE is_blocked = 1')
    .get().c

  const byCategory = db
    .prepare('SELECT category, COUNT(*) AS count FROM dramas GROUP BY category')
    .all()

  res.json({
    totalDramas,
    totalUsers,
    totalEpisodes,
    totalComments,
    blockedUsers,
    byCategory,
  })
})

export default router
