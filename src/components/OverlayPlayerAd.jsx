import { useState } from 'react'
import { AdUnit } from './AdSlot'
import './OverlayPlayerAd.css'

// Renders "Overlay Player" ads directly on top of the video player itself
// (semi-transparent banner strip near the bottom, like the overlay ads
// YouTube/streaming sites show mid-video) instead of taking up separate
// space above/below it. Dismissible per-viewing via the close (×) button.
function OverlayPlayerAd({ ads }) {
  const [dismissed, setDismissed] = useState(false)
  const matching = ads.filter((ad) => ad.placement === 'overlay_player')
  if (matching.length === 0 || dismissed) return null

  return (
    <div className="overlay-player-ad">
      <button
        type="button"
        className="overlay-player-ad-close"
        onClick={() => setDismissed(true)}
        aria-label="Close ad"
      >
        ✕
      </button>
      {matching.map((ad) => (
        <AdUnit key={ad.id} code={ad.code} />
      ))}
    </div>
  )
}

export default OverlayPlayerAd
