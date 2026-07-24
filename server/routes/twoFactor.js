import { Router } from 'express'
import { generateSecret, generateURI, verifySync } from 'otplib'
import qrcode from 'qrcode'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// otplib v13 dropped the old `authenticator` singleton in favor of a
// functional API — these two small wrappers keep the rest of this file
// reading the same way the old `authenticator.check()`/`.keyuri()` did.
function checkCode(token, secret) {
  return verifySync({ secret, token: String(token || '') })
}

function buildOtpUri(username, secret) {
  return generateURI({
    issuer: 'DramaTV Admin',
    label: username,
    secret,
  })
}

// GET /api/2fa/setup — generate a new TOTP secret + QR code for the signed
// -in admin to scan with Google Authenticator/Authy. Doesn't enable 2FA yet
// — that only happens after /api/2fa/enable confirms one valid code, so an
// admin can't accidentally lock themselves out by scanning but never
// verifying the code actually works.
router.get('/setup', requireAuth, async (req, res) => {
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id)
  if (!admin) return res.status(404).json({ error: 'Admin not found' })

  const secret = generateSecret()
  db.prepare('UPDATE admins SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(
    secret,
    admin.id,
  )

  const otpUrl = buildOtpUri(admin.username, secret)
  const qrDataUrl = await qrcode.toDataURL(otpUrl)

  res.json({ secret, qrDataUrl })
})

// POST /api/2fa/enable — confirm the admin can generate a valid code from
// their authenticator app, then actually require it on future logins.
router.post('/enable', requireAuth, (req, res) => {
  const { code } = req.body || {}
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id)
  if (!admin?.totp_secret) {
    return res.status(400).json({ error: 'សូម Setup 2FA (Scan QR Code) មុនសិន។' })
  }

  const valid = checkCode(code, admin.totp_secret)
  if (!valid) {
    return res.status(400).json({ error: 'កូដមិនត្រឹមត្រូវ សូមព្យាយាមម្តងទៀត។' })
  }

  db.prepare('UPDATE admins SET totp_enabled = 1 WHERE id = ?').run(admin.id)
  res.json({ ok: true })
})

// POST /api/2fa/disable — turn 2FA back off (requires current code, so a
// stolen session token alone can't disable it)
router.post('/disable', requireAuth, (req, res) => {
  const { code } = req.body || {}
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id)
  if (!admin?.totp_enabled) {
    return res.json({ ok: true }) // already off
  }

  const valid = checkCode(code, admin.totp_secret)
  if (!valid) {
    return res.status(400).json({ error: 'កូដមិនត្រឹមត្រូវ' })
  }

  db.prepare('UPDATE admins SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(admin.id)
  res.json({ ok: true })
})

// GET /api/2fa/status — whether 2FA is currently enabled for this admin
router.get('/status', requireAuth, (req, res) => {
  const admin = db.prepare('SELECT totp_enabled FROM admins WHERE id = ?').get(req.admin.id)
  res.json({ enabled: !!admin?.totp_enabled })
})

export default router
