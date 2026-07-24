import { useLanguage } from '../context/LanguageContext'
import './TypeFilter.css'

// Fixed Movie / TV Show tabs (unlike CategoryFilter, these aren't admin-editable
// since the underlying `type` field on a drama is now a fixed dropdown too).
function TypeFilter({ active, onSelect }) {
  const { t } = useLanguage()
  const types = [
    { key: 'all', label: t('common.all') },
    { key: 'TV Series', label: t('common.tvShow') },
    { key: 'Movie', label: t('common.movie') },
  ]

  return (
    <div className="type-filter">
      {types.map((type) => (
        <button
          key={type.key}
          className={`type-filter-btn ${active === type.key ? 'active' : ''}`}
          onClick={() => onSelect(type.key)}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}

export default TypeFilter
