import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AdUnit } from './AdSlot'
import { fetchAds } from '../utils/adminApi'
import { FLOATING_AD_PLACEMENTS } from '../config/adPlacements'
import { ADMIN_BASE_PATH } from '../config/adminPath'
import './FloatingAds.css'

// Renders every enabled "Float" ad placement (Center/Top/Left/Right/
// Bottom) fixed on top of the page content, each with its own close (×)
// button — the always-visible floating ad units common on drama/
// streaming sites. Mounted once globally in App.jsx (not per-page) so
// they persist across navigation instead of being tied to one route.
//
// Never shown on /admin/* — floating ads over the Admin Panel itself
// would just get in the admin's own way while managing the site.
function FloatingAds() {
  const location = useLocation()
  const [ads, setAds] = useState([])
  const [dismissed, setDismissed] = useState([])

  useEffect(() => {
    fetchAds().then(setAds).catch(() => {})
  }, [])

  if (location.pathname.startsWith(`/${ADMIN_BASE_PATH}`)) return null

  const dismiss = (placementKey) => setDismissed((prev) => [...prev, placementKey])

  return (
    <>
      {FLOATING_AD_PLACEMENTS.filter((p) => !dismissed.includes(p.key)).map((p) => {
        const matching = ads.filter((ad) => ad.placement === p.key)
        if (matching.length === 0) return null

        return (
          <div className={`floating-ad floating-ad-${p.key}`} key={p.key}>
            <button
              type="button"
              className="floating-ad-close"
              onClick={() => dismiss(p.key)}
              aria-label="Close ad"
            >
              ✕
            </button>
            {matching.map((ad) => (
              <AdUnit key={ad.id} code={ad.code} />
            ))}
          </div>
        )
      })}
    </>
  )
}

export default FloatingAds
