import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { fetchSettings } from './utils/adminApi'
import { injectHtmlSnippet } from './utils/injectSnippet'
import { applyContentProtection } from './utils/contentProtection'
import { ADMIN_BASE_PATH } from './config/adminPath'
import FloatingAds from './components/FloatingAds'
import HomePage from './pages/HomePage'
import WatchPage from './pages/WatchPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import DmcaPage from './pages/DmcaPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import WatchlistPage from './pages/WatchlistPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

// Admin Panel pages are only needed by admins, not the general public
// visiting the site — lazy-loading them keeps the initial bundle that
// every visitor downloads smaller (Admin code ships in separate chunks
// fetched on demand when someone actually navigates to /admin/*).
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminDramaForm = lazy(() => import('./pages/admin/AdminDramaForm'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminPlaylist = lazy(() => import('./pages/admin/AdminPlaylist'))
const AdminMenus = lazy(() => import('./pages/admin/AdminMenus'))
const AdminFooterManager = lazy(() => import('./pages/admin/AdminFooterManager'))
const AdminHomeLayout = lazy(() => import('./pages/admin/AdminHomeLayout'))
const AdminAds = lazy(() => import('./pages/admin/AdminAds'))
const AdminSlider = lazy(() => import('./pages/admin/AdminSlider'))
const AdminComments = lazy(() => import('./pages/admin/AdminComments'))
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'))
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'))
const AdminActivityLog = lazy(() => import('./pages/admin/AdminActivityLog'))

// Darkens a hex color by a percentage — used to derive the ":hover" shade
// from the admin's chosen primary color so buttons still have a visible
// hover state without asking for a second color pick.
function darkenHex(hex, percent) {
  const clean = (hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex
  const num = parseInt(clean, 16)
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - percent))
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - percent))
  const b = Math.max(0, (num & 0xff) * (1 - percent))
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Fallback stack used for any character a chosen Google Font doesn't
// cover — Arial handles Latin/English, Battambang/Khmer OS cover Khmer
// glyphs. Browsers automatically fall back per-character (not per-element)
// when a font in the stack lacks a glyph, so combining the admin's
// English + Khmer picks into one stack (English pick, Khmer pick, then
// this fallback) lets a single mixed-language string render each
// character with the right font automatically.
const FALLBACK_FONT_STACK = "Arial, 'Battambang', 'Khmer OS', Helvetica, sans-serif"

// Loads a Google Font via a <link> tag (the standard embed method Google
// Fonts recommends) if a name is given. Returns a cleanup function that
// removes the <link> again (no-op if nothing was loaded).
function loadGoogleFontLink(fontName) {
  if (!fontName) return () => {}

  const familyParam = fontName.trim().replace(/\s+/g, '+')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;600;700&display=swap`
  document.head.appendChild(link)

  return () => link.parentNode?.removeChild(link)
}

// Builds a font-family CSS value from an ordered list of chosen font
// names (skipping empty ones), always ending in the fallback stack.
function buildFontStack(...fontNames) {
  const quoted = fontNames.filter(Boolean).map((name) => `'${name}'`)
  return quoted.length > 0 ? `${quoted.join(', ')}, ${FALLBACK_FONT_STACK}` : FALLBACK_FONT_STACK
}

function App() {
  const [customCss, setCustomCss] = useState('')
  const [themeCss, setThemeCss] = useState('')

  useEffect(() => {
    let cancelled = false
    let removeHeader = () => {}
    let removeFooter = () => {}
    let removeFontLinks = () => {}
    let removeContentProtection = () => {}

    fetchSettings()
      .then((data) => {
        if (cancelled) return
        setCustomCss(data.customCss || '')

        // Never apply to /admin/* — admins need normal right-click/DevTools
        // access to manage their own site (inspecting layout issues,
        // copying values, etc.), even if they've enabled this deterrent
        // for regular visitors on the public site. Read directly from
        // location.pathname here (rather than a dependency) since this
        // effect intentionally only runs once on mount to fetch settings.
        if (!window.location.pathname.startsWith(`/${ADMIN_BASE_PATH}`)) {
          removeContentProtection = applyContentProtection({
            disableRightClick: data.disableRightClick,
            disableDevtools: data.disableDevtools,
            rightClickRedirectUrl: data.rightClickRedirectUrl,
          })
        }

        // 4 independent Google Font choices: Khmer text, English/Latin
        // text, Navbar menu links, and headings/titles. Each loads its
        // own <link> only if the admin picked a font for that area.
        const removeKhmer = loadGoogleFontLink(data.googleFontKhmer)
        const removeEnglish = loadGoogleFontLink(data.googleFontEnglish)
        const removeMenu = loadGoogleFontLink(data.googleFontMenu)
        const removeTitle = loadGoogleFontLink(data.googleFontTitle)
        removeFontLinks = () => {
          removeKhmer()
          removeEnglish()
          removeMenu()
          removeTitle()
        }

        // Body text combines the English pick first, then Khmer — so in
        // a single mixed-language string, Latin characters render with
        // the English font and Khmer characters automatically fall back
        // to the Khmer font (see FALLBACK_FONT_STACK comment above).
        const bodyFont = buildFontStack(data.googleFontEnglish, data.googleFontKhmer)
        const menuFont = buildFontStack(data.googleFontMenu, data.googleFontKhmer)
        const titleFont = buildFontStack(data.googleFontTitle, data.googleFontKhmer)

        // Build a small stylesheet that overrides the default CSS variables
        // (defined in index.css) with the admin's chosen theme colors.
        const primary = data.themePrimaryColor || '#e50914'
        const playlist = data.themePlaylistColor || '#e50914'
        setThemeCss(`:root {
  --color-primary: ${primary};
  --color-primary-hover: ${darkenHex(primary, 0.15)};
  --color-navbar-bg: ${data.themeNavbarBg || '#0d0d0d'};
  --color-footer-bg: ${data.themeFooterBg || '#0a0a0a'};
  --color-body-bg: ${data.themeBodyBg || '#0d0d0d'};
  --color-playlist-btn: ${playlist};
  --color-playlist-btn-hover: ${darkenHex(playlist, 0.15)};
  --site-max-width: ${data.siteWidth || 1280}px;
  --grid-columns: ${data.gridColumns || 6};
  --episode-columns: ${data.episodeColumns || 5};
  --episode-columns-mobile: ${data.episodeColumnsMobile || 6};
  --episode-button-scale: ${data.episodeButtonScale || 1};
  --color-heading: ${data.themeHeadingColor || '#ffffff'};
  --color-text: ${data.themeTextColor || '#e5e5e5'};
  --color-card-bg: ${data.themeCardBg || '#1a1a1a'};
  --color-rating: ${data.themeRatingColor || '#f7941d'};
  --color-new-badge: ${data.themeNewBadgeColor || '#22c55e'};
  --color-end-badge: ${data.themeEndBadgeColor || '#6c7280'};
  --font-family: ${bodyFont};
  --font-family-menu: ${menuFont};
  --font-family-title: ${titleFont};
}`)

        // Header snippet (e.g. Google Analytics <script>, Search Console
        // <meta> verification tag) goes into <head>.
        removeHeader = injectHtmlSnippet(data.headerCode, document.head)
        // Footer snippet goes right before </body>.
        removeFooter = injectHtmlSnippet(data.footerCode, document.body)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      removeHeader()
      removeFooter()
      removeFontLinks()
      removeContentProtection()
    }
  }, [])

  return (
    <div className="app">
      {themeCss && <style>{themeCss}</style>}
      {customCss && <style>{customCss}</style>}
      <FloatingAds />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/drama/:titleSlug/:epSlug" element={<WatchPage />} />
        <Route path="/drama/:titleSlug" element={<WatchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/dmca" element={<DmcaPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />

        <Route
          path={`/${ADMIN_BASE_PATH}/login`}
          element={
            <Suspense fallback={<div className="admin-lazy-loading" />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path={`/${ADMIN_BASE_PATH}/forgot-password`}
          element={
            <Suspense fallback={<div className="admin-lazy-loading" />}>
              <AdminForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path={`/${ADMIN_BASE_PATH}/reset-password`}
          element={
            <Suspense fallback={<div className="admin-lazy-loading" />}>
              <AdminResetPasswordPage />
            </Suspense>
          }
        />
        <Route
          path={`/${ADMIN_BASE_PATH}`}
          element={
            <Suspense fallback={<div className="admin-lazy-loading" />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dramas/new" element={<AdminDramaForm />} />
          <Route path="dramas/:id/edit" element={<AdminDramaForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="playlist" element={<AdminPlaylist />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="footer" element={<AdminFooterManager />} />
          <Route path="home-layout" element={<AdminHomeLayout />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="slider" element={<AdminSlider />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="activity-log" element={<AdminActivityLog />} />
        </Route>

        {/* The old, well-known /admin path (when ADMIN_BASE_PATH has been
            customized) intentionally falls through to the 404 page below
            like any other unknown URL — no route registered for it, no
            redirect hinting that "admin" used to work here. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
