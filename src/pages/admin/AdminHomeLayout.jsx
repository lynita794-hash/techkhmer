import { useEffect, useRef, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { fetchAdminSettings, fetchCategories, updateHomeSections } from '../../utils/adminApi'
import {
  DEFAULT_HOME_SECTIONS,
  SECTION_TYPE_OPTIONS,
  generateSectionKey,
} from '../../config/homeSections'
import './AdminHomeLayout.css'

// Lets admins add, delete, reorder, rename, retype, show/hide, and set the
// item count for each homepage row-section without touching code. Each
// section has a `type` (latest/movie/tvshow/category) that drives which
// dramas populate it — for `category` sections, `categoryKey` selects which
// category to pull from.
function AdminHomeLayout() {
  const { token } = useAdminAuth()
  const [sections, setSections] = useState(DEFAULT_HOME_SECTIONS)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragSavedOrder = useRef(null)

  useEffect(() => {
    fetchAdminSettings(token)
      .then((data) => {
        if (Array.isArray(data.homeSections) && data.homeSections.length > 0) {
          setSections(data.homeSections)
        }
      })
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
    fetchCategories().then(setCategories).catch(() => {})
  }, [token])

  const persist = async (next) => {
    setSaved(false)
    setError('')
    setSaving(true)
    try {
      await updateHomeSections(token, next)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (key, patch) => {
    setSections((prev) => {
      const next = prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
      persist(next)
      return next
    })
  }

  const addSection = () => {
    const type = SECTION_TYPE_OPTIONS[0].value
    const newSection = {
      key: generateSectionKey(type),
      type,
      label: SECTION_TYPE_OPTIONS[0].label,
      visible: true,
      limit: 6,
      categoryKey: '',
      sliderMode: true,
      autoPlay: false,
      autoPlaySpeed: 3.5,
    }
    setSections((prev) => {
      const next = [...prev, newSection]
      persist(next)
      return next
    })
  }

  const deleteSection = (key) => {
    const target = sections.find((s) => s.key === key)
    if (!target) return
    if (!window.confirm(`លុបផ្នែក "${target.label}" ចេញពី Homepage មែនទេ?`)) return
    setSections((prev) => {
      const next = prev.filter((s) => s.key !== key)
      persist(next)
      return next
    })
  }

  // --- Drag-and-drop reordering ---
  const handleDragStart = (index) => {
    dragSavedOrder.current = sections
    setDragIndex(index)
  }

  const handleDragEnter = (index) => {
    if (dragIndex === null || index === dragIndex) return
    setDragOverIndex(index)
    setSections((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    const startOrder = dragSavedOrder.current
    setDragIndex(null)
    setDragOverIndex(null)
    dragSavedOrder.current = null

    if (!startOrder) return
    const changed = startOrder.some((s, i) => s.key !== sections[i]?.key)
    if (changed) persist(sections)
  }

  if (loading) {
    return <p className="admin-loading">កំពុងផ្ទុក...</p>
  }

  return (
    <div className="admin-home-layout">
      <div className="ahl-header">
        <h1>ការរៀបចំ Homepage</h1>
        <button type="button" className="ahl-add-btn" onClick={addSection}>
          + ADD ផ្នែកថ្មី
        </button>
      </div>
      <p className="settings-hint">
        អូស (Drag) ចាប់ត្រង់ handle <strong>⠿</strong> ដើម្បីផ្លាស់ប្តូរលំដាប់ផ្នែកនីមួយៗនៅលើ
        ទំព័រដើម។ អាចប្តូរឈ្មោះ, ប្រភេទ, បិទ/បើកបញ្ចាំង, កំណត់ចំនួនរឿងភាគបង្ហាញ, បន្ថែម ឬលុប
        ផ្នែកនីមួយៗបានផងដែរ។ ជ្រើស <strong>Slider</strong> ដើម្បីធ្វើឲ្យផ្នែកនោះក្លាយជា
        Carousel អូសទៅឆ្វេង/ស្តាំ (ជំនួសឲ្យ Grid ធម្មតា)។ បើក <strong>Auto ON</strong> ដើម្បីឲ្យ
        Slider រំកិលទៅមុខដោយស្វ័យប្រវត្តិ (ឈប់ពេលអ្នកទស្សនាដាក់កណ្តុរលើ)។ កំណត់
        <strong> "ល្បឿន (វិនាទី)"</strong> ដើម្បីជ្រើសល្បឿននៃការរំកិលដោយស្វ័យប្រវត្តិ (រហ័ស
        = លេខតូច, យឺត = លេខធំ)។{' '}
        <strong>សំខាន់៖</strong> សម្រាប់ Slider ត្រូវកំណត់ "ចំនួនបង្ហាញ" ឲ្យខ្លាំងជាង ៦
        (ឧ. ១២-២៤) ព្រោះ Slider បង្ហាញ ៦ ក្នុងមួយអេក្រង់ស្រាប់ — បើកំណត់ស្មើ ៦ គ្មានចន្លោះ
        ដើម្បីអូស Slider នឹងមិនរំកិលទេ។
      </p>

      {error && <p className="admin-error">{error}</p>}
      {saving && <p className="admin-hint-saving">កំពុងរក្សាទុក...</p>}
      {saved && !saving && <p className="admin-success">បានរក្សាទុករួច។</p>}

      <div className="ahl-list">
        {sections.map((section, index) => {
          const sectionType = section.type || section.key
          return (
            <div
              key={section.key}
              className={`ahl-row ${dragOverIndex === index ? 'is-drag-over' : ''} ${
                !section.visible ? 'is-hidden' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
            >
              <span className="ahl-drag-handle" aria-label="អូសផ្លាស់ប្តូរលំដាប់">
                ⠿
              </span>

              <div className="ahl-row-fields">
                <div className="ahl-row-fields-top">
                  <input
                    type="text"
                    className="ahl-label-input"
                    value={section.label}
                    onChange={(e) => updateSection(section.key, { label: e.target.value })}
                  />

                  <select
                    className="ahl-type-select"
                    value={sectionType}
                    onChange={(e) => updateSection(section.key, { type: e.target.value })}
                  >
                    {SECTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {sectionType === 'category' && (
                    <select
                      className="ahl-type-select"
                      value={section.categoryKey || ''}
                      onChange={(e) =>
                        updateSection(section.key, { categoryKey: e.target.value })
                      }
                    >
                      <option value="">-- ជ្រើស Category --</option>
                      {categories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <label className="ahl-limit-field">
                    <span>ចំនួនបង្ហាញ</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={section.limit}
                      onChange={(e) =>
                        updateSection(section.key, {
                          limit: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </label>
                </div>

                {section.sliderMode && section.limit <= 6 && (
                  <p className="ahl-limit-warning">
                    ⚠️ ចំនួនបង្ហាញតិចពេក — Slider នឹងមិនរំកិលទេ ព្រោះគ្មានចន្លោះសម្រាប់អូស។
                    សូមដាក់ចំនួនឲ្យខ្លាំងជាង ៦។
                  </p>
                )}
              </div>

              <div className="ahl-toggles">
                <div className="subtitle-status-toggle ahl-visible-toggle">
                  <button
                    type="button"
                    className={`status-toggle-btn ${section.visible ? 'is-on' : ''}`}
                    onClick={() => updateSection(section.key, { visible: true })}
                  >
                    បង្ហាញ
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn ${!section.visible ? 'is-off' : ''}`}
                    onClick={() => updateSection(section.key, { visible: false })}
                  >
                    លាក់
                  </button>
                </div>

                <div className="subtitle-status-toggle ahl-slider-toggle">
                  <button
                    type="button"
                    className={`status-toggle-btn ${section.sliderMode ? 'is-on' : ''}`}
                    onClick={() => updateSection(section.key, { sliderMode: true })}
                  >
                    Slider
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn ${!section.sliderMode ? 'is-off' : ''}`}
                    onClick={() =>
                      updateSection(section.key, { sliderMode: false, autoPlay: false })
                    }
                  >
                    Grid
                  </button>
                </div>

                {section.sliderMode && (
                  <div className="subtitle-status-toggle ahl-slider-toggle">
                    <button
                      type="button"
                      className={`status-toggle-btn ${section.autoPlay ? 'is-on' : ''}`}
                      onClick={() => updateSection(section.key, { autoPlay: true })}
                    >
                      Auto ON
                    </button>
                    <button
                      type="button"
                      className={`status-toggle-btn ${!section.autoPlay ? 'is-off' : ''}`}
                      onClick={() => updateSection(section.key, { autoPlay: false })}
                    >
                      Auto OFF
                    </button>
                  </div>
                )}

                {section.sliderMode && section.autoPlay && (
                  <label className="ahl-speed-field">
                    <span>ល្បឿន (វិនាទី)</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      step="0.5"
                      value={section.autoPlaySpeed ?? 3.5}
                      onChange={(e) =>
                        updateSection(section.key, {
                          autoPlaySpeed: Math.max(1, Number(e.target.value) || 3.5),
                        })
                      }
                    />
                  </label>
                )}
              </div>

              <button
                type="button"
                className="ahl-delete-btn"
                onClick={() => deleteSection(section.key)}
                aria-label="លុបផ្នែកនេះ"
              >
                លុប
              </button>
            </div>
          )
        })}

        {sections.length === 0 && (
          <p className="admin-empty">
            មិនទាន់មានផ្នែកណាមួយទេ។ ចុច "+ ADD ផ្នែកថ្មី" ដើម្បីបង្កើត។
          </p>
        )}
      </div>
    </div>
  )
}

export default AdminHomeLayout
