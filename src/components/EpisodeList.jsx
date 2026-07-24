import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './EpisodeList.css'

const SORT_STORAGE_KEY = 'dramatv_episode_sort'

// `continueEp` lets the caller flag a different episode than the one
// currently playing as "in progress" (e.g. the visitor's last saved
// watch position from "Continue Watching"), so they can spot and jump
// back to exactly where they left off instead of hunting for it.
function EpisodeList({
  episodes,
  activeEp,
  onSelect,
  hasSubtitle = true,
  status = 'ONGOING',
  continueEp = null,
  watchedEpisodes = [],
}) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(() => localStorage.getItem(SORT_STORAGE_KEY) === 'desc')
  const activeBtnRef = useRef(null)

  const toggleSort = () => {
    setSortDesc((prev) => {
      const next = !prev
      localStorage.setItem(SORT_STORAGE_KEY, next ? 'desc' : 'asc')
      return next
    })
  }

  const filtered = episodes.filter((ep) =>
    query.trim() === '' ? true : String(ep.number).includes(query.trim()),
  )
  const sorted = sortDesc ? [...filtered].reverse() : filtered

  // Which episodes show the NEW badge — a manual per-episode flag set by
  // the admin (Admin Panel > Video Episodes), only while the drama is
  // still ONGOING (a finished/completed show has no "new" episodes left).
  const isNew = (ep) => status === 'ONGOING' && !!ep.isNew
  // END is also a manual per-episode flag — the admin marks whichever
  // episode is the actual series finale, independent of status, since a
  // drama can be marked COMPLETED without every episode being flagged.
  const isEnd = (ep) => !!ep.isEnd

  // Scroll the currently-playing episode into view whenever it changes —
  // most useful right after opening a drama with many episodes, so the
  // visitor doesn't have to manually scroll to find where they are.
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeEp])

  return (
    <aside className="episode-list">
      <div className="episode-list-header">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
          />
        </svg>
        <span className="episode-title">
          {t('common.episodes')} <span className="episode-count">({episodes.length})</span>
        </span>

        <button
          type="button"
          className="episode-sort-btn"
          onClick={toggleSort}
          aria-label={sortDesc ? t('common.sortAscending') : t('common.sortDescending')}
          title={sortDesc ? t('common.sortAscending') : t('common.sortDescending')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={sortDesc ? 'M7 4v13m0 0l-3-3m3 3l3-3M17 20V7m0 0l3 3m-3-3l-3 3' : 'M7 20V7m0 0l-3 3m3-3l3 3M17 4v13m0 0l3-3m-3 3l-3-3'}
            />
          </svg>
        </button>
      </div>

      <div className="episode-list-filters">
        <div className="episode-search">
          <input
            type="text"
            placeholder={t('common.findNumber')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Find episode number"
          />
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 9.5 9.5 4.5 4.5 0 0 1 9.5 14z"
            />
          </svg>
        </div>
      </div>

      <div className="episode-grid">
        {sorted.map((ep) => {
          const isActive = activeEp === ep.number
          const isContinue = !isActive && continueEp === ep.number
          const isWatched = !isActive && watchedEpisodes.includes(ep.number)
          return (
            <button
              key={ep.number}
              ref={isActive ? activeBtnRef : null}
              className={`episode-btn ${isActive ? 'active' : ''} ${isContinue ? 'continue' : ''} ${
                isWatched ? 'watched' : ''
              } ${hasSubtitle ? '' : 'no-sub'}`}
              onClick={() => onSelect(ep.number)}
              aria-current={isActive ? 'true' : undefined}
              title={isContinue ? t('common.continueFromHere') : undefined}
            >
              <span className="episode-num">{ep.number}</span>
              {isWatched && (
                <svg className="episode-watched-check" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 6L9 17l-5-5"
                  />
                </svg>
              )}
              {isEnd(ep) ? (
                <span className="episode-footer episode-footer-end">{t('common.end')}</span>
              ) : isNew(ep) ? (
                <span className="episode-footer episode-footer-new">{t('common.new')}</span>
              ) : ep.ccText && ep.isCc !== false ? (
                // Custom text typed by the admin for this episode is an
                // explicit per-episode override — show it regardless of
                // the drama-wide "hasSubtitle" switch, since the admin
                // deliberately turned CC on and typed something for this
                // specific episode.
                <span className="episode-footer episode-footer-sub">
                  <span className="episode-cc-tag">CC</span>
                  {ep.ccText}
                </span>
              ) : (
                // No longer gated by the drama-wide "hasSubtitle" switch —
                // that toggle was removed from the Admin Panel, so this now
                // depends only on the per-episode CC toggle.
                ep.isCc !== false && (
                  <span className="episode-footer episode-footer-sub">
                    <span className="episode-cc-tag">CC</span>
                    {t('common.sub')}
                  </span>
                )
              )}
            </button>
          )
        })}
        {sorted.length === 0 && <p className="episode-empty">—</p>}
      </div>
    </aside>
  )
}

export default EpisodeList
