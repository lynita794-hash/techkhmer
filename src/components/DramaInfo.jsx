import { useState } from 'react'
import { getVoteState, setVote } from '../utils/votes'
import { useLanguage } from '../context/LanguageContext'
import './DramaInfo.css'

// Extracts a YouTube video ID from common URL formats, or returns null.
function getYoutubeEmbedId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
  )
  return match ? match[1] : null
}

function DramaInfo({ drama }) {
  const {
    id,
    poster,
    title,
    titleKh,
    status,
    type,
    quality,
    premiered,
    broadcast,
    dateAired,
    duration,
    contentRating,
    source,
    country,
    episodes,
    rating,
    votes,
    description,
    genres,
    trailerUrl,
  } = drama

  const { t, lang } = useLanguage()
  const [trailerOpen, setTrailerOpen] = useState(false)
  const youtubeId = getYoutubeEmbedId(trailerUrl)

  const [voteState, setVoteState] = useState(() =>
    getVoteState(id, rating, votes),
  )

  const handleVote = (choice) => {
    setVote(id, choice)
    setVoteState(getVoteState(id, rating, votes))
  }

  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : ''

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent((lang === 'km' && titleKh) || title)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  // Title switches with the site-wide language toggle: Khmer title when
  // set and lang is 'km', otherwise the main (English/romanized) title.
  const displayTitle = (lang === 'km' && titleKh) || title

  return (
    <section className="drama-info">
      <div className="drama-info-card">
        <div className="drama-info-poster">
          <img src={poster} alt={displayTitle} />
        </div>

        <div className="drama-info-body">
          <h1 className="drama-info-title">{displayTitle}</h1>

          <div className="drama-info-actions-top">
            {trailerUrl && (
              <button className="pill-btn trailer-btn" onClick={() => setTrailerOpen(true)}>
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
                {t('drama.trailer')}
              </button>
            )}
            <span className="pill-btn status-btn">{status}</span>
            {quality && <span className="pill-btn quality-btn">{quality}</span>}
          </div>

          <p className="drama-info-desc">{description}</p>

          <div className="drama-info-meta">
            <dl>
              <div>
                <dt>{t('drama.type')}:</dt>
                <dd>{type}</dd>
              </div>
              <div>
                <dt>{t('drama.premiered')}:</dt>
                <dd>{premiered}</dd>
              </div>
              <div>
                <dt>{t('drama.broadcast')}:</dt>
                <dd>{broadcast}</dd>
              </div>
              <div>
                <dt>{t('drama.genres')}:</dt>
                <dd>{genres?.[0] || '-'}</dd>
              </div>
              <div>
                <dt>{t('drama.duration')}:</dt>
                <dd>{duration}</dd>
              </div>
            </dl>

            <dl>
              <div>
                <dt>{t('drama.source')}:</dt>
                <dd>{source}</dd>
              </div>
              <div>
                <dt>{t('drama.dateAired')}:</dt>
                <dd>{dateAired}</dd>
              </div>
              <div>
                <dt>{t('drama.status')}:</dt>
                <dd>{status}</dd>
              </div>
              <div>
                <dt>{t('drama.country')}:</dt>
                <dd>{country}</dd>
              </div>
              <div>
                <dt>{t('drama.episodes')}:</dt>
                <dd>{episodes.length}</dd>
              </div>
              {contentRating && (
                <div>
                  <dt>{t('drama.contentRating')}:</dt>
                  <dd>{contentRating}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="drama-info-side">
          <div className="drama-rating">
            <span className="drama-rating-value">{voteState.rating.toFixed(1)}</span>
            <span className="drama-rating-votes">/ {voteState.votes} voted</span>
          </div>

          <div className="drama-social-row">
            <button
              className={`social-btn like-btn ${voteState.myVote === 'like' ? 'is-active' : ''}`}
              onClick={() => handleVote('like')}
              aria-pressed={voteState.myVote === 'like'}
            >
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
                />
              </svg>
              {t('drama.like')}
            </button>
            <button
              className={`social-btn dislike-btn ${voteState.myVote === 'dislike' ? 'is-active' : ''}`}
              onClick={() => handleVote('dislike')}
              aria-pressed={voteState.myVote === 'dislike'}
            >
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
                />
              </svg>
              {t('drama.dislike')}
            </button>
          </div>

          <div className="drama-share-row">
            <button className="social-btn facebook-btn" onClick={shareOnFacebook}>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"
                />
              </svg>
              {t('drama.share')}
            </button>
            <button className="social-btn telegram-btn" onClick={shareOnTelegram}>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M21.9 4.5 2.6 11.9c-1 .4-.9 1.1 0 1.4l4.9 1.5 1.9 6c.2.6.4.7.9.3l2.7-2.4 4.9 3.6c.7.4 1.2.2 1.4-.6l3-13.7c.3-1-.4-1.6-1.4-1.1z"
                />
              </svg>
              {t('drama.share')}
            </button>
          </div>
        </div>
      </div>

      {genres?.length > 0 && (
        <div className="drama-tags">
          <span className="drama-tag">{title}</span>
          {genres.map((g) => (
            <span className="drama-tag" key={g}>
              {g}
            </span>
          ))}
          <span className="drama-tag watch-free-tag">{t('drama.watchFree', title)}</span>
        </div>
      )}

      {trailerOpen && (
        <div className="trailer-modal-overlay" onClick={() => setTrailerOpen(false)}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="trailer-modal-close"
              onClick={() => setTrailerOpen(false)}
              aria-label={t('common.close')}
            >
              ✕
            </button>
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={`${title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={trailerUrl} controls autoPlay />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default DramaInfo
