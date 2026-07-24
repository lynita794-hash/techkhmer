import { useLanguage } from '../context/LanguageContext'
import './Pagination.css'

function getPageNumbers(current, total) {
  const pages = []
  const delta = 1

  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || Math.abs(i - current) <= delta) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return pages
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useLanguage()
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('common.prevPage')}
      >
        ‹
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span className="page-ellipsis" key={`ellipsis-${idx}`}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('common.nextPage')}
      >
        ›
      </button>
    </nav>
  )
}

export default Pagination
