import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createDrama,
  createSlide,
  deleteSlide,
  fetchCategories,
  fetchDrama,
  fetchSlides,
  updateDrama,
  updateSlide,
  uploadPoster,
} from '../../utils/adminApi'
import TmdbImportModal from './TmdbImportModal'
import { buildWatchPath } from '../../utils/slug'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminDramaForm.css'

const emptyForm = {
  title: '',
  titleKh: '',
  poster: '',
  category: 'chinese',
  status: 'ONGOING',
  type: 'TV Series',
  quality: 'HD',
  premiered: '',
  broadcast: '',
  dateAired: '',
  duration: '',
  contentRating: '',
  backdrop: '',
  source: '',
  country: '',
  rating: 0,
  votes: 0,
  description: '',
  genres: '',
  ep: 1,
  trailerUrl: '',
  hasSubtitle: true,
}

function AdminDramaForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { token } = useAdminAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [episodes, setEpisodes] = useState([
    {
      number: 1,
      sources: [{ label: 'Server 1', url: '' }],
      duration: '',
      isNew: false,
      isEnd: false,
      isCc: false,
      ccText: '',
      subtitles: [{ label: 'ខ្មែរ', url: '' }],
    },
  ])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  // --- Bulk Link Splitter (see below) ---
  const [bulkLinks, setBulkLinks] = useState('')
  const [bulkServerLabel, setBulkServerLabel] = useState('Server 1')
  const [bulkMessage, setBulkMessage] = useState('')
  // Backdrop/banner image (from TMDB or typed manually) — mirrored into
  // form.backdrop (Watch page video thumbnail) AND automatically kept in
  // sync with this drama's own Banner Slider slide (see syncBannerSlide),
  // so admins no longer need a manual "add to slider" step.
  const [backdropUrl, setBackdropUrl] = useState('')
  // Tracks the slide row already linked to this drama (drama_id), if any
  // — lets syncBannerSlide update/delete the right row instead of
  // creating duplicates every time the backdrop changes.
  const [linkedSlideId, setLinkedSlideId] = useState(null)
  // Auto-open the TMDB import modal when creating a brand new drama, so
  // admins land straight on the search instead of an extra click. Editing
  // an existing drama never auto-opens it (would be surprising mid-edit).
  const [showTmdbModal, setShowTmdbModal] = useState(!isEdit)

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (!isEdit) return
    fetchDrama(id).then((drama) => {
      setForm({
        title: drama.title || '',
        titleKh: drama.titleKh || '',
        poster: drama.poster || '',
        category: drama.category || 'chinese',
        status: drama.status || 'ONGOING',
        type: drama.type || 'TV Series',
        quality: drama.quality || 'HD',
        premiered: drama.premiered || '',
        broadcast: drama.broadcast || '',
        dateAired: drama.dateAired || '',
        duration: drama.duration || '',
        contentRating: drama.contentRating || '',
        backdrop: drama.backdrop || '',
        source: drama.source || '',
        country: drama.country || '',
        rating: drama.rating || 0,
        votes: drama.votes || 0,
        description: drama.description || '',
        genres: (drama.genres || []).join(', '),
        ep: drama.ep || 1,
        trailerUrl: drama.trailerUrl || '',
        hasSubtitle: drama.hasSubtitle ?? true,
      })
      setEpisodes(
        drama.episodes?.length
          ? drama.episodes.map((ep) => ({
              number: ep.number,
              sources:
                ep.sources?.length > 0
                  ? ep.sources
                  : ep.videoUrl
                    ? [{ label: 'Server 1', url: ep.videoUrl }]
                    : [{ label: 'Server 1', url: '' }],
              duration: ep.duration || '',
              isNew: !!ep.isNew,
              isEnd: !!ep.isEnd,
              isCc: ep.isCc === undefined ? true : !!ep.isCc,
              ccText: ep.ccText || '',
              subtitles:
                ep.subtitles?.length > 0
                  ? ep.subtitles
                  : [{ label: 'ខ្មែរ', url: '' }],
            }))
          : [
              {
                number: 1,
                sources: [{ label: 'Server 1', url: '' }],
                duration: '',
                isNew: false,
                isEnd: false,
                isCc: false,
                ccText: '',
                subtitles: [{ label: 'ខ្មែរ', url: '' }],
              },
            ],
      )
      // Restore the backdrop preview box when editing a drama that
      // already has one saved, so the field/preview isn't blank until
      // the admin re-runs the TMDB search.
      if (drama.backdrop) {
        setBackdropUrl(drama.backdrop)
      }
      // Find this drama's already-linked slide (if any) so later syncs
      // update/delete that exact row instead of creating a duplicate.
      fetchSlideByDrama(token, id).then((slide) => {
        if (slide) setLinkedSlideId(slide.id)
      })
    })
  }, [id, isEdit, token])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEpisodeCountChange = (count) => {
    const n = Math.max(1, Number(count) || 1)
    updateField('ep', n)
    setEpisodes((prev) => {
      const next = Array.from({ length: n }, (_, i) => ({
        number: i + 1,
        sources: prev[i]?.sources || [{ label: 'Server 1', url: '' }],
        duration: prev[i]?.duration || '',
        isNew: prev[i]?.isNew || false,
        isEnd: prev[i]?.isEnd || false,
        isCc: prev[i]?.isCc ?? false,
        ccText: prev[i]?.ccText || '',
        subtitles: prev[i]?.subtitles || [{ label: 'ខ្មែរ', url: '' }],
      }))
      return next
    })
  }

  const toggleEpisodeNew = (index) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, isNew: !ep.isNew } : ep)),
    )
  }

  const toggleEpisodeEnd = (index) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, isEnd: !ep.isEnd } : ep)),
    )
  }

  const toggleEpisodeCc = (index) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, isCc: !ep.isCc } : ep)),
    )
  }

  const updateEpisodeCcText = (index, ccText) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, ccText } : ep)),
    )
  }

  const updateEpisodeDuration = (index, duration) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, duration } : ep)),
    )
  }

  const addEpisode = () => {
    setEpisodes((prev) => {
      const next = [
        ...prev,
        {
          number: prev.length + 1,
          sources: [{ label: 'Server 1', url: '' }],
          duration: '',
          isNew: false,
          isEnd: false,
          isCc: false,
          ccText: '',
          subtitles: [{ label: 'ខ្មែរ', url: '' }],
        },
      ]
      updateField('ep', next.length)
      return next
    })
  }

  const removeEpisode = (index) => {
    setEpisodes((prev) => {
      const next = prev
        .filter((_, i) => i !== index)
        .map((ep, i) => ({ ...ep, number: i + 1 }))
      updateField('ep', next.length || 1)
      return next.length
        ? next
        : [
            {
              number: 1,
              sources: [{ label: 'Server 1', url: '' }],
              duration: '',
              isNew: false,
              isEnd: false,
              isCc: false,
              ccText: '',
              subtitles: [{ label: 'ខ្មែរ', url: '' }],
            },
          ]
    })
  }

  // --- Multi-server source helpers (each episode can carry several
  // mirror video links, e.g. "Server 1", "Server 2", ...) ---
  const addSource = (epIndex) => {
    setEpisodes((prev) =>
      prev.map((ep, i) =>
        i === epIndex
          ? { ...ep, sources: [...ep.sources, { label: `Server ${ep.sources.length + 1}`, url: '' }] }
          : ep,
      ),
    )
  }

  const removeSource = (epIndex, srcIndex) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => {
        if (i !== epIndex) return ep
        const nextSources = ep.sources.filter((_, si) => si !== srcIndex)
        return {
          ...ep,
          sources: nextSources.length ? nextSources : [{ label: 'Server 1', url: '' }],
        }
      }),
    )
  }

  const updateSourceField = (epIndex, srcIndex, field, value) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => {
        if (i !== epIndex) return ep
        return {
          ...ep,
          sources: ep.sources.map((s, si) =>
            si === srcIndex ? { ...s, [field]: value } : s,
          ),
        }
      }),
    )
  }

  // --- Bulk Link Splitter: paste many links at once (one per line) and
  // auto-distribute them into Episode 1, 2, 3... for the chosen server
  // label. If that server label already exists on an episode, its URL
  // is overwritten; otherwise a new source entry is appended. Episodes
  // beyond the current count are created automatically so admins don't
  // have to set "ចំនួន Episode" first.
  const handleBulkSplit = () => {
    const links = bulkLinks
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (links.length === 0) {
      setBulkMessage('សូមបញ្ចូល Link យ៉ាងហោចណាស់មួយ')
      return
    }

    setEpisodes((prev) => {
      const next = [...prev]
      // Grow the episode list if there are more links than episodes.
      while (next.length < links.length) {
        next.push({
          number: next.length + 1,
          sources: [{ label: 'Server 1', url: '' }],
          duration: '',
          isNew: false,
          isEnd: false,
          isCc: false,
          ccText: '',
          subtitles: [{ label: 'ខ្មែរ', url: '' }],
        })
      }

      links.forEach((url, i) => {
        const ep = next[i]
        const existingIndex = ep.sources.findIndex((s) => s.label === bulkServerLabel)
        const nextSources =
          existingIndex >= 0
            ? ep.sources.map((s, si) => (si === existingIndex ? { ...s, url } : s))
            : [...ep.sources, { label: bulkServerLabel, url }]
        next[i] = { ...ep, sources: nextSources }
      })

      updateField('ep', next.length)
      return next
    })

    setBulkMessage(`✓ បានបំបែក ${links.length} Link ទៅ ${bulkServerLabel} រួចរាល់`)
    setBulkLinks('')
  }

  // --- Subtitle helpers (multiple subtitles per episode) ---
  const addSubtitle = (epIndex) => {
    setEpisodes((prev) =>
      prev.map((ep, i) =>
        i === epIndex
          ? { ...ep, subtitles: [...ep.subtitles, { label: '', url: '' }] }
          : ep,
      ),
    )
  }

  const removeSubtitle = (epIndex, subIndex) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => {
        if (i !== epIndex) return ep
        const nextSubs = ep.subtitles.filter((_, si) => si !== subIndex)
        return {
          ...ep,
          subtitles: nextSubs.length ? nextSubs : [{ label: '', url: '' }],
        }
      }),
    )
  }

  const updateSubtitleField = (epIndex, subIndex, field, value) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => {
        if (i !== epIndex) return ep
        return {
          ...ep,
          subtitles: ep.subtitles.map((s, si) =>
            si === subIndex ? { ...s, [field]: value } : s,
          ),
        }
      }),
    )
  }

  const handleTmdbImport = (details) => {
    setForm((prev) => ({
      ...prev,
      title: details.title || prev.title,
      poster: details.poster || prev.poster,
      description: details.description || prev.description,
      premiered: details.premiered || prev.premiered,
      dateAired: details.dateAired || prev.dateAired,
      country: details.country || prev.country,
      genres: details.genres?.length ? details.genres.join(', ') : prev.genres,
      rating: details.rating || prev.rating,
      votes: details.votes || prev.votes,
      status: details.status || prev.status,
      type: details.type || prev.type,
      duration: details.duration || prev.duration,
      broadcast: details.broadcast || prev.broadcast,
    }))

    if (details.ep) {
      handleEpisodeCountChange(details.ep)
    }

    // Saved onto the drama itself — used as the Watch page's video
    // thumbnail/cover (see VideoPlayer's `poster` prop in WatchPage.jsx)
    // AND auto-synced to this drama's Banner Slider slide on save (see
    // syncBannerSlide in handleSubmit) — no manual "add to slider" step.
    updateField('backdrop', details.backdrop || '')
    setBackdropUrl(details.backdrop || '')
    setShowTmdbModal(false)
  }

  // Keeps this drama's own Banner Slider slide (identified by
  // slides.drama_id) automatically in sync with the current Backdrop
  // URL: creates one if none exists yet and a backdrop is set, updates
  // the image/title/link if one already exists, or removes it if the
  // backdrop was cleared. Runs as part of handleSubmit so it always
  // reflects whatever backdrop was actually saved with the drama.
  const syncBannerSlide = async (dramaId, title) => {
    const link = buildWatchPath({ id: dramaId, title }, 1)

    try {
      if (backdropUrl) {
        if (linkedSlideId) {
          await updateSlide(token, linkedSlideId, { image: backdropUrl, title, link })
        } else {
          const slide = await createSlide(token, {
            image: backdropUrl,
            title,
            link,
            dramaId,
          })
          setLinkedSlideId(slide.id)
        }
      } else if (linkedSlideId) {
        await deleteSlide(token, linkedSlideId)
        setLinkedSlideId(null)
      }
    } catch {
      // Non-fatal — the drama itself already saved successfully by the
      // time this runs; a slider sync hiccup shouldn't block the admin
      // from continuing (e.g. navigating away).
    }
  }

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadPoster(token, file)
      updateField('poster', url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      ...form,
      premiered: form.premiered ? Number(form.premiered) : null,
      rating: Number(form.rating) || 0,
      votes: Number(form.votes) || 0,
      ep: Number(form.ep) || episodes.length,
      genres: form.genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      episodes: episodes.map((ep) => ({
        ...ep,
        subtitles: ep.subtitles.filter((s) => s.url.trim()),
      })),
    }

    try {
      let savedDrama
      if (isEdit) {
        savedDrama = await updateDrama(token, id, payload)
      } else {
        savedDrama = await createDrama(token, payload)
      }
      await syncBannerSlide(savedDrama.id, savedDrama.title)
      navigate(`/${ADMIN_BASE_PATH}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-drama-form">
      <div className="admin-drama-form-header">
        <h1>{isEdit ? 'កែប្រែរឿងភាគ' : 'ផុសរឿងភាគថ្មី'}</h1>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {showTmdbModal && (
        <TmdbImportModal
          onClose={() => setShowTmdbModal(false)}
          onImport={handleTmdbImport}
        />
      )}

      <button
        type="button"
        className="tmdb-search-trigger-btn tmdb-search-trigger-btn-block"
        onClick={() => setShowTmdbModal(true)}
      >
        🔎 ស្វែងរកពី TMDB
      </button>

      {/* Always visible — for every post, not just after a TMDB import —
          so admins can also paste/edit a backdrop URL manually. Preview
          image only renders once a URL is actually set. Automatically
          synced to this drama's Banner Slider slide on save — see
          syncBannerSlide in handleSubmit — no manual "add" step needed. */}
      <div className="backdrop-preview-box">
        {backdropUrl && <img src={backdropUrl} alt="Backdrop / Banner preview" />}
        <div className="backdrop-preview-info">
          <span className="backdrop-preview-label">
            Backdrop / Banner URL (TMDB) — សម្រាប់ Video Thumbnail និង Banner Slider
            (Auto Sync ពេលរក្សាទុក)
          </span>
          <input
            type="text"
            value={backdropUrl}
            onChange={(e) => {
              setBackdropUrl(e.target.value)
              updateField('backdrop', e.target.value)
            }}
            placeholder="https://image.tmdb.org/t/p/w1280/..."
          />
          {backdropUrl && (
            <div className="backdrop-preview-actions">
              <button
                type="button"
                className="backdrop-dismiss-btn"
                onClick={() => {
                  setBackdropUrl('')
                  updateField('backdrop', '')
                }}
              >
                សម្អាត
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-layout">
        <div className="form-main">
        {/* --- Section 1: Poster + core identity fields --- */}
        <div className="form-section">
          <h2 className="form-section-title">ព័ត៌មានមូលដ្ឋាន</h2>

          <div className="basic-info-layout">
            <div className="poster-upload-block">
              <div className="poster-preview-box">
                {form.poster ? (
                  <img src={form.poster} alt="Preview" />
                ) : (
                  <span>គ្មានរូបភាព</span>
                )}
              </div>
              <label className="upload-btn upload-btn-block">
                {uploading ? 'កំពុង Upload...' : '📁 ជ្រើសរូបភាព'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterUpload}
                  hidden
                />
              </label>
              <input
                type="text"
                className="poster-url-input"
                value={form.poster}
                onChange={(e) => updateField('poster', e.target.value)}
                placeholder="ឬបញ្ចូល URL រូបភាព"
              />
            </div>

            <div className="basic-info-fields">
              <label className="form-field title-field">
                <span>ចំណងជើង (English/Romanized) *</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="ឈ្មោះរឿងភាគ"
                  required
                />
              </label>

              <label className="form-field title-field">
                <span>ចំណងជើងភាសាខ្មែរ (ស្រេចចិត្ត)</span>
                <input
                  type="text"
                  value={form.titleKh}
                  onChange={(e) => updateField('titleKh', e.target.value)}
                  placeholder="ឈ្មោះជាភាសាខ្មែរ — មិនចាំបាច់"
                />
              </label>

              <div className="classify-row">
                <label className="form-field">
                  <span>ប្រភេទ (Category) *</span>
                  <select
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>ស្ថានភាព</span>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                  >
                    <option value="ONGOING">ONGOING</option>
                    <option value="ENDED">ENDED</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>ចំនួន Episode *</span>
                  <input
                    type="number"
                    min="1"
                    value={form.ep}
                    onChange={(e) => handleEpisodeCountChange(e.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Quality</span>
                  <select
                    value={form.quality}
                    onChange={(e) => updateField('quality', e.target.value)}
                  >
                    <option value="HD">HD</option>
                    <option value="FHD">FHD</option>
                    <option value="4K">4K</option>
                    <option value="CAM">CAM</option>
                    <option value="SD">SD</option>
                  </select>
                </label>
              </div>

              <label className="form-field">
                <span>Genres (បំបែកដោយសញ្ញា ក្បៀស)</span>
                <input
                  type="text"
                  value={form.genres}
                  onChange={(e) => updateField('genres', e.target.value)}
                  placeholder="ឧ. chinese, romance, drama"
                />
              </label>

            </div>
          </div>
        </div>

        {/* --- Section 2: Secondary metadata (collapsible-feel via subdued styling) --- */}
        <div className="form-section">
          <h2 className="form-section-title">ព័ត៌មានលម្អិត</h2>
          <div className="form-grid">
            <label className="form-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                <option value="TV Series">TV Series</option>
                <option value="Movie">Movie</option>
              </select>
            </label>

            <label className="form-field">
              <span>ឆ្នាំចាក់ផាយ (Premiered)</span>
              <input
                type="number"
                value={form.premiered}
                onChange={(e) => updateField('premiered', e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>ប្រទេស (Country)</span>
              <input
                type="text"
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Duration</span>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => updateField('duration', e.target.value)}
                placeholder="ឧ. 35 min"
              />
            </label>

            <label className="form-field">
              <span>Source</span>
              <input
                type="text"
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Date aired</span>
              <input
                type="text"
                value={form.dateAired}
                onChange={(e) => updateField('dateAired', e.target.value)}
                placeholder="ឧ. 2024-05-26"
              />
            </label>

            <label className="form-field">
              <span>Broadcast</span>
              <input
                type="text"
                value={form.broadcast}
                onChange={(e) => updateField('broadcast', e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Content Rating</span>
              <input
                type="text"
                value={form.contentRating}
                onChange={(e) => updateField('contentRating', e.target.value)}
                placeholder="ឧ. TV-14, PG-13"
              />
            </label>
          </div>
        </div>

        {/* --- Section 3: Rating --- */}
        <div className="form-section">
          <h2 className="form-section-title">ការវាយតម្លៃ</h2>
          <div className="form-grid form-grid-narrow">
            <label className="form-field">
              <span>Rating (0-5)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => updateField('rating', e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Votes</span>
              <input
                type="number"
                min="0"
                value={form.votes}
                onChange={(e) => updateField('votes', e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* --- Section 4: Trailer + description --- */}
        <div className="form-section">
          <h2 className="form-section-title">Trailer & សេចក្តីសង្ខេប</h2>

          <label className="form-field">
            <span>Trailer URL (YouTube ឬ URL video ផ្សេង) — មិនចាំបាច់</span>
            <input
              type="text"
              value={form.trailerUrl}
              onChange={(e) => updateField('trailerUrl', e.target.value)}
              placeholder="ឧ. https://www.youtube.com/watch?v=..."
            />
          </label>

          <label className="form-field" style={{ marginTop: 16 }}>
            <span>សេចក្តីសង្ខេប (Description)</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </label>
        </div>
        </div>

        <div className="form-side">
        <div className="bulk-splitter-section">
          <div className="bulk-splitter-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
            <div>
              <h2>Bulk Link Splitter</h2>
              <p>បំបែក Link ច្រើនបញ្ចូលទៅក្នុង Server ស្វ័យប្រវត្តិ</p>
            </div>
          </div>

          <div className="bulk-splitter-row">
            <label className="form-field">
              <span>Target Server</span>
              <select
                value={bulkServerLabel}
                onChange={(e) => setBulkServerLabel(e.target.value)}
              >
                {/* Offer every server label already used across episodes,
                    plus the next unused "Server N" so admins can start a
                    brand-new mirror server directly from this dropdown. */}
                {Array.from(
                  new Set([
                    ...episodes.flatMap((ep) => ep.sources.map((s) => s.label)),
                    `Server ${Math.max(1, ...episodes.map((ep) => ep.sources.length)) + 1}`,
                  ]),
                ).map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>ចម្លង Links ច្រើនខ្ទប់ (មួយជួរមួយភាគ)</span>
            <textarea
              className="bulk-splitter-textarea"
              rows={6}
              value={bulkLinks}
              onChange={(e) => setBulkLinks(e.target.value)}
              placeholder={'https://server.com/ep1.mp4\nhttps://server.com/ep2.mp4\nhttps://server.com/ep3.mp4'}
            />
            <p className="field-hint">
              Tip: មួយជួរស្មើនឹង ១ ភាគ — ជួរទី ១ = EP 1, ជួរទី ២ = EP 2 ជាដើម។ បើភាគមិនទាន់មាន គេនឹងបង្កើតបន្ថែមស្វ័យប្រវត្តិ។
            </p>
          </label>

          {bulkMessage && <p className="bulk-splitter-message">{bulkMessage}</p>}

          <button type="button" className="bulk-splitter-submit-btn" onClick={handleBulkSplit}>
            ⚡ បំបែកចូល {bulkServerLabel}
          </button>
        </div>

        <div className="episodes-section">
          <div className="episodes-section-header">
            <h2>Video Episodes</h2>
            <button type="button" className="add-episode-btn" onClick={addEpisode}>
              + បញ្ចូល Episode
            </button>
          </div>

          <div className="episodes-list">
            {episodes.map((ep, index) => (
              <div className="episode-row" key={ep.number}>
                <div className="episode-row-number-col">
                  <span className="episode-row-number">EP {ep.number}</span>
                  <button
                    type="button"
                    className={`episode-new-toggle-btn ${ep.isNew ? 'is-on' : ''}`}
                    onClick={() => toggleEpisodeNew(index)}
                    aria-pressed={!!ep.isNew}
                    title="បង្ហាញស្លាក NEW លើ Episode នេះ"
                  >
                    NEW
                  </button>
                  <button
                    type="button"
                    className={`episode-end-toggle-btn ${ep.isEnd ? 'is-on' : ''}`}
                    onClick={() => toggleEpisodeEnd(index)}
                    aria-pressed={!!ep.isEnd}
                    title="បង្ហាញស្លាក END លើ Episode នេះ (ភាគបញ្ចប់)"
                  >
                    END
                  </button>
                  <button
                    type="button"
                    className={`episode-cc-toggle-btn ${ep.isCc ? 'is-on' : ''}`}
                    onClick={() => toggleEpisodeCc(index)}
                    aria-pressed={!!ep.isCc}
                    title="បង្ហាញស្លាក CC/SUB លើ Episode នេះ"
                  >
                    CC
                  </button>
                  <input
                    type="text"
                    className="episode-cc-text-input"
                    value={ep.ccText}
                    onChange={(e) => updateEpisodeCcText(index, e.target.value)}
                    placeholder="SUB"
                    title="ពាក្យផ្ទាល់ខ្លួនជំនួស SUB (ទំនេរបើប្រើពាក្យលំនាំដើម)"
                    maxLength={12}
                  />
                </div>
                <div className="episode-row-inputs">
                  <div className="source-list">
                    {ep.sources.map((source, srcIndex) => (
                      <div className="source-row" key={srcIndex}>
                        <input
                          type="text"
                          className="source-label-input"
                          value={source.label}
                          onChange={(e) =>
                            updateSourceField(index, srcIndex, 'label', e.target.value)
                          }
                          placeholder="Server 1"
                        />
                        <input
                          type="text"
                          className="source-url-input"
                          value={source.url}
                          onChange={(e) =>
                            updateSourceField(index, srcIndex, 'url', e.target.value)
                          }
                          placeholder="URL video (.mp4, m3u8, ...)"
                        />
                        <button
                          type="button"
                          className="remove-subtitle-btn"
                          onClick={() => removeSource(index, srcIndex)}
                          aria-label="លុប Server នេះ"
                          disabled={ep.sources.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-subtitle-btn"
                      onClick={() => addSource(index)}
                    >
                      + បញ្ចូល Server ផ្សេង
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ep.duration}
                    onChange={(e) => updateEpisodeDuration(index, e.target.value)}
                    placeholder="រយៈពេល (នាទី, ឧ. 24) — សម្រាប់ SEO Video Schema"
                  />

                  {/* Subtitle URL boxes only make sense once the admin has
                      turned CC on for this episode — hidden otherwise so
                      the row doesn't show fields for a feature that's
                      currently off. */}
                  {ep.isCc && (
                    <div className="subtitle-list">
                      {ep.subtitles.map((sub, subIndex) => (
                        <div className="subtitle-row" key={subIndex}>
                          <div className="subtitle-row-top">
                            <input
                              type="text"
                              className="subtitle-label-input"
                              value={sub.label}
                              onChange={(e) =>
                                updateSubtitleField(index, subIndex, 'label', e.target.value)
                              }
                              placeholder="ភាសា (ឧ. ខ្មែរ)"
                            />
                            <button
                              type="button"
                              className="remove-subtitle-btn"
                              onClick={() => removeSubtitle(index, subIndex)}
                              aria-label="លុប subtitle នេះ"
                              disabled={ep.subtitles.length === 1}
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            className="subtitle-url-input"
                            value={sub.url}
                            onChange={(e) =>
                              updateSubtitleField(index, subIndex, 'url', e.target.value)
                            }
                            placeholder="URL subtitle (.vtt, .srt) — មិនចាំបាច់"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        className="add-subtitle-btn"
                        onClick={() => addSubtitle(index)}
                      >
                        + បញ្ចូល Subtitle ភាសាផ្សេង
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="remove-episode-btn"
                  onClick={() => removeEpisode(index)}
                  aria-label={`លុប EP ${ep.number}`}
                  disabled={episodes.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="form-submit-btn" disabled={saving}>
            {saving ? 'កំពុងរក្សាទុក...' : isEdit ? 'រក្សាទុកការកែប្រែ' : 'ផុសរឿងភាគ'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminDramaForm
