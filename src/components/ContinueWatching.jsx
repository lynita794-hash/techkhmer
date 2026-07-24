import { Link } from 'react-router-dom'
import { buildWatchPath } from '../utils/slug'
import { useLanguage } from '../context/LanguageContext'
import './ContinueWatching.css'

// "Continue Watching" row on the homepage for signed-in users — shows the
// last-watched episode + playback position per drama, with a thin progress
// bar on the poster so it's obvious how far along each one is.
function ContinueWatching({ items }) {
  const { t } = useLanguage()
  if (!items || items.length === 0) return null

  return (
    <section className="continue-watching">
      <div className="home-section-header">
        <h2>{t('common.continueWatching')}</h2>
      </div>

      <div className="continue-watching-track">
        {items.map((item) => {
          // totalEpisodes is 0 for dramas without episode metadata set —
          // guard against dividing by zero when estimating progress.
          const durationEstimateSeconds = 40 * 60 // rough episode length guess
          const progressPct = Math.min(
            100,
            (item.positionSeconds / durationEstimateSeconds) * 100,
          )

          return (
            <Link
              key={item.dramaId}
              to={buildWatchPath({ id: item.dramaId, title: item.title }, item.episodeNumber)}
              className="continue-watching-card"
            >
              <div className="continue-watching-poster">
                <img src={item.poster} alt={item.title} loading="lazy" />
                <span className="continue-watching-ep">EP {item.episodeNumber}</span>
                <div className="continue-watching-progress-track">
                  <div
                    className="continue-watching-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <p className="continue-watching-title">{item.title}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default ContinueWatching
