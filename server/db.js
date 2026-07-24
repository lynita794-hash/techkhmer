import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data.sqlite')

const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_name TEXT DEFAULT 'DramaTV',
    logo_url TEXT,
    seo_description TEXT,
    tmdb_api_key TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_comments_drama_id ON comments(drama_id);

  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL DEFAULT 'navbar',
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    open_new_tab INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_menus_location ON menus(location);

  -- Footer columns (e.g. "ទំព័រ", "ព័ត៌មានផ្លូវច្បាប់", "ប្រភេទ"). Admins can
  -- add/rename/delete/reorder these from the Admin Panel, and each menu
  -- link (location = 'footer') optionally belongs to one via group_id.
  CREATE TABLE IF NOT EXISTS footer_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dramas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    poster TEXT,
    category TEXT NOT NULL DEFAULT 'chinese',
    status TEXT NOT NULL DEFAULT 'ONGOING',
    type TEXT DEFAULT 'TV Series',
    quality TEXT DEFAULT 'HD',
    premiered INTEGER,
    broadcast TEXT,
    date_aired TEXT,
    duration TEXT,
    producers TEXT,
    studios TEXT,
    source TEXT,
    country TEXT,
    rating REAL DEFAULT 0,
    votes INTEGER DEFAULT 0,
    description TEXT,
    genres TEXT DEFAULT '[]',
    total_episodes INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    trailer_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Ad units admins can place at fixed slots around the site (homepage top/
  -- bottom, watch page above/below player, sidebar) without editing code.
  -- The code column holds raw HTML/JS (banner img/a tag, AdSense script, etc).
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    placement TEXT NOT NULL,
    code TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);

  -- Homepage hero slider images. Admins add/remove/reorder slides here;
  -- the whole slider can be turned on/off via site_settings.slider_enabled.
  CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    title TEXT,
    link TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    drama_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Pool of Preroll Video Ads shown before the real episode/movie starts
  -- on the Watch page. One is picked at random per session (see
  -- GET /api/preroll-ads) instead of always showing the same single
  -- video, so admins can rotate multiple ad creatives. The whole feature
  -- can be turned on/off via site_settings.preroll_enabled.
  CREATE TABLE IF NOT EXISTS preroll_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_url TEXT NOT NULL,
    click_url TEXT,
    skip_seconds INTEGER NOT NULL DEFAULT 5,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    subtitle_url TEXT,
    subtitles TEXT DEFAULT '[]',
    UNIQUE(drama_id, number)
  );

  CREATE INDEX IF NOT EXISTS idx_episodes_drama_id ON episodes(drama_id);
  CREATE INDEX IF NOT EXISTS idx_dramas_category ON dramas(category);

  -- Signed-in visitors can save dramas to their personal Watchlist.
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, drama_id)
  );

  CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

  -- Tracks the last-watched episode per (user, drama) so the homepage can
  -- show a "Continue Watching" row. One row per user+drama, overwritten
  -- on every episode change (not a full history log of every episode ever
  -- watched — just "where did they leave off").
  CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    position_seconds REAL NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, drama_id)
  );

  CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);

  -- Every episode a signed-in visitor has finished watching (reached the
  -- end of), per drama — unlike watch_history (which only remembers the
  -- single most recent position), this is a full log so the Episode
  -- Playlist can show a "watched" checkmark on every completed episode,
  -- not just the last one.
  CREATE TABLE IF NOT EXISTS episode_watched (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    watched_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, drama_id, episode_number)
  );

  CREATE INDEX IF NOT EXISTS idx_episode_watched_user_drama ON episode_watched(user_id, drama_id);

  -- One-time tokens for "forgot password" flows (both visitor users and
  -- admins). The is_admin flag distinguishes which table/login flow it
  -- applies to, since admins and visitor users are separate tables.
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

  -- Admin activity log — records who changed/deleted what and when, for
  -- accountability when more than one admin manages the site.
  CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    admin_username TEXT,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at);
`)

// Lightweight migration: add has_subtitle column if it doesn't exist yet
const columns = db.prepare('PRAGMA table_info(dramas)').all()
const hasSubtitleColumn = columns.some((c) => c.name === 'has_subtitle')
if (!hasSubtitleColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN has_subtitle INTEGER NOT NULL DEFAULT 1')
}

// Lightweight migration: add title_kh column — a separate Khmer-language
// title admins can type alongside the main `title` (usually English/
// romanized, e.g. from TMDB import). Nullable/optional: dramas without
// one just fall back to showing `title` everywhere (see mapDrama).
const hasTitleKhColumn = columns.some((c) => c.name === 'title_kh')
if (!hasTitleKhColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN title_kh TEXT')
}

// Lightweight migration: add subtitle_url column to episodes if missing
const episodeColumns = db.prepare('PRAGMA table_info(episodes)').all()
const hasSubtitleUrlColumn = episodeColumns.some((c) => c.name === 'subtitle_url')
if (!hasSubtitleUrlColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN subtitle_url TEXT')
}

// Lightweight migration: add subtitles column (JSON array of {label, url})
// to support multiple subtitle URLs per episode.
const hasSubtitlesColumn = episodeColumns.some((c) => c.name === 'subtitles')
if (!hasSubtitlesColumn) {
  db.exec("ALTER TABLE episodes ADD COLUMN subtitles TEXT DEFAULT '[]'")
  // Migrate any existing single subtitle_url values into the new array column
  db.exec(`
    UPDATE episodes
    SET subtitles = '[' || '{"label":"ខ្មែរ","url":"' || replace(subtitle_url, '"', '\\"') || '"}' || ']'
    WHERE subtitle_url IS NOT NULL AND subtitle_url != ''
  `)
}

// Lightweight migration: add is_blocked column to users if missing
const userColumns = db.prepare('PRAGMA table_info(users)').all()
const hasIsBlockedColumn = userColumns.some((c) => c.name === 'is_blocked')
if (!hasIsBlockedColumn) {
  db.exec('ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0')
}

// Seed default categories if the table is empty
const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c
if (categoryCount === 0) {
  const insertCategory = db.prepare(
    'INSERT INTO categories (key, label, sort_order) VALUES (?, ?, ?)',
  )
  insertCategory.run('chinese', 'ចិន', 1)
  insertCategory.run('korean', 'កូរ៉េ', 2)
  insertCategory.run('thai', 'ថៃ', 3)
}

// Lightweight migration: add group_id column to menus if missing. Links a
// footer menu item to a footer_groups row (which column it appears under).
const menuColumns = db.prepare('PRAGMA table_info(menus)').all()
const hasGroupIdColumn = menuColumns.some((c) => c.name === 'group_id')
if (!hasGroupIdColumn) {
  db.exec(
    'ALTER TABLE menus ADD COLUMN group_id INTEGER REFERENCES footer_groups(id) ON DELETE SET NULL',
  )
}

// One-time seed: turn the previously hardcoded Footer columns ("ទំព័រ",
// "ព័ត៌មានផ្លូវច្បាប់", "ប្រភេទ") into real, editable footer_groups + menus
// rows, but only the very first time (i.e. footer_groups is still empty).
// This preserves what visitors currently see without any manual re-entry.
const footerGroupCount = db.prepare('SELECT COUNT(*) AS c FROM footer_groups').get().c
if (footerGroupCount === 0) {
  const insertGroup = db.prepare(
    'INSERT INTO footer_groups (label, sort_order) VALUES (?, ?)',
  )
  const insertLink = db.prepare(
    'INSERT INTO menus (location, label, url, open_new_tab, sort_order, group_id) VALUES (?, ?, ?, ?, ?, ?)',
  )

  const seedGroups = [
    {
      label: 'ទំព័រ',
      links: [
        { label: 'ទំព័រដើម', url: '/' },
        { label: 'អំពីយើង', url: '/about' },
        { label: 'ទំនាក់ទំនង', url: '/contact' },
      ],
    },
    {
      label: 'ព័ត៌មានផ្លូវច្បាប់',
      links: [
        { label: 'គោលការណ៍ឯកជនភាព', url: '/privacy' },
        { label: 'ការកំណត់ប្រើប្រាស់', url: '/terms' },
        { label: 'DMCA', url: '/dmca' },
      ],
    },
    {
      label: 'ប្រភេទ',
      links: [
        { label: 'រឿងភាគចិន', url: '/?category=chinese' },
        { label: 'រឿងភាគកូរ៉េ', url: '/?category=korean' },
        { label: 'រឿងភាគថៃ', url: '/?category=thai' },
      ],
    },
  ]

  seedGroups.forEach((group, groupIndex) => {
    const groupResult = insertGroup.run(group.label, groupIndex)
    const groupId = groupResult.lastInsertRowid
    group.links.forEach((link, linkIndex) => {
      insertLink.run('footer', link.label, link.url, 0, linkIndex, groupId)
    })
  })
}

// Lightweight migration: add sort_order column to dramas if missing
const dramaColumns = db.prepare('PRAGMA table_info(dramas)').all()
const hasSortOrderColumn = dramaColumns.some((c) => c.name === 'sort_order')
if (!hasSortOrderColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0')
  // Initialize sort_order so newest dramas start on top, matching the
  // previous default ordering (by created_at DESC).
  const rows = db.prepare('SELECT id FROM dramas ORDER BY created_at DESC').all()
  const update = db.prepare('UPDATE dramas SET sort_order = ? WHERE id = ?')
  rows.forEach((row, index) => update.run(index, row.id))
}

// Lightweight migration: add trailer_url column to dramas if missing
const hasTrailerUrlColumn = dramaColumns.some((c) => c.name === 'trailer_url')
if (!hasTrailerUrlColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN trailer_url TEXT')
}

// Lightweight migration: add quality column to dramas if missing. Lets
// admins tag each drama with a video quality label (HD, FHD, 4K, CAM, ...)
// shown on the poster badge and drama info page.
const hasQualityColumn = dramaColumns.some((c) => c.name === 'quality')
if (!hasQualityColumn) {
  db.exec("ALTER TABLE dramas ADD COLUMN quality TEXT DEFAULT 'HD'")
}

// Lightweight migration: add views column to dramas — incremented once per
// visit on the Watch page (see POST /api/dramas/:id/view), shown in Admin
// Panel > រឿងភាគទាំងអស់ so admins can see which posts get watched most.
const hasViewsColumn = dramaColumns.some((c) => c.name === 'views')
if (!hasViewsColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN views INTEGER NOT NULL DEFAULT 0')
}

// Lightweight migration: add content_rating column to dramas — feeds the
// schema.org contentRating field on Watch page structured data (VideoObject
// / TVSeries), e.g. "TV-14", "PG-13". Optional, admin-set.
const hasContentRatingColumn = dramaColumns.some((c) => c.name === 'content_rating')
if (!hasContentRatingColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN content_rating TEXT')
}

// Lightweight migration: add backdrop column to dramas — a landscape
// (16:9) image, usually imported from TMDB alongside the portrait
// `poster`. Used as the Video Player's cover/thumbnail (poster attribute
// + ambient background) on the Watch page and as the schema.org
// VideoObject / video sitemap thumbnail, since a 16:9 image fits a video
// frame far better than the 2:3 poster. Falls back to `poster` wherever
// it's unset.
const hasBackdropColumn = dramaColumns.some((c) => c.name === 'backdrop')
if (!hasBackdropColumn) {
  db.exec('ALTER TABLE dramas ADD COLUMN backdrop TEXT')
}

// Lightweight migration: add is_new column to episodes — lets admins
// manually flag which specific episode(s) show the "NEW" badge in the
// Episode Playlist (see EpisodeList.jsx), set from the Admin Drama
// Form's Video Episodes section rather than an automatic "N most recent
// episodes" rule.
const hasIsNewColumn = episodeColumns.some((c) => c.name === 'is_new')
if (!hasIsNewColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0')
}

// Lightweight migration: add is_end column to episodes — same idea as
// is_new but for flagging the final/last episode of a drama, shows an
// "END" badge instead of "NEW" in the Episode Playlist. Independent
// per-episode flag (not tied to drama.status) since an ONGOING drama's
// admin may still want to mark a season finale before the whole series
// itself is set to ENDED.
const hasIsEndColumn = episodeColumns.some((c) => c.name === 'is_end')
if (!hasIsEndColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN is_end INTEGER NOT NULL DEFAULT 0')
}

// Lightweight migration: add is_cc column to episodes — a manual
// per-episode toggle (Admin Drama Form > Video Episodes) for whether the
// CC/SUB footer tag shows on that specific episode. Defaults to 1 (on)
// so existing episodes keep showing CC/SUB exactly as before — the
// drama-level hasSubtitle switch still gates it too, this just lets an
// admin turn it off for one-off episodes without subtitles.
const hasIsCcColumn = episodeColumns.some((c) => c.name === 'is_cc')
if (!hasIsCcColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN is_cc INTEGER NOT NULL DEFAULT 1')
}

// Lightweight migration: add cc_text column to episodes — lets admins
// manually type a custom label to replace the default "SUB" wording in
// the CC/SUB footer tag (e.g. "ENG SUB", "RAW"), typed directly under the
// CC toggle button. Empty/NULL falls back to the default translated
// "SUB" text, so existing episodes are unaffected.
const hasCcTextColumn = episodeColumns.some((c) => c.name === 'cc_text')
if (!hasCcTextColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN cc_text TEXT')
}

// Lightweight migration: add duration column to episodes — per-episode
// runtime in minutes, used for the schema.org VideoObject `duration`
// (ISO 8601, e.g. "PT24M") and the Google video sitemap <video:duration>
// tag. Falls back to the drama-level `duration` text field when unset.
const hasEpisodeDurationColumn = episodeColumns.some((c) => c.name === 'duration')
if (!hasEpisodeDurationColumn) {
  db.exec('ALTER TABLE episodes ADD COLUMN duration TEXT')
}

// Lightweight migration: add sources column to episodes — JSON array of
// { label, url } (e.g. [{ label: "Server 1", url: "..." }, { label:
// "Server 2", url: "..." }]), letting one episode carry several mirror
// video links (multi-server) instead of just the single `video_url`.
// `video_url` stays in sync with the first/primary source so existing
// playback (VideoPlayer via episode.videoUrl) keeps working unchanged —
// only the Admin Panel needs to know about the extra mirrors.
const hasSourcesColumn = episodeColumns.some((c) => c.name === 'sources')
if (!hasSourcesColumn) {
  db.exec("ALTER TABLE episodes ADD COLUMN sources TEXT DEFAULT '[]'")
  // Migrate each existing video_url into a "Server 1" entry so nothing
  // already saved appears to have lost its link.
  db.exec(`
    UPDATE episodes
    SET sources = '[{"label":"Server 1","url":"' || replace(video_url, '"', '\\"') || '"}]'
    WHERE video_url IS NOT NULL AND video_url != ''
  `)
}

// Seed the single site_settings row if missing
const settingsRow = db.prepare('SELECT id FROM site_settings WHERE id = 1').get()
if (!settingsRow) {
  db.prepare(
    "INSERT INTO site_settings (id, site_name, logo_url, seo_description, tmdb_api_key) VALUES (1, 'DramaTV', NULL, NULL, NULL)",
  ).run()
}

// Lightweight migration: add tmdb_api_key column to site_settings if missing
const settingsColumns = db.prepare('PRAGMA table_info(site_settings)').all()
const hasTmdbKeyColumn = settingsColumns.some((c) => c.name === 'tmdb_api_key')
if (!hasTmdbKeyColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN tmdb_api_key TEXT')
}

// Lightweight migration: add custom_css column to site_settings if missing.
// Lets admins inject site-wide CSS overrides from the Settings page.
const hasCustomCssColumn = settingsColumns.some((c) => c.name === 'custom_css')
if (!hasCustomCssColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN custom_css TEXT')
}

// Lightweight migration: add header_code / footer_code columns to
// site_settings if missing. Lets admins inject raw HTML/JS snippets
// (Google Analytics, Google Search Console verification, etc.) into every
// page's <head> (header_code) or right before </body> (footer_code).
const hasHeaderCodeColumn = settingsColumns.some((c) => c.name === 'header_code')
if (!hasHeaderCodeColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN header_code TEXT')
}
const hasFooterCodeColumn = settingsColumns.some((c) => c.name === 'footer_code')
if (!hasFooterCodeColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN footer_code TEXT')
}

// Lightweight migration: add footer content columns (brand description,
// social media links, copyright text) so admins can edit the footer from
// the Settings page instead of hardcoded values in the frontend.
const footerColumnDefs = [
  ['footer_description', 'TEXT'],
  ['social_facebook', 'TEXT'],
  ['social_telegram', 'TEXT'],
  ['social_youtube', 'TEXT'],
  ['footer_copyright', 'TEXT'],
]
for (const [name, type] of footerColumnDefs) {
  const exists = settingsColumns.some((c) => c.name === name)
  if (!exists) {
    db.exec(`ALTER TABLE site_settings ADD COLUMN ${name} ${type}`)
  }
}

// Lightweight migration: add show/hide toggle columns for each Footer
// section, so admins can turn a whole block on or off from the Settings
// page without deleting its content.
// Lightweight migration: add theme color columns so admins can customize
// the accent color and key section backgrounds (Navbar/Footer/Body) from
// the Settings page without editing CSS by hand.
const themeColumnDefs = [
  ['theme_primary_color', "TEXT DEFAULT '#e50914'"],
  ['theme_navbar_bg', "TEXT DEFAULT '#0d0d0d'"],
  ['theme_footer_bg', "TEXT DEFAULT '#0a0a0a'"],
  ['theme_body_bg', "TEXT DEFAULT '#0d0d0d'"],
  ['theme_playlist_color', "TEXT DEFAULT '#e50914'"],
]
for (const [name, def] of themeColumnDefs) {
  const exists = settingsColumns.some((c) => c.name === name)
  if (!exists) {
    db.exec(`ALTER TABLE site_settings ADD COLUMN ${name} ${def}`)
  }
}

// Lightweight migration: add home_sections column so admins can reorder,
// rename, hide, or change the item count for each homepage row-section
// (LATEST UPDATED / MOVIE / TVSHOW) from the Admin Panel. Stored as JSON:
// [{ key: 'latest'|'movie'|'tvshow', label, visible, limit }, ...]
const hasHomeSectionsColumn = settingsColumns.some((c) => c.name === 'home_sections')
if (!hasHomeSectionsColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN home_sections TEXT')
}

// Lightweight migration: add slider_enabled toggle so admins can turn the
// homepage hero slider on/off without deleting all its slides.
const hasSliderEnabledColumn = settingsColumns.some((c) => c.name === 'slider_enabled')
if (!hasSliderEnabledColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN slider_enabled INTEGER NOT NULL DEFAULT 1')
}

const footerToggleDefs = [
  'show_footer_brand',
  'show_footer_social',
  'show_footer_pages',
  'show_footer_legal',
  'show_footer_categories',
]
for (const name of footerToggleDefs) {
  const exists = settingsColumns.some((c) => c.name === name)
  if (!exists) {
    db.exec(`ALTER TABLE site_settings ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 1`)
  }
}

// Lightweight migration: add 2FA columns to admins. `totp_secret` holds the
// base32 secret once enrolled; `totp_enabled` gates whether login actually
// requires the 6-digit code (kept separate from the secret so an admin can
// scan the QR code and confirm one code before 2FA becomes mandatory).
const adminColumns = db.prepare('PRAGMA table_info(admins)').all()
const adminTwoFactorDefs = [
  ['totp_secret', 'TEXT'],
  ['totp_enabled', 'INTEGER NOT NULL DEFAULT 0'],
]
for (const [name, def] of adminTwoFactorDefs) {
  const exists = adminColumns.some((c) => c.name === name)
  if (!exists) {
    db.exec(`ALTER TABLE admins ADD COLUMN ${name} ${def}`)
  }
}

// Lightweight migration: add email-notification preference to users (opt
// out of "new comment on a drama you're watching" emails, still get
// account emails like password reset regardless).
const hasNotifyColumn = userColumns.some((c) => c.name === 'notify_comments')
if (!hasNotifyColumn) {
  db.exec('ALTER TABLE users ADD COLUMN notify_comments INTEGER NOT NULL DEFAULT 1')
}

// Lightweight migration: add site_width column to site_settings so admins
// can control how wide the main content area is (Navbar/Footer/Grid/
// Watch page all share the same --site-max-width CSS variable, set from
// this value in App.jsx). Stored as a plain pixel number, e.g. 1280.
const hasSiteWidthColumn = settingsColumns.some((c) => c.name === 'site_width')
if (!hasSiteWidthColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN site_width INTEGER NOT NULL DEFAULT 1280')
}

// Lightweight migration: add label_en to menus and footer_groups, so
// admin-authored Navbar/Footer links and footer column titles can have an
// English translation. Left NULL by default — the frontend falls back to
// the original `label` (Khmer) whenever `label_en` is empty, so nothing
// breaks for existing entries that were created before this column
// existed and never got an English label filled in.
const menuColumnsForI18n = db.prepare('PRAGMA table_info(menus)').all()
const hasMenuLabelEn = menuColumnsForI18n.some((c) => c.name === 'label_en')
if (!hasMenuLabelEn) {
  db.exec('ALTER TABLE menus ADD COLUMN label_en TEXT')
}

const footerGroupColumns = db.prepare('PRAGMA table_info(footer_groups)').all()
const hasFooterGroupLabelEn = footerGroupColumns.some((c) => c.name === 'label_en')
if (!hasFooterGroupLabelEn) {
  db.exec('ALTER TABLE footer_groups ADD COLUMN label_en TEXT')
}

// Lightweight migration: add grid_columns column to site_settings so
// admins can type how many drama posts show per row on wide/desktop
// screens (e.g. 6, 8, 10) instead of the fixed 6-column default. Applied
// via the --grid-columns CSS variable at the widest breakpoint only —
// mobile/tablet keep their existing fixed 2/3/4-column layout since those
// are already tuned for small-screen usability.
const hasGridColumnsColumn = settingsColumns.some((c) => c.name === 'grid_columns')
if (!hasGridColumnsColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN grid_columns INTEGER NOT NULL DEFAULT 6')
}

// Lightweight migration: episode_columns / episode_columns_mobile —
// lets admins pick how many Episode Playlist buttons show per row on the
// Watch page (e.g. 4, 5, 6), set separately for Desktop and Mobile/
// Tablet since the sidebar width differs wildly between the two (see
// --episode-columns / --episode-columns-mobile in EpisodeList.css).
const hasEpisodeColumnsColumn = settingsColumns.some((c) => c.name === 'episode_columns')
if (!hasEpisodeColumnsColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN episode_columns INTEGER NOT NULL DEFAULT 5')
}

const hasEpisodeColumnsMobileColumn = settingsColumns.some(
  (c) => c.name === 'episode_columns_mobile',
)
if (!hasEpisodeColumnsMobileColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN episode_columns_mobile INTEGER NOT NULL DEFAULT 6')
}

// Lightweight migration: episode_button_scale — a size multiplier (1 =
// normal, e.g. 1.2 = 20% bigger) applied to the Episode Playlist
// button's number/footer text and rounding (see --episode-button-scale
// in EpisodeList.css), independent of the column-count settings above.
// Stored as REAL since it's a decimal ratio, not a whole column count.
const hasEpisodeButtonScaleColumn = settingsColumns.some(
  (c) => c.name === 'episode_button_scale',
)
if (!hasEpisodeButtonScaleColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN episode_button_scale REAL NOT NULL DEFAULT 1')
}

// Lightweight migration: theme_new_badge_color / theme_end_badge_color —
// lets admins recolor the Episode Playlist's NEW/END badges (see
// EpisodeList.jsx) from Admin Panel > Playlist instead of editing CSS.
const hasNewBadgeColorColumn = settingsColumns.some(
  (c) => c.name === 'theme_new_badge_color',
)
if (!hasNewBadgeColorColumn) {
  db.exec("ALTER TABLE site_settings ADD COLUMN theme_new_badge_color TEXT DEFAULT '#22c55e'")
}

const hasEndBadgeColorColumn = settingsColumns.some(
  (c) => c.name === 'theme_end_badge_color',
)
if (!hasEndBadgeColorColumn) {
  db.exec("ALTER TABLE site_settings ADD COLUMN theme_end_badge_color TEXT DEFAULT '#6c7280'")
}

// Lightweight migration: additional Custom Color fields beyond the
// original 5 (primary/navbar/footer/body/playlist) — lets admins theme
// heading text, regular body/title text, card/poster placeholder
// background, and the rating-star accent color, all previously
// hardcoded in CSS (#fff, #e5e5e5, #1a1a1a, #f7941d respectively).
const themeColumnDefsExtra = [
  ['theme_heading_color', "TEXT DEFAULT '#ffffff'"],
  ['theme_text_color', "TEXT DEFAULT '#e5e5e5'"],
  ['theme_card_bg', "TEXT DEFAULT '#1a1a1a'"],
  ['theme_rating_color', "TEXT DEFAULT '#f7941d'"],
]
for (const [name, def] of themeColumnDefsExtra) {
  const exists = settingsColumns.some((c) => c.name === name)
  if (!exists) {
    db.exec(`ALTER TABLE site_settings ADD COLUMN ${name} ${def}`)
  }
}

// Lightweight migration: google_font stores just the font family name
// (e.g. "Poppins") picked from fonts.google.com — App.jsx builds the
// actual Google Fonts CSS <link> URL from this name and applies it
// site-wide via the --font-family CSS variable. Empty/NULL means "use
// the site's default Arial/Battambang stack" (see index.css).
// Superseded below by 4 separate per-area font fields, but the column
// stays so its value (if any) can be backfilled into google_font_english.
const hasGoogleFontColumn = settingsColumns.some((c) => c.name === 'google_font')
if (!hasGoogleFontColumn) {
  db.exec('ALTER TABLE site_settings ADD COLUMN google_font TEXT')
}

// Lightweight migration: split the single "google_font" setting into 4
// per-area choices — Khmer text, English/Latin text, Navbar menu links,
// and headings/titles — since a single font can't cover both scripts
// well, and admins wanted to style menu/titles independently from body
// text. Each is empty by default (falls back to the site's normal
// Arial/Battambang stack — see index.css). google_font_english backfills
// from the old single google_font value so an existing selection isn't
// silently lost when upgrading.
const hasGoogleFontKhmer = settingsColumns.some((c) => c.name === 'google_font_khmer')
if (!hasGoogleFontKhmer) {
  db.exec('ALTER TABLE site_settings ADD COLUMN google_font_khmer TEXT')
}
const hasGoogleFontEnglish = settingsColumns.some((c) => c.name === 'google_font_english')
if (!hasGoogleFontEnglish) {
  db.exec('ALTER TABLE site_settings ADD COLUMN google_font_english TEXT')
  db.exec(
    "UPDATE site_settings SET google_font_english = google_font WHERE google_font IS NOT NULL AND google_font != ''",
  )
}
const hasGoogleFontMenu = settingsColumns.some((c) => c.name === 'google_font_menu')
if (!hasGoogleFontMenu) {
  db.exec('ALTER TABLE site_settings ADD COLUMN google_font_menu TEXT')
}
const hasGoogleFontTitle = settingsColumns.some((c) => c.name === 'google_font_title')
if (!hasGoogleFontTitle) {
  db.exec('ALTER TABLE site_settings ADD COLUMN google_font_title TEXT')
}

// Lightweight migration: disable_right_click / disable_devtools toggles —
// when on, the frontend blocks the right-click context menu and
// intercepts F12/Ctrl+Shift+I/Ctrl+Shift+J/Ctrl+U to deter casual content
// copying/inspection. Off by default since it affects usability for
// everyone (including admins browsing their own site) and isn't real
// protection against a determined user.
const hasDisableRightClick = settingsColumns.some((c) => c.name === 'disable_right_click')
if (!hasDisableRightClick) {
  db.exec('ALTER TABLE site_settings ADD COLUMN disable_right_click INTEGER NOT NULL DEFAULT 0')
}
const hasDisableDevtools = settingsColumns.some((c) => c.name === 'disable_devtools')
if (!hasDisableDevtools) {
  db.exec('ALTER TABLE site_settings ADD COLUMN disable_devtools INTEGER NOT NULL DEFAULT 0')
}
// Optional: when right-click is blocked, also open this URL in a new tab
// instead of just showing nothing — a common deterrent pattern. Empty
// means "just block the menu, don't redirect anywhere".
const hasRightClickRedirect = settingsColumns.some(
  (c) => c.name === 'right_click_redirect_url',
)
if (!hasRightClickRedirect) {
  db.exec('ALTER TABLE site_settings ADD COLUMN right_click_redirect_url TEXT')
}

// Lightweight migration: preroll_enabled — master on/off switch for the
// Preroll Video Ad feature as a whole. The actual video pool lives in
// the `preroll_ads` table above (one is picked at random per session),
// so this is the only preroll-related field that still belongs on
// site_settings.
const hasPrerollEnabled = settingsColumns.some((c) => c.name === 'preroll_enabled')
if (!hasPrerollEnabled) {
  db.exec('ALTER TABLE site_settings ADD COLUMN preroll_enabled INTEGER NOT NULL DEFAULT 0')
}

// Lightweight migration: auto_play_video — when on, the Watch page video
// starts playing automatically as soon as an episode/movie loads (initial
// load, or after picking a different episode), instead of requiring the
// visitor to click the center Play button every time. Off by default
// since autoplay-with-sound is against most browsers' autoplay policy —
// VideoPlayer falls back to a muted autoplay + "tap to unmute" hint when
// the browser blocks the unmuted attempt (see VideoPlayer.jsx).
const hasAutoPlayVideo = settingsColumns.some((c) => c.name === 'auto_play_video')
if (!hasAutoPlayVideo) {
  db.exec('ALTER TABLE site_settings ADD COLUMN auto_play_video INTEGER NOT NULL DEFAULT 0')
}
// Migrate any single preroll ad already saved under the old columns
// (preroll_video_url/preroll_skip_seconds/preroll_click_url) into the new
// preroll_ads table, then drop the old columns — SQLite's ALTER TABLE
// DROP COLUMN needs 3.35+, which node:sqlite ships with, so this is safe.
const hasOldPrerollVideoUrl = settingsColumns.some((c) => c.name === 'preroll_video_url')
if (hasOldPrerollVideoUrl) {
  const oldRow = db
    .prepare(
      'SELECT preroll_video_url, preroll_skip_seconds, preroll_click_url FROM site_settings WHERE id = 1',
    )
    .get()
  if (oldRow?.preroll_video_url) {
    db.prepare(
      'INSERT INTO preroll_ads (video_url, click_url, skip_seconds, sort_order) VALUES (?, ?, ?, 0)',
    ).run(oldRow.preroll_video_url, oldRow.preroll_click_url || null, oldRow.preroll_skip_seconds ?? 5)
  }
  db.exec('ALTER TABLE site_settings DROP COLUMN preroll_video_url')
  db.exec('ALTER TABLE site_settings DROP COLUMN preroll_skip_seconds')
  db.exec('ALTER TABLE site_settings DROP COLUMN preroll_click_url')
}

// Lightweight migration: add drama_id column to slides — lets the Admin
// Drama Form auto-create/update/remove that drama's own Banner Slider
// slide whenever its Backdrop/Banner URL changes (see AdminDramaForm.jsx
// handleTmdbImport/handleSubmit), instead of requiring a manual
// "+ បញ្ចូលទៅ Banner Slider" click. NULL means the slide was added
// manually from Admin Panel > Slider, unrelated to any drama.
const slidesColumns = db.prepare('PRAGMA table_info(slides)').all()
const hasSlideDramaIdColumn = slidesColumns.some((c) => c.name === 'drama_id')
if (!hasSlideDramaIdColumn) {
  db.exec('ALTER TABLE slides ADD COLUMN drama_id INTEGER')
}

export default db
