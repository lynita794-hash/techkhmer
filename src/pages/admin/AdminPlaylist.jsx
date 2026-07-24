import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { fetchAdminSettings, updateSettings } from '../../utils/adminApi'
import './AdminSettings.css'

// Playlist-only settings, split out of the general Settings page (see
// AdminLayout.jsx sidebar "Playlist" link) so admins land straight on
// these two controls instead of scrolling through the whole Appearance
// tab. Reuses AdminSettings.css since all the classes here (.settings-*,
// .site-width-row, .footer-toggle-*) are shared/page-agnostic already.
function AdminPlaylist() {
  const { token } = useAdminAuth()
  const [settings, setSettings] = useState({
    episodeColumns: 5,
    episodeColumnsMobile: 6,
    episodeButtonScale: 1,
    autoPlayVideo: false,
    themeNewBadgeColor: '#22c55e',
    themeEndBadgeColor: '#6c7280',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchAdminSettings(token)
      .then((data) =>
        setSettings({
          episodeColumns: data.episodeColumns || 5,
          episodeColumnsMobile: data.episodeColumnsMobile || 6,
          episodeButtonScale: data.episodeButtonScale || 1,
          autoPlayVideo: data.autoPlayVideo ?? false,
          themeNewBadgeColor: data.themeNewBadgeColor || '#22c55e',
          themeEndBadgeColor: data.themeEndBadgeColor || '#6c7280',
        }),
      )
      .finally(() => setLoading(false))
  }, [token])

  // Sends only these three fields — the PUT /api/settings endpoint merges
  // with existing values for anything not present in the body (see
  // server/routes/settings.js: `b.field ?? existing.field`), so partial
  // updates from this page never clobber settings owned by the main
  // Settings page.
  const persist = async (next) => {
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await updateSettings(token, next)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await persist(settings)
  }

  const handleReset = async () => {
    const defaults = { episodeColumns: 5, episodeColumnsMobile: 6, episodeButtonScale: 1 }
    const merged = { ...settings, ...defaults }
    setSettings(merged)
    await persist(merged)
  }

  const handleResetBadgeColors = async () => {
    const defaults = { themeNewBadgeColor: '#22c55e', themeEndBadgeColor: '#6c7280' }
    const merged = { ...settings, ...defaults }
    setSettings(merged)
    await persist(merged)
  }



  if (loading) {
    return <p className="admin-loading">កំពុងផ្ទុក...</p>
  }

  return (
    <div className="admin-settings">
      <h1>Playlist</h1>

      <section className="settings-section">
        <h2>ចំនួន Column Episode (Episode Playlist)</h2>
        <p className="settings-hint">
          កំណត់ចំនួនប៊ូតុង Episode ក្នុងមួយជួរ នៅទំព័រមើលរឿង — កំណត់ដាច់ដោយឡែក សម្រាប់
          Desktop (sidebar ចង្អៀត) និង Mobile/Tablet (block ទទឹងពេញ ក្រោមវីដេអូ)។
        </p>
        <form onSubmit={handleSubmit}>
          {error && <p className="admin-error">{error}</p>}
          {saved && !saving && <p className="admin-success">បានរក្សាទុករួច។</p>}

          <label className="settings-field">
            <span>Desktop: {settings.episodeColumns}</span>
            <div className="site-width-row">
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={settings.episodeColumns}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeColumns: Number(e.target.value) }))
                }
                className="site-width-slider"
              />
              <input
                type="number"
                min={3}
                max={10}
                step={1}
                value={settings.episodeColumns}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeColumns: Number(e.target.value) }))
                }
                className="site-width-number"
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Mobile/Tablet: {settings.episodeColumnsMobile}</span>
            <div className="site-width-row">
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={settings.episodeColumnsMobile}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeColumnsMobile: Number(e.target.value) }))
                }
                className="site-width-slider"
              />
              <input
                type="number"
                min={3}
                max={10}
                step={1}
                value={settings.episodeColumnsMobile}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeColumnsMobile: Number(e.target.value) }))
                }
                className="site-width-number"
              />
            </div>
          </label>

          <label className="settings-field">
            <span>ទំហំប៊ូតុង Episode (លេខ/ស្លាក): {settings.episodeButtonScale.toFixed(2)}x</span>
            <div className="site-width-row">
              <input
                type="range"
                min={0.7}
                max={1.5}
                step={0.05}
                value={settings.episodeButtonScale}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeButtonScale: Number(e.target.value) }))
                }
                className="site-width-slider"
              />
              <input
                type="number"
                min={0.7}
                max={1.5}
                step={0.05}
                value={settings.episodeButtonScale}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, episodeButtonScale: Number(e.target.value) }))
                }
                className="site-width-number"
              />
            </div>
          </label>

          <div className="settings-form-actions">
            <button type="submit" className="settings-submit-btn" disabled={saving}>
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
            </button>
            <button
              type="button"
              className="settings-reset-btn"
              onClick={handleReset}
              disabled={saving}
            >
              Reset ទៅ 5 / 6 Column, 1x ទំហំ
            </button>
          </div>
        </form>
      </section>

      <section className="settings-section">
        <h2>ចាក់វីដេអូដោយស្វ័យប្រវត្តិ (Auto Play Video)</h2>
        <p className="settings-hint">
          ពេលបើក វីដេអូនៅទំព័រមើលរឿងនឹងចាក់ដោយស្វ័យប្រវត្តិ ពេលបើកទំព័រ ឬប្តូរ Episode ដោយមិន
          ចាំបាច់ចុចប៊ូតុង Play ដោយដៃ។ Browser ភាគច្រើនហាមឃាត់ការចាក់ដោយស្វ័យប្រវត្តិដែលមាន
          សំឡេង ដូច្នេះបើ Browser មិនអនុញ្ញាត វីដេអូនឹងចាក់ដោយស្ងាត់ (Muted) ជាមុនសិន ព្រមទាំង
          បង្ហាញសារ "ចុចដើម្បីស្តាប់សំឡេង" ឲ្យអ្នកមើលចុចដើម្បីបើកសំឡេងឡើងវិញ។
        </p>
        <form onSubmit={handleSubmit}>
          {error && <p className="admin-error">{error}</p>}
          {saved && !saving && <p className="admin-success">បានរក្សាទុករួច។</p>}

          <div className="footer-toggle-list">
            <div className="footer-toggle-row">
              <span>ចាក់វីដេអូដោយស្វ័យប្រវត្តិ</span>
              <div className="subtitle-status-toggle footer-toggle-buttons">
                <button
                  type="button"
                  className={`status-toggle-btn ${settings.autoPlayVideo ? 'is-on' : ''}`}
                  onClick={() => setSettings((p) => ({ ...p, autoPlayVideo: true }))}
                >
                  ON
                </button>
                <button
                  type="button"
                  className={`status-toggle-btn ${!settings.autoPlayVideo ? 'is-off' : ''}`}
                  onClick={() => setSettings((p) => ({ ...p, autoPlayVideo: false }))}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="settings-submit-btn" disabled={saving}>
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>ពណ៌ស្លាក NEW / END</h2>
        <p className="settings-hint">
          កំណត់ពណ៌ស្លាក <strong>NEW</strong> និង <strong>END</strong> ដែលបង្ហាញលើប៊ូតុង
          Episode នៅ Playlist (Watch Page) — ប្តូរបានគ្រប់ពេលដោយមិនចាំបាច់កែ Code។
        </p>
        <form onSubmit={handleSubmit}>
          {error && <p className="admin-error">{error}</p>}
          {saved && !saving && <p className="admin-success">បានរក្សាទុករួច។</p>}

          <div className="color-field-list">
            <label className="color-field">
              <div className="color-field-swatch-row">
                <input
                  type="color"
                  value={settings.themeNewBadgeColor}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, themeNewBadgeColor: e.target.value }))
                  }
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={settings.themeNewBadgeColor}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, themeNewBadgeColor: e.target.value }))
                  }
                />
              </div>
              <span>ពណ៌ស្លាក NEW</span>
            </label>

            <label className="color-field">
              <div className="color-field-swatch-row">
                <input
                  type="color"
                  value={settings.themeEndBadgeColor}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, themeEndBadgeColor: e.target.value }))
                  }
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={settings.themeEndBadgeColor}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, themeEndBadgeColor: e.target.value }))
                  }
                />
              </div>
              <span>ពណ៌ស្លាក END</span>
            </label>
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="settings-submit-btn" disabled={saving}>
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
            </button>
            <button
              type="button"
              className="settings-reset-btn"
              onClick={handleResetBadgeColors}
              disabled={saving}
            >
              Reset ទៅពណ៌ដើម
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminPlaylist
