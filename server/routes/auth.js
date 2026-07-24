import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { verifySync } from 'otplib'
import db from '../db.js'
import { signToken, requireAuth } from '../auth.js'

const router = Router()

// otplib v13 dropped the old `authenticator.check()` singleton API in
// favor of this functional form — see server/routes/twoFactor.js for the
// matching setup/enable/disable endpoints.
function checkCode(token, secret) {
  return verifySync({ secret, token: String(token || '') })
}

router.post('/login', (req, res) => {
  const { username, password, code } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const valid = bcrypt.compareSync(password, admin.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  // Two-step login when 2FA is enabled: username+password alone returns
  // requiresCode=true (no token yet) — the frontend then re-submits with
  // the 6-digit code included to actually get a session token.
  if (admin.totp_enabled) {
    if (!code) {
      return res.json({ requiresCode: true })
    }
    const validCode = checkCode(code, admin.totp_secret)
    if (!validCode) {
      return res.status(401).json({ error: 'កូដ 2FA មិនត្រឹមត្រូវ' })
    }
  }

  const token = signToken({ id: admin.id, username: admin.username })
  res.json({ token, username: admin.username })
})

// PUT /api/auth/password — change the signed-in admin's password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {}

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id)
  if (!admin) return res.status(404).json({ error: 'Admin not found' })

  const valid = bcrypt.compareSync(currentPassword, admin.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, admin.id)
  res.json({ ok: true })
})

export default router
