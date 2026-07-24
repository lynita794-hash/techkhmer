import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useLanguage } from '../context/LanguageContext'
import { fetchFooterGroups, fetchSettings } from '../utils/adminApi'
import './Footer.css'

function Footer() {
  const { t, lang } = useLanguage()
  const [footerGroups, setFooterGroups] = useState([])
  // footerDescription/footerCopyright default to null (not yet loaded)
  // rather than baking in a hardcoded Khmer string, so the translated
  // fallback (t('footer.defaultDescription')) can react to language
  // changes even before/without an admin override being set.
  const [footerSettings, setFooterSettings] = useState({
    footerDescription: null,
    socialFacebook: '',
    socialTelegram: '',
    socialYoutube: '',
    footerCopyright: null,
    siteName: 'DramaTV',
    showFooterBrand: true,
    showFooterSocial: true,
  })

  useEffect(() => {
    fetchFooterGroups()
      .then(setFooterGroups)
      .catch(() => {})

    fetchSettings()
      .then((data) =>
        setFooterSettings({
          footerDescription: data.footerDescription || null,
          socialFacebook: data.socialFacebook || '',
          socialTelegram: data.socialTelegram || '',
          socialYoutube: data.socialYoutube || '',
          footerCopyright: data.footerCopyright || null,
          siteName: data.siteName || 'DramaTV',
          showFooterBrand: data.showFooterBrand ?? true,
          showFooterSocial: data.showFooterSocial ?? true,
        }),
      )
      .catch(() => {})
  }, [])

  const hasSocialLinks =
    footerSettings.showFooterSocial &&
    (footerSettings.socialFacebook ||
      footerSettings.socialTelegram ||
      footerSettings.socialYoutube)

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {footerSettings.showFooterBrand && (
        <div className="footer-col footer-brand">
          <Link to="/" className="footer-logo" aria-label={t('nav.homeAria')}>
            <Logo />
          </Link>
          <p>{footerSettings.footerDescription || t('footer.defaultDescription')}</p>
          {hasSocialLinks && (
            <div className="footer-social">
              {footerSettings.socialFacebook && (
                <a
                  href={footerSettings.socialFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"
                    />
                  </svg>
                </a>
              )}
              {footerSettings.socialTelegram && (
                <a
                  href={footerSettings.socialTelegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M21.9 4.5 2.6 11.9c-1 .4-.9 1.1 0 1.4l4.9 1.5 1.9 6c.2.6.4.7.9.3l2.7-2.4 4.9 3.6c.7.4 1.2.2 1.4-.6l3-13.7c.3-1-.4-1.6-1.4-1.1z"
                    />
                  </svg>
                </a>
              )}
              {footerSettings.socialYoutube && (
                <a
                  href={footerSettings.socialYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"
                    />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
        )}

        {footerGroups.map(
          (group) =>
            group.links.length > 0 && (
              <div className="footer-col" key={group.id}>
                <h3>{lang === 'en' && group.labelEn ? group.labelEn : group.label}</h3>
                <ul>
                  {group.links.map((link) => {
                    const isInternal = link.url.startsWith('/')
                    const linkLabel =
                      lang === 'en' && link.labelEn ? link.labelEn : link.label
                    return (
                      <li key={link.id}>
                        {isInternal ? (
                          <Link to={link.url}>{linkLabel}</Link>
                        ) : (
                          <a
                            href={link.url}
                            target={link.openNewTab ? '_blank' : undefined}
                            rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                          >
                            {linkLabel}
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ),
        )}
      </div>

      <div className="footer-bottom">
        <p>
          {footerSettings.footerCopyright ||
            t('footer.copyright', new Date().getFullYear(), footerSettings.siteName)}
        </p>
      </div>
    </footer>
  )
}

export default Footer
