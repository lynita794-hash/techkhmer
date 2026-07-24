import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VideoPlayer from '../components/VideoPlayer'
import PrerollAd from '../components/PrerollAd'
import OverlayPlayerAd from '../components/OverlayPlayerAd'
import EpisodeList from '../components/EpisodeList'
import DramaInfo from '../components/DramaInfo'
import RelatedDramas from '../components/RelatedDramas'
import Footer from '../components/Footer'
import AdSlot from '../components/AdSlot'
import SeoHead from '../components/SeoHead'
import CommentSection from '../components/CommentSection'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  fetchAds,
  fetchCategories,
  fetchDramas,
  fetchRandomPrerollAd,
  fetchSettings,
  fetchWatchedEpisodes,
  fetchWatchHistory,
  markEpisodeWatched,
  recordDramaView,
  updateWatchHistory,
} from '../utils/adminApi'
import {
  buildWatchPath,
  extractEpisodeNumber,
  extractIdFromSlug,
} from '../utils/slug'
import {
  buildBreadcrumbSchema,
  buildPlaylistSchema,
  buildVideoObjectSchema,
  buildWatchActionSchema,
} from '../utils/seo'
import './WatchPage.css'

function WatchPage() {
  const { titleSlug, epSlug } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [dramas, setDramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState([])
  const [categories, setCategories] = useState([])
  const [watchHistory, setWatchHistory] = useState([])
  const [watchedEpisodes, setWatchedEpisodes] = useState([])
  const [preroll, setPreroll] = useState(null) // { videoUrl, skipSeconds, clickUrl } | null, one randomly picked ad
  const [autoPlayVideo, setAutoPlayVideo] = useState(false)
  // Shown once per drama (not once per episode) — otherwise switching
  // episodes within the same drama would replay the ad every time. Keyed
  // per-dramaId (not a plain boolean) because WatchPage stays mounted
  // when navigating between different dramas (same route, just a
  // different :titleSlug param) — a plain boolean would get set to true
  // once and then silently block the ad forever for every other drama
  // visited afterward in the same tab.
  const [prerollDismissedFor, setPrerollDismissedFor] = useState(null)
  const playerRef = useRef(null)

  const dramaId = extractIdFromSlug(titleSlug)

  // Scroll the video player into view whenever a new drama/episode is opened
  useEffect(() => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [titleSlug])

  // Count one view per drama visit — keyed on dramaId (not episode), so
  // switching episodes within the same drama doesn't inflate the count.
  useEffect(() => {
    if (dramaId) recordDramaView(dramaId)
  }, [dramaId])

  useEffect(() => {
    fetchDramas()
      .then(setDramas)
      .finally(() => setLoading(false))
    fetchAds().then(setAds).catch(() => {})
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  // Fetches a fresh random preroll ad whenever a *different* drama is
  // opened (not on every episode change within the same drama — see
  // prerollDismissedFor above). Runs once per dramaId rather than once
  // per WatchPage mount, since React Router keeps this component mounted
  // across drama-to-drama navigation.
  useEffect(() => {
    if (!dramaId) return
    setPreroll(null)
    fetchSettings()
      .then((data) => {
        setAutoPlayVideo(!!data.autoPlayVideo)
        if (!data.prerollEnabled) return
        // Only ask for a random ad once the feature is actually enabled —
        // an empty pool (or all-disabled) resolves to null, in which case
        // preroll just stays unset and the real player shows immediately.
        fetchRandomPrerollAd()
          .then((ad) => {
            if (ad) {
              setPreroll({
                videoUrl: ad.videoUrl,
                skipSeconds: ad.skipSeconds ?? 5,
                clickUrl: ad.clickUrl || '',
              })
            }
          })
          .catch(() => {})
      })
      .catch(() => {})
  }, [dramaId])

  useEffect(() => {
    if (!token) {
      setWatchHistory([])
      return
    }
    fetchWatchHistory(token)
      .then(setWatchHistory)
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token || !dramaId) {
      setWatchedEpisodes([])
      return
    }
    fetchWatchedEpisodes(token, dramaId)
      .then(setWatchedEpisodes)
      .catch(() => {})
  }, [token, dramaId])

  const drama = useMemo(
    () => dramas.find((d) => d.id === dramaId),
    [dramas, dramaId],
  )
  const epFromUrl = extractEpisodeNumber(epSlug)
  const [activeEp, setActiveEp] = useState(epFromUrl)
  // Which mirror server (source label) is currently selected — only
  // meaningful when an episode has more than one source. Resets to the
  // first source whenever the drama/episode changes below.
  const [activeServer, setActiveServer] = useState(null)

  // Keep activeEp in sync when the URL changes (e.g. browser back/forward, direct link)
  useEffect(() => {
    setActiveEp(epFromUrl)
  }, [dramaId, epFromUrl])

  // Reset the selected server back to the default (first source) whenever
  // a different drama/episode is opened — a server chosen on EP 3 has no
  // guarantee of existing on EP 4.
  useEffect(() => {
    setActiveServer(null)
  }, [dramaId, activeEp])

  const selectEpisode = (number) => {
    setActiveEp(number)
    if (drama) {
      navigate(buildWatchPath(drama, number))
    }
  }

  // Periodically save watch position for "Continue Watching" — only for
  // signed-in users, silently ignored otherwise (never blocks playback).
  const handlePlayerProgress = (positionSeconds) => {
    if (!token || !drama) return
    updateWatchHistory(token, drama.id, activeEp, positionSeconds).catch(() => {})
  }

  // Marks the episode as fully watched once playback reaches the end, so
  // the Episode Playlist can show a checkmark on it going forward — only
  // for signed-in users, and updates local state immediately so the
  // checkmark appears without waiting for a refetch.
  const handleEpisodeComplete = () => {
    if (!token || !drama) return
    setWatchedEpisodes((prev) => (prev.includes(activeEp) ? prev : [...prev, activeEp]))
    markEpisodeWatched(token, drama.id, activeEp).catch(() => {})
  }

  const related = useMemo(() => {
    if (!drama) return []
    const sameCategory = dramas.filter(
      (d) => d.id !== drama.id && d.category === drama.category,
    )
    const others = dramas.filter(
      (d) => d.id !== drama.id && d.category !== drama.category,
    )
    // Fill up to 12 items (two rows of 6) — same category first, then others
    return [...sameCategory, ...others].slice(0, 12)
  }, [dramas, drama])

  if (!drama) {
    return (
      <div className="watch-page">
        <Navbar search={search} onSearchChange={setSearch} />
        {!loading && <p className="not-found">{t('watch.notFound')}</p>}
        <Footer />
      </div>
    )
  }

  const episode =
    drama.episodes.find((e) => e.number === activeEp) || drama.episodes[0]
  const isMovie = drama.type === 'Movie'
  const hasNext = !isMovie && activeEp < drama.episodes.length
  // Title switches with the site-wide language toggle: Khmer title when
  // set and lang is 'km', otherwise the main (English/romanized) title.
  const displayTitle = (lang === 'km' && drama.titleKh) || drama.title

  // Resolve which video URL actually plays: prefer the selected server's
  // source if it exists on this episode, otherwise fall back to the
  // first available source, then the legacy single videoUrl field.
  const episodeSources = episode.sources?.length
    ? episode.sources
    : episode.videoUrl
      ? [{ label: 'Server 1', url: episode.videoUrl }]
      : []
  const currentSource =
    episodeSources.find((s) => s.label === activeServer) || episodeSources[0]
  const currentVideoUrl = currentSource?.url || episode.videoUrl

  // Only resume mid-episode if the saved position is for this exact
  // drama + episode — otherwise (different episode, or first visit)
  // start from the top like normal.
  const savedHistory = watchHistory.find((h) => h.dramaId === drama.id)
  const resumePosition =
    savedHistory && savedHistory.episodeNumber === activeEp
      ? savedHistory.positionSeconds
      : 0

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const categoryLabel = categories.find((c) => c.key === drama.category)?.label

  // Main entity: Movie/TVSeries + nested VideoObject for the episode
  // currently playing + (for series) the full episode playlist so search
  // engines can index every episode's own watch URL from one page.
  const mainEntitySchema = {
    '@context': 'https://schema.org',
    '@type': isMovie ? 'Movie' : 'TVSeries',
    name: displayTitle,
    image: drama.poster,
    description: drama.description,
    genre: drama.genres,
    datePublished: drama.dateAired || undefined,
    contentRating: drama.contentRating || undefined,
    inLanguage: 'km',
    aggregateRating:
      drama.votes > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: drama.rating,
            bestRating: 5,
            ratingCount: drama.votes,
          }
        : undefined,
    video: buildVideoObjectSchema({ drama, episode, activeEp, pageUrl }),
    containsSeason: buildPlaylistSchema(drama),
    potentialAction: buildWatchActionSchema(pageUrl),
  }

  const breadcrumbSchema = buildBreadcrumbSchema({ drama, categoryLabel, activeEp, pageUrl })

  return (
    <div className="watch-page">
      <SeoHead
        title={`${displayTitle} - EP ${activeEp}`}
        description={drama.description?.slice(0, 160)}
        image={drama.backdrop || drama.poster}
        url={pageUrl}
        type="video.other"
        videoUrl={episode?.videoUrl}
        jsonLd={[mainEntitySchema, breadcrumbSchema]}
      />

      <div
        className="watch-backdrop"
        style={{ backgroundImage: `url(${drama.backdrop || drama.poster})` }}
      />

      <Navbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          navigate('/')
        }}
      />

      <AdSlot ads={ads} placement="single_post_top" />

      <div className={`watch-layout ${isMovie ? 'watch-layout-single' : ''}`} ref={playerRef}>
        <div className="watch-main">
          <AdSlot ads={ads} placement="watch_above_player" />
          <div className="watch-player-wrap">
            {preroll && prerollDismissedFor !== dramaId ? (
              <PrerollAd
                videoUrl={preroll.videoUrl}
                skipSeconds={preroll.skipSeconds}
                clickUrl={preroll.clickUrl}
                onComplete={() => setPrerollDismissedFor(dramaId)}
              />
            ) : (
              <>
                <VideoPlayer
                  src={currentVideoUrl}
                  poster={drama.backdrop || drama.poster}
                  subtitles={episode.subtitles}
                  hasSubtitle={drama.hasSubtitle}
                  onProgress={handlePlayerProgress}
                  initialPosition={resumePosition}
                  hasNext={hasNext}
                  nextTitle={hasNext ? `${displayTitle} — EP ${activeEp + 1}` : ''}
                  onNext={() => hasNext && selectEpisode(activeEp + 1)}
                  onEpisodeComplete={handleEpisodeComplete}
                  autoPlay={autoPlayVideo}
                />
                <OverlayPlayerAd ads={ads} />
                {episodeSources.length > 1 && (
                  <div className="server-switch-row">
                    <span className="server-switch-label">Server:</span>
                    {episodeSources.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        className={`server-switch-btn ${currentSource?.label === s.label ? 'is-active' : ''}`}
                        onClick={() => setActiveServer(s.label)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <AdSlot ads={ads} placement="watch_below_player" />
        </div>
        {!isMovie && (
          <div className="watch-sidebar">
            <AdSlot ads={ads} placement="watch_sidebar" />
            <EpisodeList
              episodes={drama.episodes}
              activeEp={activeEp}
              onSelect={selectEpisode}
              hasSubtitle={drama.hasSubtitle}
              status={drama.status}
              continueEp={savedHistory?.episodeNumber ?? null}
              watchedEpisodes={watchedEpisodes}
            />
          </div>
        )}
      </div>

      <DramaInfo drama={drama} />
      <RelatedDramas dramas={related} />
      <CommentSection dramaId={drama.id} />
      <AdSlot ads={ads} placement="single_post_bottom" />
      <Footer />
    </div>
  )
}

export default WatchPage
