import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// Tables included in export/import, in an order safe for re-insertion
// (parents before children that reference them via foreign keys).
const TABLES = [
  'categories',
  'menus',
  'site_settings',
  'admins',
  'users',
  'dramas',
  'episodes',
  'comments',
  'ads',
  'slides',
  'watchlist',
  'watch_history',
  'admin_activity_log',
]

// GET /api/backup/export — download the entire database as a single JSON file (admin only)
router.get('/export', requireAuth, (req, res) => {
  const data = {}
  for (const table of TABLES) {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all()
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data,
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="dramatv-backup-${Date.now()}.json"`,
  )
  res.send(JSON.stringify(payload, null, 2))
})

// POST /api/backup/import — replace all data with the contents of an exported backup (admin only)
// Body: { data: { <table>: [...rows] } } — same shape produced by /export
router.post('/import', requireAuth, (req, res) => {
  const { data } = req.body || {}
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid backup file format' })
  }

  const currentAdminId = req.admin.id

  try {
    db.exec('BEGIN')

    // Delete in reverse order so foreign key constraints aren't violated
    for (const table of [...TABLES].reverse()) {
      db.exec(`DELETE FROM ${table}`)
    }

    for (const table of TABLES) {
      const rows = Array.isArray(data[table]) ? data[table] : []
      if (rows.length === 0) continue

      const columns = Object.keys(rows[0])
      const placeholders = columns.map((c) => `@${c}`).join(', ')
      const insert = db.prepare(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      )
      for (const row of rows) insert.run(row)
    }

    // Safety net: if the imported backup didn't include the admin account
    // that's currently logged in, keep it so the admin isn't locked out.
    const stillExists = db.prepare('SELECT id FROM admins WHERE id = ?').get(currentAdminId)
    if (!stillExists) {
      db.exec('ROLLBACK')
      return res.status(400).json({
        error:
          'Backup ត្រូវបានបំបែក ព្រោះគណនី admin បច្ចុប្បន្នមិននៅក្នុង backup ទេ។ ការ import ត្រូវបានលុបចោល។',
      })
    }

    db.exec('COMMIT')
    res.json({ ok: true, imported: TABLES.map((t) => ({ table: t, count: data[t]?.length || 0 })) })
  } catch (err) {
    db.exec('ROLLBACK')
    res.status(500).json({ error: `Import បរាជ័យ: ${err.message}` })
  }
})

export default router
