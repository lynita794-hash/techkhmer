import { useEffect, useRef, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { fetchTmdbDetails, searchTmdb } from '../../utils/adminApi'
import './TmdbImportModal.css'

// Detects a direct TMDB ID or URL in the input, e.g.:
//   "322055"
//   "https://www.themoviedb.org/tv/125988-silo"
//   "https://www.themoviedb.org/movie/12345-some-title"
// Returns { id, type } or null if the input isn't an ID/URL.
function parseTmdbInput(input) {
  const trimmed = input.trim()

  if (/^\d+$/.test(trimmed)) {
    return { id: trimmed, type: null }
  }

  const match = trimmed.match(/themoviedb\.org\/(tv|movie)\/(\d+)/i)
  if (match) {
    return { id: match[2], type: match[1] }
  }

  return null
}

function TmdbImportModal({ onClose, onImport }) {
  const { token } = useAdminAuth()
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState('tv')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [importingId, setImportingId] = useState(null)
  const [error, setError] = useState('')
  const autoSearchedRef = useRef('')

  const runSearch = async (rawQuery, typeOverride) => {
    const q = rawQuery.trim()
    if (!q) return
    setError('')
    setSearching(true)
    setResults([])

    try {
      const direct = parseTmdbInput(q)

      if (direct) {
        // Input is a TMDB ID or URL — fetch it directly instead of searching by title.
        const typeToUse = direct.type || typeOverride || mediaType
        if (direct.type) setMediaType(direct.type)
        const details = await fetchTmdbDetails(token, direct.id, typeToUse)
        setResults([
          {
            tmdbId: Number(direct.id),
            title: details.title,
            overview: details.description,
            poster: details.poster,
            backdrop: details.backdrop,
            year: details.premiered ? String(details.premiered) : '',
            mediaType: typeToUse,
          },
        ])
      } else {
        const data = await searchTmdb(token, q, typeOverride || mediaType)
        setResults(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    runSearch(query)
  }

  // Auto Detect: as soon as a pasted TMDB ID or URL is recognized, auto-run
  // the search (and auto-switch TV/Movie to match) without waiting for the
  // admin to click "ស្វែងរក" — saves a click on the most common workflow
  // (paste a TMDB link straight from the browser).
  useEffect(() => {
    const direct = parseTmdbInput(query)
    if (!direct) return
    if (autoSearchedRef.current === query) return
    autoSearchedRef.current = query

    const timer = setTimeout(() => runSearch(query, direct.type), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleImport = async (item) => {
    setError('')
    setImportingId(item.tmdbId)
    try {
      const details = await fetchTmdbDetails(token, item.tmdbId, item.mediaType)
      onImport(details)
    } catch (err) {
      setError(err.message)
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="tmdb-modal-overlay" onClick={onClose}>
      <div className="tmdb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tmdb-modal-header">
          <h2>ស្វែងរកពី TMDB</h2>
          <button className="tmdb-modal-close" onClick={onClose} aria-label="បិទ">
            ✕
          </button>
        </div>

        <form className="tmdb-search-form" onSubmit={handleSearch}>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
            <option value="tv">TV Series</option>
            <option value="movie">Movie</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="វាយឈ្មោះរឿង ឬ ដាក់ TMDB ID/URL (ឧ. 322055)..."
            autoFocus
          />
          <button type="submit" disabled={searching}>
            {searching ? 'កំពុងស្វែងរក...' : 'ស្វែងរក'}
          </button>
        </form>

        {error && <p className="tmdb-error">{error}</p>}

        <div className="tmdb-results">
          {results.map((item) => (
            <div className="tmdb-result-card" key={item.tmdbId}>
              <img
                src={item.poster || 'https://via.placeholder.com/80x120?text=No+Image'}
                alt={item.title}
              />
              <div className="tmdb-result-info">
                <h3>
                  {item.title} {item.year && `(${item.year})`}
                </h3>
                <p>{item.overview?.slice(0, 140) || 'គ្មានសេចក្តីសង្ខេប'}</p>
              </div>
              <button
                className="tmdb-import-btn"
                onClick={() => handleImport(item)}
                disabled={importingId === item.tmdbId}
              >
                {importingId === item.tmdbId ? 'កំពុងទាញ...' : 'ប្រើទិន្នន័យនេះ'}
              </button>
            </div>
          ))}
          {!searching && results.length === 0 && (
            <p className="tmdb-empty">វាយឈ្មោះរឿងហើយចុច "ស្វែងរក" ដើម្បីចាប់ផ្តើម។</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TmdbImportModal
