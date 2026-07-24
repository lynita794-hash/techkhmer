import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './HeroSlider.css'

const AUTO_PLAY_MS = 5000

// Homepage hero slider — admin-managed banner images that auto-rotate,
// with manual prev/next arrows and dot navigation. Renders nothing if
// there are no slides (or the whole slider is disabled by the caller).
function HeroSlider({ slides }) {
  const { t } = useLanguage()
  const [index, setIndex] = useState(0)

  const goTo = useCallback(
    (i) => {
      if (slides.length === 0) return
      setIndex(((i % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_PLAY_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null

  const current = slides[index] || slides[0]

  const Slide = () => (
    <div className="hero-slide" style={{ backgroundImage: `url(${current.image})` }}>
      {current.title && <div className="hero-slide-title">{current.title}</div>}
    </div>
  )

  return (
    <div className="hero-slider">
      {current.link ? (
        <a href={current.link} className="hero-slide-link">
          <Slide />
        </a>
      ) : (
        <Slide />
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-prev"
            onClick={() => goTo(index - 1)}
            aria-label={t('common.prev')}
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-next"
            onClick={() => goTo(index + 1)}
            aria-label={t('common.next')}
          >
            ›
          </button>

          <div className="hero-slider-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`hero-slider-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default HeroSlider
