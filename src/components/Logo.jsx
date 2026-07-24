import { LOGO_URL, SITE_NAME } from '../config/site'
import './Logo.css'

function Logo({ className = '' }) {
  if (LOGO_URL) {
    return (
      <img
        src={LOGO_URL}
        alt={SITE_NAME}
        className={`site-logo-img ${className}`}
      />
    )
  }

  return (
    <span className={`site-logo-text ${className}`}>
      <span className="logo-white">DRAMA</span>
      <span className="logo-accent">TV</span>
    </span>
  )
}

export default Logo
