import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import authRoutes from './routes/auth.js'
import dramaRoutes from './routes/dramas.js'
import userRoutes from './routes/users.js'
import categoryRoutes from './routes/categories.js'
import settingsRoutes from './routes/settings.js'
import statsRoutes from './routes/stats.js'
import commentRoutes from './routes/comments.js'
import menuRoutes from './routes/menus.js'
import footerGroupRoutes from './routes/footerGroups.js'
import tmdbRoutes from './routes/tmdb.js'
import backupRoutes from './routes/backup.js'
import adRoutes from './routes/ads.js'
import slideRoutes from './routes/slides.js'
import prerollAdRoutes from './routes/prerollAds.js'
import sitemapRoutes from './routes/sitemap.js'
import watchlistRoutes from './routes/watchlist.js'
import passwordResetRoutes from './routes/passwordReset.js'
import watchHistoryRoutes from './routes/watchHistory.js'
import twoFactorRoutes from './routes/twoFactor.js'
import activityLogRoutes from './routes/activityLog.js'
import { requireAuth } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// crossOriginResourcePolicy set to "cross-origin" — otherwise helmet's
// default blocks uploaded posters/backdrops from /uploads when the
// frontend runs on a different origin during local dev (:5173 vs :4000).
// contentSecurityPolicy disabled here since this app injects admin-authored
// HTML/JS (Ads, Header/Footer code) that a strict default CSP would break;
// a custom CSP tailored to this app's needs would be a separate follow-up.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '2mb' }))

// --- Rate limiting: slow down brute-force attempts on auth endpoints ---
// General API limiter — generous, just to blunt scraping/abuse. A single
// page load already fires several requests (dramas, ads, settings, slides,
// categories, menus...), so this needs real headroom for normal browsing.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
})
// Strict limiter for login/register — the main brute-force target.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ព្យាយាមច្រើនដងហួសកំណត់ សូមរង់ចាំ ១៥ នាទី រួចព្យាយាមម្តងទៀត។' },
})
app.use('/api', apiLimiter)
app.use(['/api/auth/login', '/api/users/login', '/api/users/register'], authLimiter)

// --- File uploads (poster images) ---
const uploadsDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})

// Uploaded posters/backdrops never change once uploaded (new uploads get a
// fresh filename), so browsers can cache them for a long time.
app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }))

app.post('/api/upload', requireAuth, upload.single('poster'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

// --- API routes ---
app.use('/api/auth', authRoutes)
app.use('/api/dramas', dramaRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/menus', menuRoutes)
app.use('/api/footer-groups', footerGroupRoutes)
app.use('/api/tmdb', tmdbRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/ads', adRoutes)
app.use('/api/slides', slideRoutes)
app.use('/api/preroll-ads', prerollAdRoutes)
app.use('/api/watchlist', watchlistRoutes)
app.use('/api/password-reset', passwordResetRoutes)
app.use('/api/watch-history', watchHistoryRoutes)
app.use('/api/2fa', twoFactorRoutes)
app.use('/api/activity-log', activityLogRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

// --- sitemap.xml (not under /api since it must be served from site root) ---
app.use(sitemapRoutes)

// --- Serve the built frontend (dist/) in production ---
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  // Vite fingerprints JS/CSS filenames (e.g. index-abc123.js), so those are
  // safe to cache forever; index.html itself must always revalidate.
  app.use(
    express.static(distDir, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    }),
  )
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// --- Error handler ---
// eslint-disable-next-line no-unused-vars -- Express requires 4 args to recognize this as an error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

app.listen(PORT)
