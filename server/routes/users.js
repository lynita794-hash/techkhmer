import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { signToken, requireUserAuth, requireAuth } from '../auth.js'
import { logActivity } from '../activityLog.js'

const router = Router()

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function mapUser(row) {
  return { id: row.id, name: row.name, email: row.email }
}

function mapUserForAdmin(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isBlocked: !!row.is_blocked,
    createdAt: row.created_at,
  }
}

// POST /api/users/register — create a new visitor account
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hash)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  const token = signToken({ id: user.id, email: user.email, role: 'user' })
  res.status(201).json({ token, user: mapUser(user) })
})

// POST /api/users/login — sign in to an existing account
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (user.is_blocked) {
    return res.status(403).json({ error: 'This account has been blocked' })
  }

  const token = signToken({ id: user.id, email: user.email, role: 'user' })
  res.json({ token, user: mapUser(user) })
})

// GET /api/users/me — return the currently signed-in user
router.get('/me', requireUserAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.is_blocked) return res.status(403).json({ error: 'This account has been blocked' })
  res.json({ user: mapUser(user) })
})

// GET /api/users — list all visitor accounts (admin only)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  res.json(rows.map(mapUserForAdmin))
})

// PUT /api/users/:id/block — block or unblock a visitor account (admin only)
router.put('/:id/block', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'User not found' })

  const { blocked } = req.body || {}
  db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(
    blocked ? 1 : 0,
    existing.id,
  )
  logActivity(
    req.admin,
    blocked ? 'block_user' : 'unblock_user',
    existing.email,
    `id=${existing.id}`,
  )

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id)
  res.json(mapUserForAdmin(row))
})

// DELETE /api/users/:id — permanently delete a visitor account (admin only).
// Comments, watchlist entries, and watch history for this user are
// removed automatically via ON DELETE CASCADE foreign keys in db.js.
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'User not found' })

  db.prepare('DELETE FROM users WHERE id = ?').run(existing.id)
  logActivity(req.admin, 'delete_user', existing.email, `id=${existing.id}`)

  res.status(204).end()
})

export default router
