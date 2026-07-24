import nodemailer from 'nodemailer'

// Shared SMTP transport used by password-reset emails and comment/new-user
// notifications. Configured entirely via server/.env — if SMTP_HOST is not
// set, `sendMail` becomes a safe no-op (logs to console instead of
// throwing), so the rest of the app keeps working in local dev without
// requiring a real mail server.
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const MAIL_FROM = process.env.MAIL_FROM || 'DramaTV <no-reply@dramatv.local>'

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null

export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured — skipping email to ${to}: ${subject}`)
    return { skipped: true }
  }

  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, html })
    return { sent: true }
  } catch (err) {
    // Email failures should never crash the request that triggered them
    // (e.g. registering an account, posting a comment) — just log it.
    console.error('[mailer] Failed to send email:', err.message)
    return { error: err.message }
  }
}
