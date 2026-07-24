import { Link } from 'react-router-dom'
import { buildWatchPath } from '../utils/slug'
import { useLanguage } from '../context/LanguageContext'
import './DramaCard.css'

// Movies show their video Quality (e.g. "HD") on the poster badge instead
// of an episode count, since an episode number doesn't apply to them.
// TV Shows keep showing "EP {n}" as usual. This applies everywhere a
// DramaCard is rendered (homepage sections, related dramas, search
// results, etc.) — decided per-card from the drama's own `type`.
function DramaCard({ drama }) {
  const isMovie = drama.type === 'Movie'
  const { lang } = useLanguage()
  // Title switches with the site-wide language toggle: Khmer title when
  // set and lang is 'km', otherwise the main (English/romanized) title.
  const displayTitle = (lang === 'km' && drama.titleKh) || drama.title

  return (
    <Link to={buildWatchPath(drama)} className="drama-card">
      <div className="drama-poster">
        <img src={drama.poster} alt={displayTitle} loading="lazy" />
        <span className="drama-ep">{isMovie ? drama.quality || 'HD' : `EP ${drama.ep}`}</span>
      </div>
      <p className="drama-title">{displayTitle}</p>
    </Link>
  )
}

export default DramaCard
