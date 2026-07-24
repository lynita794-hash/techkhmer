import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminLayout.css'

// Thin outline icon set for the sidebar nav — one glyph per section so
// each link is recognizable at a glance, not just by its label text.
// Matches the stroke-based icon style already used elsewhere in the app
// (VideoPlayer controls): 18x18, currentColor stroke, rounded joins.
const navIconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 18,
  height: 18,
}

function DramaListIcon() {
  return (
    <svg {...navIconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 4v5M17 4v5" />
    </svg>
  )
}

function AddDramaIcon() {
  return (
    <svg {...navIconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 10v6M9 13h6" />
    </svg>
  )
}

function CategoryIcon() {
  return (
    <svg {...navIconProps}>
      <path d="M12 2 3 7l9 5 9-5-9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg {...navIconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function FooterIcon() {
  return (
    <svg {...navIconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 15h18" />
    </svg>
  )
}

function HomeLayoutIcon() {
  return (
    <svg {...navIconProps}>
      <rect x="3" y="4" width="7" height="7" rx="1" />
      <rect x="14" y="4" width="7" height="7" rx="1" />
      <rect x="3" y="15" width="7" height="5" rx="1" />
      <rect x="14" y="15" width="7" height="5" rx="1" />
    </svg>
  )
}

function SliderIcon() {
  return (
    <svg {...navIconProps}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 6v12M16 6v12" />
    </svg>
  )
}

function AdsIcon() {
  return (
    <svg {...navIconProps}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" />
    </svg>
  )
}

function CommentsIcon() {
  return (
    <svg {...navIconProps}>
      <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1.2 3.6a8.5 8.5 0 0 1 1.2 4.9z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg {...navIconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M18.5 19c0-2.5-1.8-4.4-4-4.9" />
    </svg>
  )
}

function ActivityLogIcon() {
  return (
    <svg {...navIconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

function SettingsNavIcon() {
  return (
    <svg {...navIconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// Playlist icon — stacked horizontal bars with a play triangle, used for
// the "Playlist" quick-link that jumps straight to the Episode Playlist
// column settings inside Settings > រូបរាង.
function PlaylistNavIcon() {
  return (
    <svg {...navIconProps}>
      <path d="M4 6h11M4 12h11M4 18h6" />
      <path d="M15 15.5v-5l4.5 2.5-4.5 2.5z" />
    </svg>
  )
}

// External-link glyph (box + arrow escaping the top-right corner) — used
// on the "មើលគេហទំព័រ" (View Website) button that opens the public site
// in a new tab.
function ExternalLinkIcon() {
  return (
    <svg {...navIconProps} width={16} height={16}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

function AdminLayout() {
  const { token, username, logout } = useAdminAuth()
  const location = useLocation()
  // On mobile the sidebar collapses behind a hamburger toggle instead of
  // wrapping all 11 links into a cramped topbar row (see AdminLayout.css
  // — desktop keeps the sidebar always visible, this state only matters
  // below the 860px breakpoint).
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile nav automatically whenever the route changes, so
  // navigating to a page doesn't leave the overlay menu open behind it.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  if (!token) {
    return <Navigate to={`/${ADMIN_BASE_PATH}/login`} replace />
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">Admin Panel</div>
          <button
            className="admin-nav-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={navOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Opens the public site in a new tab — new tab (not the same
            one) so admins don't lose their place in the Admin Panel. */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-view-site-btn"
        >
          <ExternalLinkIcon />
          មើលគេហទំព័រ
        </a>

        <nav className="admin-sidebar-nav">
          <NavLink to={`/${ADMIN_BASE_PATH}`} end>
            <DramaListIcon />
            រឿងភាគទាំងអស់
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/dramas/new`}>
            <AddDramaIcon />
            ផុសរឿងថ្មី
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/categories`}>
            <CategoryIcon />
            Category
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/menus`}>
            <MenuIcon />
            Menu
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/footer`}>
            <FooterIcon />
            Footer Columns
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/home-layout`}>
            <HomeLayoutIcon />
            Homepage Layout
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/slider`}>
            <SliderIcon />
            Slider
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/ads`}>
            <AdsIcon />
            Ads Manager
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/comments`}>
            <CommentsIcon />
            មតិយោបល់
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/users`}>
            <UsersIcon />
            អ្នកប្រើប្រាស់
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/activity-log`}>
            <ActivityLogIcon />
            កំណត់ត្រាសកម្មភាព
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/playlist`}>
            <PlaylistNavIcon />
            Playlist
          </NavLink>
          <NavLink to={`/${ADMIN_BASE_PATH}/settings`}>
            <SettingsNavIcon />
            ការកំណត់
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-username">{username || 'Admin'}</span>
          <button className="admin-logout-btn" onClick={logout}>
            ចាកចេញ
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
