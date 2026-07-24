import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import AdSlot from './AdSlot'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { fetchAds, fetchMenus } from '../utils/adminApi'
import './Navbar.css'

function Navbar({ search, onSearchChange }) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [customLinks, setCustomLinks] = useState([])
  const [ads, setAds] = useState([])
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchMenus('navbar')
      .then(setCustomLinks)
      .catch(() => {})
    // Self-fetched here (rather than passed down as a prop) so the
    // "DramaStream Header" ad slot renders under Navbar consistently on
    // every page that uses it, without every page needing to fetch ads
    // and pass them through just for this one placement.
    fetchAds().then(setAds).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const handleSelectLang = (next) => {
    setLang(next)
    setLangMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" aria-label={t('nav.homeAria')}>
          <Logo />
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-nav ${open ? 'is-open' : ''}`}>
          <ul>
            {customLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  className="nav-link"
                  target={link.openNewTab ? '_blank' : undefined}
                  rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {lang === 'en' && link.labelEn ? link.labelEn : link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar-search">
          <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
            />
          </svg>
          <input
            type="search"
            placeholder={t('nav.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search dramas"
          />
        </div>

        <div className="navbar-lang">
          <button
            className="navbar-lang-btn"
            onClick={() => setLangMenuOpen((v) => !v)}
            aria-expanded={langMenuOpen}
            aria-label={t('nav.language')}
          >
            {lang === 'km' ? 'ខ្មែរ' : 'EN'}
          </button>

          {langMenuOpen && (
            <div className="navbar-lang-dropdown">
              <button
                className={lang === 'km' ? 'is-active' : ''}
                onClick={() => handleSelectLang('km')}
              >
                ខ្មែរ (Khmer)
              </button>
              <button
                className={lang === 'en' ? 'is-active' : ''}
                onClick={() => handleSelectLang('en')}
              >
                English
              </button>
            </div>
          )}
        </div>

        {user ? (
          <div className="navbar-user">
            <button
              className="navbar-user-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="User menu"
            >
              <span className="navbar-user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="navbar-user-name">{user.name}</span>
            </button>

            {menuOpen && (
              <div className="navbar-user-dropdown">
                <Link to="/watchlist" onClick={() => setMenuOpen(false)}>
                  {t('nav.myList')}
                </Link>
                <button onClick={handleLogout}>{t('nav.logout')}</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar-signin-btn">
            {t('nav.login')}
          </Link>
        )}
      </div>

      <AdSlot ads={ads} placement="dramastream_header" />
    </header>
  )
}

export default Navbar
