import db from './db.js'

// Records an admin action for the Activity Log. Call this from any route
// handler after a successful write, passing the admin from `req.admin`
// (set by requireAuth), a short action code, and a human-readable target/
// details string. Never throws — logging failures shouldn't break the
// actual operation that triggered them.
export function logActivity(admin, action, target, details) {
  try {
    db.prepare(
      'INSERT INTO admin_activity_log (admin_id, admin_username, action, target, details) VALUES (?, ?, ?, ?, ?)',
    ).run(admin?.id ?? null, admin?.username ?? 'unknown', action, target ?? null, details ?? null)
  } catch (err) {
    console.error('[activityLog] Failed to record activity:', err.message)
  }
}
