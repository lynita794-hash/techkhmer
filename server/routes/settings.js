import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

// sliderMode: true so every default section renders as the same swipeable
// carousel on mobile — admins can flip any section back to Grid from
// Admin Panel > ការរៀបចំ Homepage.
const DEFAULT_HOME_SECTIONS = [
  { key: 'latest', label: 'LATEST UPDATED', visible: true, limit: 6, sliderMode: true },
  { key: 'movie', label: 'MOVIE', visible: true, limit: 6, sliderMode: true },
  { key: 'tvshow', label: 'TVSHOW', visible: true, limit: 6, sliderMode: true },
]

function parseHomeSections(raw) {
  if (!raw) return DEFAULT_HOME_SECTIONS
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Backfill sliderMode for sections saved before this field existed —
      // without this, old saved rows (sliderMode undefined) would silently
      // stay in Grid mode forever even though the site-wide default is now
      // Slider, since `undefined` is falsy and gets treated as "off".
      // Same idea for autoPlaySpeed — sections saved before this field
      // existed default to 3.5s (matching DramaSlider.jsx's own fallback).
      return parsed.map((s) => ({
        ...s,
        sliderMode: s.sliderMode === undefined ? true : s.sliderMode,
        autoPlaySpeed: s.autoPlaySpeed === undefined ? 3.5 : s.autoPlaySpeed,
      }))
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_HOME_SECTIONS
}

function mapSettings(row) {
  return {
    siteName: row.site_name,
    logoUrl: row.logo_url,
    seoDescription: row.seo_description,
    customCss: row.custom_css || '',
    headerCode: row.header_code || '',
    footerCode: row.footer_code || '',
    footerDescription: row.footer_description || '',
    socialFacebook: row.social_facebook || '',
    socialTelegram: row.social_telegram || '',
    socialYoutube: row.social_youtube || '',
    footerCopyright: row.footer_copyright || '',
    showFooterBrand: !!row.show_footer_brand,
    showFooterSocial: !!row.show_footer_social,
    showFooterPages: !!row.show_footer_pages,
    showFooterLegal: !!row.show_footer_legal,
    showFooterCategories: !!row.show_footer_categories,
    themePrimaryColor: row.theme_primary_color || '#e50914',
    themeNavbarBg: row.theme_navbar_bg || '#0d0d0d',
    themeFooterBg: row.theme_footer_bg || '#0a0a0a',
    themeBodyBg: row.theme_body_bg || '#0d0d0d',
    themePlaylistColor: row.theme_playlist_color || '#e50914',
    themeHeadingColor: row.theme_heading_color || '#ffffff',
    themeTextColor: row.theme_text_color || '#e5e5e5',
    themeCardBg: row.theme_card_bg || '#1a1a1a',
    themeRatingColor: row.theme_rating_color || '#f7941d',
    themeNewBadgeColor: row.theme_new_badge_color || '#22c55e',
    themeEndBadgeColor: row.theme_end_badge_color || '#6c7280',
    googleFontKhmer: row.google_font_khmer || '',
    googleFontEnglish: row.google_font_english || '',
    googleFontMenu: row.google_font_menu || '',
    googleFontTitle: row.google_font_title || '',
    disableRightClick: !!row.disable_right_click,
    disableDevtools: !!row.disable_devtools,
    rightClickRedirectUrl: row.right_click_redirect_url || '',
    homeSections: parseHomeSections(row.home_sections),
    sliderEnabled: row.slider_enabled === undefined ? true : !!row.slider_enabled,
    siteWidth: row.site_width || 1280,
    gridColumns: row.grid_columns || 6,
    episodeColumns: row.episode_columns || 5,
    episodeColumnsMobile: row.episode_columns_mobile || 6,
    episodeButtonScale: row.episode_button_scale || 1,
    prerollEnabled: !!row.preroll_enabled,
    autoPlayVideo: !!row.auto_play_video,
  }
}

// Admin-only view includes sensitive fields like the TMDB API key
function mapSettingsForAdmin(row) {
  return {
    ...mapSettings(row),
    tmdbApiKey: row.tmdb_api_key || '',
  }
}

// GET /api/settings — public site settings (used by frontend Logo/meta tags)
router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get()
  res.json(mapSettings(row))
})

// GET /api/settings/admin — full settings including TMDB key (admin only)
router.get('/admin', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get()
  res.json(mapSettingsForAdmin(row))
})

// PUT /api/settings — update site settings (admin only)
router.put('/', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM site_settings WHERE id = 1').get()
  const b = req.body || {}

  const toBit = (value, fallback) => (value === undefined ? fallback : value ? 1 : 0)

  // Clamp to a sane range — an unbounded value could make the site
  // unusable (e.g. a typo'd 12800 stretching everything off-screen).
  const clampSiteWidth = (value, fallback) => {
    if (value === undefined) return fallback
    const num = Number(value)
    if (!Number.isFinite(num)) return fallback
    return Math.min(2560, Math.max(960, Math.round(num)))
  }

  // Clamp columns-per-row to something that still fits a poster + title
  // without shrinking to an unusable size (2-10 columns).
  const clampGridColumns = (value, fallback) => {
    if (value === undefined) return fallback
    const num = Number(value)
    if (!Number.isFinite(num)) return fallback
    return Math.min(10, Math.max(2, Math.round(num)))
  }

  // Clamp episode-columns-per-row similarly (3-10) — an episode button
  // still needs enough width to show its number legibly.
  const clampEpisodeColumns = (value, fallback) => {
    if (value === undefined) return fallback
    const num = Number(value)
    if (!Number.isFinite(num)) return fallback
    return Math.min(10, Math.max(3, Math.round(num)))
  }

  // Clamp the Episode button size multiplier to 0.7-1.5x — outside this
  // range text either becomes unreadably small or the button overflows
  // its grid cell.
  const clampEpisodeButtonScale = (value, fallback) => {
    if (value === undefined) return fallback
    const num = Number(value)
    if (!Number.isFinite(num)) return fallback
    return Math.min(1.5, Math.max(0.7, num))
  }





  // Google Font family names are just words/spaces (e.g. "Noto Sans
  // Khmer", "Poppins") — reject anything containing characters that
  // don't belong in a font name, since this value gets built directly
  // into a Google Fonts <link> URL in App.jsx and shouldn't allow
  // injecting arbitrary query params or markup. Shared by all 4
  // per-area font fields (Khmer/English/Menu/Title).
  const sanitizeGoogleFont = (value, fallback) => {
    if (value === undefined) return fallback
    const trimmed = String(value).trim()
    if (!trimmed) return null
    return /^[a-zA-Z0-9\s]+$/.test(trimmed) ? trimmed : fallback
  }

  db.prepare(
    `UPDATE site_settings SET
      site_name = ?, logo_url = ?, seo_description = ?, tmdb_api_key = ?,
      custom_css = ?, header_code = ?, footer_code = ?, footer_description = ?,
      social_facebook = ?, social_telegram = ?, social_youtube = ?, footer_copyright = ?,
      show_footer_brand = ?, show_footer_social = ?, show_footer_pages = ?,
      show_footer_legal = ?, show_footer_categories = ?, theme_primary_color = ?,
      theme_navbar_bg = ?, theme_footer_bg = ?, theme_body_bg = ?, theme_playlist_color = ?,
      home_sections = ?, slider_enabled = ?, site_width = ?, grid_columns = ?,
      episode_columns = ?, episode_columns_mobile = ?, episode_button_scale = ?,
      theme_heading_color = ?, theme_text_color = ?, theme_card_bg = ?, theme_rating_color = ?,
      theme_new_badge_color = ?, theme_end_badge_color = ?,
      google_font_khmer = ?, google_font_english = ?, google_font_menu = ?, google_font_title = ?,
      disable_right_click = ?, disable_devtools = ?, right_click_redirect_url = ?,
      preroll_enabled = ?, auto_play_video = ?
    WHERE id = 1`,
  ).run(
    b.siteName ?? existing.site_name,
    b.logoUrl ?? existing.logo_url,
    b.seoDescription ?? existing.seo_description,
    b.tmdbApiKey ?? existing.tmdb_api_key,
    b.customCss ?? existing.custom_css,
    b.headerCode ?? existing.header_code,
    b.footerCode ?? existing.footer_code,
    b.footerDescription ?? existing.footer_description,
    b.socialFacebook ?? existing.social_facebook,
    b.socialTelegram ?? existing.social_telegram,
    b.socialYoutube ?? existing.social_youtube,
    b.footerCopyright ?? existing.footer_copyright,
    toBit(b.showFooterBrand, existing.show_footer_brand),
    toBit(b.showFooterSocial, existing.show_footer_social),
    toBit(b.showFooterPages, existing.show_footer_pages),
    toBit(b.showFooterLegal, existing.show_footer_legal),
    toBit(b.showFooterCategories, existing.show_footer_categories),
    b.themePrimaryColor ?? existing.theme_primary_color,
    b.themeNavbarBg ?? existing.theme_navbar_bg,
    b.themeFooterBg ?? existing.theme_footer_bg,
    b.themeBodyBg ?? existing.theme_body_bg,
    b.themePlaylistColor ?? existing.theme_playlist_color,
    b.homeSections ? JSON.stringify(b.homeSections) : existing.home_sections,
    toBit(b.sliderEnabled, existing.slider_enabled),
    clampSiteWidth(b.siteWidth, existing.site_width),
    clampGridColumns(b.gridColumns, existing.grid_columns),
    clampEpisodeColumns(b.episodeColumns, existing.episode_columns),
    clampEpisodeColumns(b.episodeColumnsMobile, existing.episode_columns_mobile),
    clampEpisodeButtonScale(b.episodeButtonScale, existing.episode_button_scale),
    b.themeHeadingColor ?? existing.theme_heading_color,
    b.themeTextColor ?? existing.theme_text_color,
    b.themeCardBg ?? existing.theme_card_bg,
    b.themeRatingColor ?? existing.theme_rating_color,
    b.themeNewBadgeColor ?? existing.theme_new_badge_color,
    b.themeEndBadgeColor ?? existing.theme_end_badge_color,
    sanitizeGoogleFont(b.googleFontKhmer, existing.google_font_khmer),
    sanitizeGoogleFont(b.googleFontEnglish, existing.google_font_english),
    sanitizeGoogleFont(b.googleFontMenu, existing.google_font_menu),
    sanitizeGoogleFont(b.googleFontTitle, existing.google_font_title),
    toBit(b.disableRightClick, existing.disable_right_click),
    toBit(b.disableDevtools, existing.disable_devtools),
    b.rightClickRedirectUrl ?? existing.right_click_redirect_url,
    toBit(b.prerollEnabled, existing.preroll_enabled),
    toBit(b.autoPlayVideo, existing.auto_play_video),
  )

  const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get()
  res.json(mapSettingsForAdmin(row))
})

export default router
