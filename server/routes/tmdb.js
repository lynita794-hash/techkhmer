import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500'
// Backdrops are wide landscape images — w1280 looks sharp as a homepage
// banner/slider image without downloading the (huge) "original" size.
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

// The key can be set either in server/.env (TMDB_API_KEY) or via the
// Admin Panel Settings page (stored in site_settings). The Settings page
// value takes precedence when present.
function getApiKey() {
  const row = db.prepare('SELECT tmdb_api_key FROM site_settings WHERE id = 1').get()
  const key = row?.tmdb_api_key || process.env.TMDB_API_KEY
  if (!key) {
    throw Object.assign(
      new Error('TMDB API Key មិនទាន់បានកំណត់ទេ។ សូមកំណត់វានៅផ្នែក ការកំណត់ (Settings)។'),
      { status: 500 },
    )
  }
  return key
}

// GET /api/tmdb/search?query=...&type=tv|movie — search TMDB (admin only)
router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const apiKey = getApiKey()
    const { query, type } = req.query
    if (!query) return res.status(400).json({ error: 'query is required' })

    const mediaType = type === 'movie' ? 'movie' : 'tv'
    const url = `${TMDB_BASE}/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(
      query,
    )}&language=en-US`

    const tmdbRes = await fetch(url)
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: 'TMDB API មិនឆ្លើយតបទេ' })
    }
    const data = await tmdbRes.json()

    const results = (data.results || []).map((item) => ({
      tmdbId: item.id,
      title: item.name || item.title,
      overview: item.overview,
      poster: item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : null,
      backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : null,
      year: (item.first_air_date || item.release_date || '').slice(0, 4),
      voteAverage: item.vote_average,
      mediaType,
    }))

    res.json(results)
  } catch (err) {
    next(err)
  }
})

// GET /api/tmdb/details?id=...&type=tv|movie — fetch full details for import (admin only)
router.get('/details', requireAuth, async (req, res, next) => {
  try {
    const apiKey = getApiKey()
    const { id, type } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })

    const mediaType = type === 'movie' ? 'movie' : 'tv'
    // append_to_response=credits pulls crew (director/producer names) in the
    // same request, so we don't need a second API call for Producers.
    const url = `${TMDB_BASE}/${mediaType}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits`

    const tmdbRes = await fetch(url)
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: 'TMDB API មិនឆ្លើយតបទេ' })
    }
    const item = await tmdbRes.json()

    const genres = (item.genres || []).map((g) => g.name.toLowerCase())
    const countries =
      item.origin_country?.[0] ||
      item.production_countries?.[0]?.iso_3166_1 ||
      ''

    // Duration: TV shows expose episode_run_time (array, usually one value),
    // movies expose a single runtime (in minutes).
    const runtimeMinutes =
      mediaType === 'movie'
        ? item.runtime
        : item.episode_run_time?.[0] || item.last_episode_to_air?.runtime

    // Studios: join every production company instead of only the first one.
    const studios = (item.production_companies || []).map((c) => c.name).join(', ')

    // Broadcast: TV shows expose the airing network (e.g. tvN, CCTV, Netflix).
    // Movies don't have an equivalent field on TMDB.
    const broadcast = item.networks?.map((n) => n.name).join(', ') || ''

    // Producers: pulled from the credits crew list (job === "Producer" or
    // "Executive Producer"). Falls back to empty if TMDB has no credit data.
    const crew = item.credits?.crew || []
    const producerNames = crew
      .filter((c) => c.job === 'Producer' || c.job === 'Executive Producer')
      .map((c) => c.name)
    const producers = [...new Set(producerNames)].slice(0, 5).join(', ')

    res.json({
      title: item.name || item.title,
      poster: item.poster_path ? `${TMDB_IMG_BASE}${item.poster_path}` : '',
      backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : '',
      description: item.overview || '',
      premiered: Number(
        (item.first_air_date || item.release_date || '').slice(0, 4),
      ) || null,
      dateAired: item.first_air_date || item.release_date || '',
      country: countries,
      genres,
      rating: item.vote_average ? Number((item.vote_average / 2).toFixed(1)) : 0,
      votes: item.vote_count || 0,
      ep: item.number_of_episodes || 1,
      status: item.status === 'Ended' ? 'ENDED' : 'ONGOING',
      type: mediaType === 'movie' ? 'Movie' : 'TV Series',
      studios,
      duration: runtimeMinutes ? `${runtimeMinutes} min` : '',
      broadcast,
      producers,
    })
  } catch (err) {
    next(err)
  }
})

export default router
