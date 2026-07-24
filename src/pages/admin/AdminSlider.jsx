import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createSlide,
  deleteSlide,
  fetchAdminSettings,
  fetchSlides,
  reorderSlides,
  updateSlide,
  updateSliderEnabled,
  uploadPoster,
} from '../../utils/adminApi'
import './AdminSlider.css'

const emptyForm = { image: '', title: '', link: '' }

// Lets admins manage the homepage hero slider: turn it on/off entirely,
// and add/edit/delete/reorder individual slides (image + optional
// title/link). Mirrors the CRUD + drag-reorder pattern used elsewhere in
// Admin Panel (Menus, Footer Columns, Ads Manager).
function AdminSlider() {
  const { token } = useAdminAuth()
  const [slides, setSlides] = useState([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [togglingEnabled, setTogglingEnabled] = useState(false)

  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([fetchSlides(), fetchAdminSettings(token)])
      .then(([slideRows, settings]) => {
        setSlides(slideRows)
        setEnabled(settings.sliderEnabled ?? true)
      })
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleEnabled = async (next) => {
    setTogglingEnabled(true)
    setError('')
    try {
      await updateSliderEnabled(token, next)
      setEnabled(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingEnabled(false)
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadPoster(token, file)
      setForm((p) => ({ ...p, image: url }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.image.trim()) return
    setError('')
    try {
      if (editingId) {
        const updated = await updateSlide(token, editingId, form)
        setSlides((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
      } else {
        const created = await createSlide(token, form)
        setSlides((prev) => [...prev, created])
      }
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (slide) => {
    setEditingId(slide.id)
    setForm({ image: slide.image, title: slide.title, link: slide.link })
  }

  const handleDelete = async (slide) => {
    if (!window.confirm('លុប Slide នេះចេញមែនទេ?')) return
    setError('')
    try {
      await deleteSlide(token, slide.id)
      setSlides((prev) => prev.filter((s) => s.id !== slide.id))
    } catch (err) {
      setError(err.message)
    }
  }

  // --- Drag-and-drop reordering ---
  const handleDrop = async (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const reordered = [...slides]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    setSlides(reordered)
    setDragIndex(null)
    setDragOverIndex(null)
    try {
      await reorderSlides(token, reordered.map((s) => s.id))
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  return (
    <div className="admin-slider">
      <h1>Slider (Homepage Banner)</h1>
      <p className="settings-hint">
        គ្រប់គ្រង Slider រូបភាពនៅផ្នែកខាងលើទំព័រដើម។ អូស (Drag) ចាប់ត្រង់ handle{' '}
        <strong>⠿</strong> ដើម្បីតម្រៀបលំដាប់ Slide។
      </p>

      <div className="slider-enable-row">
        <span>បិទ/បើក Slider</span>
        <div className="subtitle-status-toggle slider-enable-toggle">
          <button
            type="button"
            className={`status-toggle-btn ${enabled ? 'is-on' : ''}`}
            disabled={togglingEnabled}
            onClick={() => handleToggleEnabled(true)}
          >
            ON
          </button>
          <button
            type="button"
            className={`status-toggle-btn ${!enabled ? 'is-off' : ''}`}
            disabled={togglingEnabled}
            onClick={() => handleToggleEnabled(false)}
          >
            OFF
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && (
        <>
          <div className="slide-list">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-row ${dragOverIndex === index ? 'is-drag-over' : ''}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverIndex(index)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(index)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
              >
                <span className="slide-drag-handle" aria-label="អូសផ្លាស់ប្តូរលំដាប់">
                  ⠿
                </span>
                <img src={slide.image} alt="" className="slide-thumb" />
                <div className="slide-info">
                  <span className="slide-title">{slide.title || '(គ្មានចំណងជើង)'}</span>
                  {slide.link && <span className="slide-link">{slide.link}</span>}
                </div>
                <div className="slide-actions">
                  <button onClick={() => startEdit(slide)}>កែប្រែ</button>
                  <button onClick={() => handleDelete(slide)}>លុប</button>
                </div>
              </div>
            ))}

            {slides.length === 0 && (
              <p className="admin-empty">មិនទាន់មាន Slide ណាមួយទេ។ បន្ថែមខាងក្រោម។</p>
            )}
          </div>

          <form className="slide-form" onSubmit={handleSubmit}>
            <h2>{editingId ? 'កែប្រែ Slide' : '+ បន្ថែម Slide ថ្មី'}</h2>

            <div className="slide-form-grid">
              <label className="slide-form-field slide-form-field-full">
                <span>រូបភាព *</span>
                <div className="slide-image-row">
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    placeholder="ឬ upload រូបភាព →"
                  />
                  <label className="upload-btn">
                    {uploading ? 'កំពុង Upload...' : 'ជ្រើសរូបភាព'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                  </label>
                </div>
                {form.image && (
                  <img src={form.image} alt="Preview" className="slide-image-preview" />
                )}
              </label>

              <label className="slide-form-field">
                <span>ចំណងជើង (មិនចាំបាច់)</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="ឧ. Drama ថ្មីៗ"
                />
              </label>

              <label className="slide-form-field">
                <span>Link (មិនចាំបាច់)</span>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                  placeholder="ឧ. /drama/some-title"
                />
              </label>
            </div>

            <div className="slide-form-actions">
              <button type="submit" className="slide-submit-btn">
                {editingId ? 'រក្សាទុកការកែប្រែ' : '+ បន្ថែម Slide'}
              </button>
              {editingId && (
                <button type="button" className="slide-cancel-btn" onClick={resetForm}>
                  បោះបង់
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default AdminSlider
