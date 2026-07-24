import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { sendMail } from '../mailer.js'

const router = Router()
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173'

function createResetToken(accountId, isAdmin) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()
  db.prepare(
    'INSERT INTO password_resets (account_id, is_admin, token, expires_at) VALUES (?, ?, ?, ?)',
  ).run(accountId, isAdmin ? 1 : 0, token, expiresAt)
  return token
}

function findValidToken(token, isAdmin) {
  const row = db
    .prepare(
      'SELECT * FROM password_resets WHERE token = ? AND is_admin = ? AND used = 0',
    )
    .get(token, isAdmin ? 1 : 0)
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) return null
  return row
}

// POST /api/password-reset/request — visitor user forgot-password request.
// Always responds the same way whether or not the email exists, so this
// endpoint can't be used to enumerate registered accounts.
router.post('/request', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (user) {
    const token = createResetToken(user.id, false)
    const link = `${SITE_URL}/reset-password?token=${token}`
    await sendMail({
      to: user.email,
      subject: 'ស្តារពាក្យសម្ងាត់ - DramaTV',
      html: `<p>សួស្តី ${user.name},</p>
        <p>អ្នកបានស្នើសុំស្តារពាក្យសម្ងាត់។ ចុច link ខាងក្រោមដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី (មានសុពលភាព ៣០ នាទី)៖</p>
        <p><a href="${link}">${link}</a></p>
        <p>បើអ្នកមិនបានស្នើសុំ សូមមិនអើពើសារនេះ។</p>`,
    })
  }

  res.json({ ok: true, message: 'បើមានគណនីជាមួយអ៊ីមែលនេះ លីង reset នឹងត្រូវផ្ញើទៅ។' })
})

// POST /api/password-reset/confirm — set a new password using a valid token
router.post('/confirm', (req, res) => {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const resetRow = findValidToken(token, false)
  if (!resetRow) {
    return res.status(400).json({ error: 'Token មិនត្រឹមត្រូវ ឬបានផុតកំណត់ សូមស្នើសុំម្តងទៀត។' })
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, resetRow.account_id)
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id)

  res.json({ ok: true })
})

// POST /api/password-reset/admin-request — admin forgot-password request.
// Sends to the admin's registered email if one is set (admins table has no
// email column in the original schema, so this relies on ADMIN_NOTIFY_EMAIL
// in .env as the single admin recovery address for simplicity).
router.post('/admin-request', async (req, res) => {
  const { username } = req.body || {}
  if (!username) return res.status(400).json({ error: 'Username is required' })

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL

  if (admin && notifyEmail) {
    const token = createResetToken(admin.id, true)
    const link = `${SITE_URL}/admin/reset-password?token=${token}`
    await sendMail({
      to: notifyEmail,
      subject: 'ស្តារពាក្យសម្ងាត់ Admin - DramaTV',
      html: `<p>មានការស្នើសុំស្តារពាក្យសម្ងាត់សម្រាប់គណនី Admin "${admin.username}"។</p>
        <p>ចុច link ខាងក្រោម (មានសុពលភាព ៣០ នាទី)៖</p>
        <p><a href="${link}">${link}</a></p>
        <p>បើអ្នកមិនបានស្នើសុំ សូមមិនអើពើសារនេះ។</p>`,
    })
  }

  res.json({ ok: true, message: 'បើ Username ត្រឹមត្រូវ លីង reset នឹងត្រូវផ្ញើទៅអ៊ីមែល Admin ដែលបានកំណត់។' })
})

// POST /api/password-reset/admin-confirm — set a new admin password
router.post('/admin-confirm', (req, res) => {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const resetRow = findValidToken(token, true)
  if (!resetRow) {
    return res.status(400).json({ error: 'Token មិនត្រឹមត្រូវ ឬបានផុតកំណត់ សូមស្នើសុំម្តងទៀត។' })
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, resetRow.account_id)
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id)

  res.json({ ok: true })
})

export default router
