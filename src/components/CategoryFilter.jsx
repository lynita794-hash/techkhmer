import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { fetchCategories } from '../utils/adminApi'
import './CategoryFilter.css'

function CategoryFilter({ active, onSelect }) {
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {})
  }, [])

  // Categories (ចិន/កូរ៉េ/ថៃ, ...) are admin-managed labels stored in the
  // database, not covered by the translation dictionary — only the fixed
  // "All" option is translated here.
  const allCategories = [{ key: 'all', label: t('common.all') }, ...categories]

  return (
    <div className="category-filter">
      {allCategories.map((c) => (
        <button
          key={c.key}
          className={`category-filter-btn ${active === c.key ? 'active' : ''}`}
          onClick={() => onSelect(c.key)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
