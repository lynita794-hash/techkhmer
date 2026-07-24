import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import HomeSection from '../components/HomeSection'
import DramaGrid from '../components/DramaGrid'
import Pagination from '../components/Pagination'
import Footer from '../components/Footer'
import AdSlot from '../components/AdSlot'
import HeroSlider from '../components/HeroSlider'
import SeoHead from '../components/SeoHead'
import ContinueWatching from '../components/ContinueWatching'
import { useAuth } from '../context/AuthContext'
import { fetchAds, fetchDramas, fetchSettings, fetchSlides, fetchWatchHistory } from '../utils/adminApi'
import { DEFAULT_HOME_SECTIONS, getSectionMoreHref } from '../config/homeSections'

const PAGE_SIZE = 12

function HomePage() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const initialType = searchParams.get('type') || 'all'
  const { token } = useAuth()

  const [dramas, setDramas] = useState([])
  const [category, setCategory] = useState(initialCategory)
  const [type, setType] = useState(initialType)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [homeSections, setHomeSections] = useState(DEFAULT_HOME_SECTIONS)
  const [ads, setAds] = useState([])
  const [slides, setSlides] = useState([])
  const [sliderEnabled, setSliderEnabled] = useState(true)
  const [continueWatching, setContinueWatching] = useState([])
  const [loading, setLoading] = useState(true)
  // Per-section current page, keyed by section key — only used for
  // "latest" type sections that opt into page navigation on the homepage
  // itself (instead of just a fixed preview + "» see all" link).
  const [sectionPage, setSectionPage] = useState({})

  useEffect(() => {
    fetchDramas()
      .then(setDramas)
      .finally(() => setLoading(false))
    fetchAds().then(setAds).catch(() => {})
    fetchSlides().then(setSlides).catch(() => {})
    fetchSettings()
      .then((data) => {
        if (Array.isArray(data.homeSections) && data.homeSections.length > 0) {
          setHomeSections(data.homeSections)
        }
        setSliderEnabled(data.sliderEnabled ?? true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!token) {
      setContinueWatching([])
      return
    }
    fetchWatchHistory(token)
      .then(setContinueWatching)
      .catch(() => {})
  }, [token])

  const initialSort = searchParams.get('sort') || 'default'
  const [sort, setSort] = useState(initialSort)

  // Keep the URL query in sync with the selected category/type/sort (e.g. footer links)
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all'
    const urlType = searchParams.get('type') || 'all'
    const urlSort = searchParams.get('sort') || 'default'
    if (urlCategory !== category) {
      setCategory(urlCategory)
      setPage(1)
    }
    if (urlType !== type) {
      setType(urlType)
      setPage(1)
    }
    if (urlSort !== sort) {
      setSort(urlSort)
      setPage(1)
    }
  }, [searchParams, category, type, sort])

  const handleSearchChange = (value) => {
    setSearch(value)
    setPage(1)
  }

  // Category + search apply regardless of type. `type` itself is only used
  // to switch between the "browse everything split by type" home view and
  // the "focused, paginated" view for one specific type.
  const byCategoryAndSearch = useMemo(() => {
    return dramas.filter((d) => {
      const matchCategory = category === 'all' || d.category === category
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [dramas, category, search])

  const movies = useMemo(
    () => byCategoryAndSearch.filter((d) => d.type === 'Movie'),
    [byCategoryAndSearch],
  )
  const tvShows = useMemo(
    () => byCategoryAndSearch.filter((d) => d.type !== 'Movie'),
    [byCategoryAndSearch],
  )
  // "LATEST UPDATED" spans every type — sorted by the most recently
  // added/edited drama first, using the `updatedAt` timestamp from the API.
  const latestUpdated = useMemo(
    () =>
      [...byCategoryAndSearch].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
      ),
    [byCategoryAndSearch],
  )

  const byType = useMemo(() => {
    if (type === 'all') return byCategoryAndSearch
    return byCategoryAndSearch.filter((d) => d.type === type)
  }, [byCategoryAndSearch, type])

  const filtered = useMemo(() => {
    if (sort === 'latest') return latestUpdated
    return byType
  }, [sort, latestUpdated, byType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const showSplitSections = type === 'all' && sort === 'default'

  return (
    <>
      <SeoHead url={typeof window !== 'undefined' ? window.location.origin : ''} />

      <Navbar search={search} onSearchChange={handleSearchChange} />

      {sliderEnabled && showSplitSections && <HeroSlider slides={slides} />}

      {showSplitSections && <ContinueWatching items={continueWatching} />}

      <AdSlot ads={ads} placement="home_top" />

      <main>
        {showSplitSections ? (
          <>
            {(() => {
              // Local (non-state) flags so the "Top Hot Series"/"Top
              // Latest" ad only renders once even when an admin has
              // multiple movie/tvshow/latest-type sections — reset fresh
              // on every render since they're just plain variables, not
              // refs or state.
              let seenHotSeries = false
              let seenLatest = false
              return homeSections
                .filter((s) => s.visible)
                .map((s) => {
                const sectionType = s.type || s.key
                let source
                if (sectionType === 'movie') source = movies
                else if (sectionType === 'tvshow') source = tvShows
                else if (sectionType === 'latest') source = latestUpdated
                else if (sectionType === 'category' && s.categoryKey) {
                  source = dramas.filter(
                    (d) =>
                      d.category === s.categoryKey &&
                      d.title.toLowerCase().includes(search.toLowerCase()),
                  )
                } else source = []

                const limit = s.limit || 6
                // LATEST UPDATED gets real page navigation on the homepage
                // itself (grid mode only — slider mode already has its own
                // prev/next arrows) instead of just a fixed preview.
                const paginate = sectionType === 'latest' && !s.sliderMode
                const sectionTotalPages = paginate
                  ? Math.max(1, Math.ceil(source.length / limit))
                  : 1
                const sectionCurrentPage = Math.min(sectionPage[s.key] || 1, sectionTotalPages)
                const sectionItems = paginate
                  ? source.slice(
                      (sectionCurrentPage - 1) * limit,
                      sectionCurrentPage * limit,
                    )
                  : source.slice(0, limit)

                // "Top Hot Series" / "Top Latest" ad slots render just
                // above the first section of each matching type — movie/
                // tvshow sections count as "Hot Series", the latest-
                // updated section counts as "Latest".
                const isFirstHotSeries =
                  (sectionType === 'movie' || sectionType === 'tvshow') && !seenHotSeries
                const isFirstLatest = sectionType === 'latest' && !seenLatest
                if (isFirstHotSeries) seenHotSeries = true
                if (isFirstLatest) seenLatest = true

                return (
                  <div key={s.key}>
                    {isFirstHotSeries && <AdSlot ads={ads} placement="top_hot_series" />}
                    {isFirstLatest && <AdSlot ads={ads} placement="top_latest" />}
                    <HomeSection
                      title={s.label}
                      dramas={sectionItems}
                      moreHref={getSectionMoreHref(s)}
                      slider={!!s.sliderMode}
                      autoPlay={!!s.autoPlay}
                      autoPlaySpeed={s.autoPlaySpeed}
                      loading={loading}
                    />
                    {paginate && (
                      <Pagination
                        currentPage={sectionCurrentPage}
                        totalPages={sectionTotalPages}
                        onPageChange={(p) =>
                          setSectionPage((prev) => ({ ...prev, [s.key]: p }))
                        }
                      />
                    )}
                  </div>
                )
                })
            })()}
          </>
        ) : (
          <>
            <DramaGrid dramas={paged} loading={loading} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </main>

      <AdSlot ads={ads} placement="home_bottom" />

      <Footer />
    </>
  )
}

export default HomePage
