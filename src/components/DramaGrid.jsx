import DramaCard from './DramaCard'
import DramaCardSkeleton from './DramaCardSkeleton'
import { useLanguage } from '../context/LanguageContext'
import './DramaGrid.css'

function DramaGrid({ dramas, loading = false, skeletonCount = 12 }) {
  const { t } = useLanguage()
  if (loading) {
    return (
      <div className="drama-grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <DramaCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (dramas.length === 0) {
    return <p className="drama-empty">{t('common.noResults')}</p>
  }

  return (
    <div className="drama-grid">
      {dramas.map((drama) => (
        <DramaCard key={drama.id} drama={drama} />
      ))}
    </div>
  )
}

export default DramaGrid
