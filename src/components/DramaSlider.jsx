import { useEffect, useRef } from 'react'
import DramaCard from './DramaCard'
import { useLanguage } from '../context/LanguageContext'
import './DramaSlider.css'

const DEFAULT_AUTO_SLIDE_SECONDS = 3.5

// Horizontal, scrollable row of drama posters with prev/next arrow buttons
// (Netflix-style carousel) — used as an alternative to the static grid for
// homepage row-sections (e.g. MOVIE, TVSHOW) when "Slider Mode" is turned
// on in Admin Panel > Homepage Layout. When `autoPlay` is true, the track
// auto-scrolls forward on a timer (interval configurable via
// `autoPlaySpeed`, in seconds) and loops back to the start at the end; it
// pauses while the user hovers/touches so manual browsing isn't fought.
function DramaSlider({ dramas, autoPlay, autoPlaySpeed }) {
  const { t } = useLanguage()
  const trackRef = useRef(null)
  const pausedRef = useRef(false)

  const scrollBy = (direction) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!autoPlay || dramas.length === 0) return

    const intervalMs = Math.max(1, autoPlaySpeed || DEFAULT_AUTO_SLIDE_SECONDS) * 1000

    const timer = setInterval(() => {
      const track = trackRef.current
      if (!track || pausedRef.current) return

      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        track.scrollBy({ left: track.clientWidth * 0.9, behavior: 'smooth' })
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [autoPlay, autoPlaySpeed, dramas.length])

  if (dramas.length === 0) {
    return <p className="drama-empty">{t('common.noResults')}</p>
  }

  return (
    <div
      className="drama-slider"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
      onTouchStart={() => {
        pausedRef.current = true
      }}
    >
      <button
        type="button"
        className="drama-slider-arrow drama-slider-prev"
        onClick={() => scrollBy(-1)}
        aria-label={t('common.prev')}
      >
        ‹
      </button>

      <div className="drama-slider-track" ref={trackRef}>
        {dramas.map((drama) => (
          <div className="drama-slider-item" key={drama.id}>
            <DramaCard drama={drama} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="drama-slider-arrow drama-slider-next"
        onClick={() => scrollBy(1)}
        aria-label={t('common.next')}
      >
        ›
      </button>
    </div>
  )
}

export default DramaSlider
