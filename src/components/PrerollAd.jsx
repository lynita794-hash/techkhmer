import { useEffect, useRef, useState } from 'react'
import './PrerollAd.css'

// A single site-wide video ad shown before the real episode/movie starts
// playing — the same pattern as a YouTube pre-roll. Configured once in
// Admin Panel > Ads Manager (video URL, optional click-through link, and
// how many seconds must play before "Skip Ad" appears; 0 = unskippable).
// Renders in place of <VideoPlayer> until it ends or is skipped, at which
// point onComplete() swaps it out for the real video.
function PrerollAd({ videoUrl, skipSeconds = 5, clickUrl, onComplete }) {
  const videoRef = useRef(null)
  const [remaining, setRemaining] = useState(skipSeconds)
  const [canSkip, setCanSkip] = useState(skipSeconds <= 0)

  useEffect(() => {
    const video = videoRef.current
    if (video) video.play().catch(() => {})
  }, [])

  const handleTimeUpdate = (e) => {
    if (canSkip) return
    const left = Math.max(0, Math.ceil(skipSeconds - e.target.currentTime))
    setRemaining(left)
    if (left <= 0) setCanSkip(true)
  }

  const handleClickThrough = () => {
    if (clickUrl) window.open(clickUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="preroll-ad">
      <video
        ref={videoRef}
        className="preroll-ad-video"
        src={videoUrl}
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        onError={onComplete}
        onClick={handleClickThrough}
      />

      <span className="preroll-ad-label">AD</span>

      {canSkip ? (
        <button type="button" className="preroll-skip-btn" onClick={onComplete}>
          Skip Ad ›
        </button>
      ) : (
        <span className="preroll-skip-countdown">Skip in {remaining}s</span>
      )}
    </div>
  )
}

export default PrerollAd
