// The base path segment for the entire Admin Panel — defaults to "admin"
// (i.e. /admin, /admin/login, /admin/settings, ...) but can be overridden
// via VITE_ADMIN_PATH in a root .env file (see .env.example) to make the
// admin URL harder for outsiders to guess or find via automated scanners
// that probe common paths like /admin, /wp-admin, /administrator, etc.
//
// IMPORTANT — this is a build-time value, not a runtime setting:
// - It gets baked into the static JS bundle when you run `npm run build`.
// - Changing it requires editing .env and rebuilding — it cannot be
//   changed from inside the Admin Panel itself, since an admin who can't
//   find the (now-hidden) panel couldn't use it to change the path back.
// - This is a deterrent layer on top of (not a replacement for) real
//   authentication — the username/password + optional 2FA login is what
//   actually protects the panel; a custom path just keeps it off casual
//   scans and reduces noise from bots hammering the well-known /admin/*
//   paths every site gets probed on.
//
// Example .env:
//   VITE_ADMIN_PATH=my-secret-panel-x7k9
const raw = (import.meta.env.VITE_ADMIN_PATH || '').trim().replace(/^\/+|\/+$/g, '')

export const ADMIN_BASE_PATH = raw || 'admin'
