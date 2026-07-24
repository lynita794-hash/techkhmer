import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createAd,
  createPrerollAd,
  deleteAd,
  deletePrerollAd,
  fetchAdminSettings,
  fetchAdsAdmin,
  fetchPrerollAds,
  reorderAds,
  reorderPrerollAds,
  updateAd,
  updatePrerollAd,
  updateSettings,
} from '../../utils/adminApi'
import { AD_PLACEMENTS, FLOATING_AD_PLACEMENTS } from '../../config/adPlacements'
import './AdminAds.css'

function emptyFormFor(placementKey) {
  return { name: '', placement: placementKey, code: '', enabled: true }
}

const emptyPrerollForm = { videoUrl: '', clickUrl: '', skipSeconds: 5, enabled: true }

function AdminAds() {
  const { token } = useAdminAuth()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyFormFor(AD_PLACEMENTS[0].key))
  const [editingId, setEditingId] = useState(null)
  // Which placement's inline "add/edit HTML/JS code" form is currently
  // open — the form now lives directly under each section's group
  // instead of one shared form (with a placement dropdown) at the
  // bottom, so writing an ad's code always happens in the context of the
  // section it belongs to.
  const [openPlacement, setOpenPlacement] = useState(null)

  // --- Preroll Video Ads (pool of videos played before the real
  // episode/movie starts on the Watch page — one is picked at random per
  // session, so more than one creative can rotate). Separate from the
  // per-placement HTML/JS ad units above since each entry is a single
  // video with its own skip/click-through settings, not raw markup.
  const [prerollEnabled, setPrerollEnabled] = useState(false)
  const [savingPrerollEnabled, setSavingPrerollEnabled] = useState(false)
  const [prerollAds, setPrerollAds] = useState([])
  const [prerollForm, setPrerollForm] = useState(emptyPrerollForm)
  const [editingPrerollId, setEditingPrerollId] = useState(null)
  const [prerollFormOpen, setPrerollFormOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAdsAdmin(token)
      .then(setAds)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
    fetchAdminSettings(token)
      .then((data) => setPrerollEnabled(data.prerollEnabled ?? false))
      .catch(() => {})
    fetchPrerollAds(token)
      .then(setPrerollAds)
      .catch(() => {})
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTogglePrerollEnabled = async (next) => {
    setSavingPrerollEnabled(true)
    setError('')
    try {
      await updateSettings(token, { prerollEnabled: next })
      setPrerollEnabled(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPrerollEnabled(false)
    }
  }

  const resetPrerollForm = () => {
    setPrerollForm(emptyPrerollForm)
    setEditingPrerollId(null)
    setPrerollFormOpen(false)
  }

  const handlePrerollSubmit = async (e) => {
    e.preventDefault()
    if (!prerollForm.videoUrl.trim()) return
    setError('')
    try {
      if (editingPrerollId) {
        const updated = await updatePrerollAd(token, editingPrerollId, prerollForm)
        setPrerollAds((prev) => prev.map((a) => (a.id === editingPrerollId ? updated : a)))
      } else {
        const created = await createPrerollAd(token, prerollForm)
        setPrerollAds((prev) => [...prev, created])
      }
      resetPrerollForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditPreroll = (ad) => {
    setEditingPrerollId(ad.id)
    setPrerollForm({
      videoUrl: ad.videoUrl,
      clickUrl: ad.clickUrl,
      skipSeconds: ad.skipSeconds,
      enabled: ad.enabled,
    })
    setPrerollFormOpen(true)
  }

  const handleDeletePreroll = async (ad) => {
    if (!window.confirm('លុប Preroll Ad នេះចេញមែនទេ?')) return
    setError('')
    try {
      await deletePrerollAd(token, ad.id)
      setPrerollAds((prev) => prev.filter((a) => a.id !== ad.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const togglePrerollAdEnabled = async (ad) => {
    setError('')
    try {
      const updated = await updatePrerollAd(token, ad.id, { enabled: !ad.enabled })
      setPrerollAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)))
    } catch (err) {
      setError(err.message)
    }
  }

  const movePrerollAd = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= prerollAds.length) return

    const reordered = [...prerollAds]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)
    setPrerollAds(reordered)

    try {
      await reorderPrerollAds(token, reordered.map((a) => a.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setForm(emptyFormFor(AD_PLACEMENTS[0].key))
    setEditingId(null)
    setOpenPlacement(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return
    setError('')
    try {
      if (editingId) {
        const updated = await updateAd(token, editingId, form)
        setAds((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const created = await createAd(token, form)
        setAds((prev) => [...prev, created])
      }
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (ad) => {
    setEditingId(ad.id)
    setForm({ name: ad.name, placement: ad.placement, code: ad.code, enabled: ad.enabled })
    setOpenPlacement(ad.placement)
  }

  const startAddFor = (placementKey) => {
    setEditingId(null)
    setForm(emptyFormFor(placementKey))
    setOpenPlacement(placementKey)
  }

  const handleDelete = async (ad) => {
    if (!window.confirm(`លុប Ad "${ad.name}" ចេញមែនទេ?`)) return
    setError('')
    try {
      await deleteAd(token, ad.id)
      setAds((prev) => prev.filter((a) => a.id !== ad.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleEnabled = async (ad) => {
    setError('')
    try {
      const updated = await updateAd(token, ad.id, { enabled: !ad.enabled })
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)))
    } catch (err) {
      setError(err.message)
    }
  }

  const moveItem = async (list, index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= list.length) return

    const reordered = [...list]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    setAds((prev) => {
      const others = prev.filter((a) => a.placement !== list[0]?.placement)
      return [...others, ...reordered]
    })

    try {
      await reorderAds(token, reordered.map((a) => a.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const grouped = AD_PLACEMENTS.map((p) => ({
    placement: p,
    ads: ads.filter((a) => a.placement === p.key).sort((a, b) => a.sortOrder - b.sortOrder),
  }))

  // "Float" placements use the exact same HTML/JS ad units + CRUD as the
  // fixed placements above — the only difference is where <FloatingAds />
  // renders them (fixed-position overlays with a close button, mounted
  // globally, instead of inline in the page flow). Grouped separately
  // here just so admins can visually tell the two categories apart.
  const groupedFloating = FLOATING_AD_PLACEMENTS.map((p) => ({
    placement: p,
    ads: ads.filter((a) => a.placement === p.key).sort((a, b) => a.sortOrder - b.sortOrder),
  }))

  return (
    <div className="admin-ads">
      <h1>Ads Manager</h1>
      <p className="settings-hint">
        គ្រប់គ្រង Ads (Banner, Google AdSense script, ។ល។) សម្រាប់ទីតាំងផ្សេងៗនៅលើ Site។ ចុច
        "+ បន្ថែម HTML/JS Code" នៅក្រោមផ្នែកនីមួយៗ ដើម្បីដាក់ code ដោយឡែកសម្រាប់ទីតាំងនោះ។
        អាចបិទ/បើក ឬតម្រៀបលំដាប់ Ads ក្នុងទីតាំងតែមួយបានច្រើនផ្ទាំង។
      </p>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && (
        <>
          <div className="ad-group">
            <div className="ad-group-header">
              <h2>វីដេអូ​ពាណិជ្ជកម្ម​មុន​ចាក់ (Preroll Video Ad)</h2>
              <div className="ad-status-btn-group">
                <button
                  type="button"
                  className={`ad-status-btn ${prerollEnabled ? 'is-on' : ''}`}
                  disabled={savingPrerollEnabled}
                  onClick={() => handleTogglePrerollEnabled(true)}
                >
                  ON
                </button>
                <button
                  type="button"
                  className={`ad-status-btn ${!prerollEnabled ? 'is-off' : ''}`}
                  disabled={savingPrerollEnabled}
                  onClick={() => handleTogglePrerollEnabled(false)}
                >
                  OFF
                </button>
              </div>
            </div>
            <p className="settings-hint">
              បញ្ចាំង Video Ad ជាមុនសិន មុនពេលវីដេអូរឿង/ភាពយន្តពិតដំណើរការនៅទំព័រមើលរឿង។
              អាចបន្ថែម Video ច្រើនជាង ១ — ប្រព័ន្ធនឹងជ្រើសយកមួយដោយចៃដន្យ (Random) ជារៀងរាល់ Session។
              បង្ហាញតែម្តងក្នុងមួយ Session (មិនចាំបាច់មើលឡើងវិញពេលប្តូរ Episode ក្នុងរឿងភាគតែមួយ)។
            </p>

            {prerollAds.length === 0 ? (
              <p className="admin-empty">មិនទាន់មាន Preroll Ad ណាមួយទេ។ បន្ថែមខាងក្រោម។</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Video URL</th>
                    <th>Skip (វិនាទី)</th>
                    <th>ស្ថានភាព</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prerollAds.map((ad, index) => (
                    <tr key={ad.id}>
                      <td className="preroll-url-cell">{ad.videoUrl}</td>
                      <td>{ad.skipSeconds === 0 ? 'មិនអាច Skip' : `${ad.skipSeconds}s`}</td>
                      <td>
                        <button
                          type="button"
                          className={`ad-status-btn ${ad.enabled ? 'is-on' : 'is-off'}`}
                          onClick={() => togglePrerollAdEnabled(ad)}
                        >
                          {ad.enabled ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="admin-table-actions">
                        <button
                          onClick={() => movePrerollAd(index, -1)}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePrerollAd(index, 1)}
                          disabled={index === prerollAds.length - 1}
                        >
                          ↓
                        </button>
                        <button onClick={() => startEditPreroll(ad)}>កែប្រែ</button>
                        <button onClick={() => handleDeletePreroll(ad)}>លុប</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!prerollFormOpen ? (
              <button
                type="button"
                className="ad-add-btn preroll-add-btn"
                onClick={() => setPrerollFormOpen(true)}
              >
                + បន្ថែម Preroll Ad ថ្មី
              </button>
            ) : (
              <form className="ad-form" onSubmit={handlePrerollSubmit}>
                <h2>{editingPrerollId ? 'កែប្រែ Preroll Ad' : '+ បន្ថែម Preroll Ad ថ្មី'}</h2>

                <div className="ad-form-grid">
                  <label className="ad-form-field ad-form-field-full">
                    <span>Video URL (.mp4) *</span>
                    <input
                      type="text"
                      value={prerollForm.videoUrl}
                      onChange={(e) =>
                        setPrerollForm((p) => ({ ...p, videoUrl: e.target.value }))
                      }
                      placeholder="https://example.com/ad.mp4"
                      required
                    />
                  </label>

                  <label className="ad-form-field">
                    <span>ចាំប៉ុន្មានវិនាទីមុនអាច Skip (0 = មិនអាច Skip)</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={prerollForm.skipSeconds}
                      onChange={(e) =>
                        setPrerollForm((p) => ({
                          ...p,
                          skipSeconds: Number(e.target.value),
                        }))
                      }
                    />
                  </label>

                  <label className="ad-form-field">
                    <span>Click-through URL (មិនចាំបាច់)</span>
                    <input
                      type="text"
                      value={prerollForm.clickUrl}
                      onChange={(e) =>
                        setPrerollForm((p) => ({ ...p, clickUrl: e.target.value }))
                      }
                      placeholder="https://example.com"
                    />
                  </label>

                  <label className="ad-form-checkbox">
                    <input
                      type="checkbox"
                      checked={prerollForm.enabled}
                      onChange={(e) =>
                        setPrerollForm((p) => ({ ...p, enabled: e.target.checked }))
                      }
                    />
                    <span>បើកបញ្ចាំង (Enabled)</span>
                  </label>
                </div>

                <div className="ad-form-actions">
                  <button type="submit" className="ad-submit-btn">
                    {editingPrerollId ? 'រក្សាទុកការកែប្រែ' : '+ បន្ថែម Preroll Ad'}
                  </button>
                  <button type="button" className="ad-cancel-btn" onClick={resetPrerollForm}>
                    បោះបង់
                  </button>
                </div>
              </form>
            )}
          </div>

          {grouped.map(({ placement, ads: list }) =>
            renderPlacementGroup(placement, list),
          )}

          <h2 className="ad-floating-section-title">Float Ads (ត្រូវលើទំព័រ)</h2>
          <p className="settings-hint">
            Ads ទាំងនេះនឹងបង្ហាញលើកម្រិត Fixed លើទំព័រទាំងអស់ (មិនមែនតែទំព័រណាមួយទេ) ជាមួយប៊ូតុង
            បិទ (✕) ដែលអ្នកមើលអាចចុចលាក់វាបានផ្ទាល់។ មិនបង្ហាញនៅ Admin Panel ទេ។
          </p>
          {groupedFloating.map(({ placement, ads: list }) =>
            renderPlacementGroup(placement, list),
          )}
        </>
      )}
    </div>
  )

  // Renders one placement's ad list + inline add/edit form — shared by
  // both the fixed in-page placements and the Float placements above,
  // since the CRUD behavior (name/code/enabled, reorder) is identical;
  // only where <AdSlot>/<FloatingAds> actually render the result differs.
  function renderPlacementGroup(placement, list) {
    const formOpenHere = openPlacement === placement.key
    return (
      <div className="ad-group" key={placement.key}>
        <div className="ad-group-header">
          <h2>{placement.label}</h2>
          {!formOpenHere && (
            <button
              type="button"
              className="ad-add-btn"
              onClick={() => startAddFor(placement.key)}
            >
              + បន្ថែម HTML/JS Code
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <p className="admin-empty">មិនទាន់មាន Ad ក្នុងទីតាំងនេះទេ។</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ឈ្មោះ</th>
                <th>ស្ថានភាព</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((ad, index) => (
                <tr key={ad.id}>
                  <td>{ad.name}</td>
                  <td>
                    <button
                      type="button"
                      className={`ad-status-btn ${ad.enabled ? 'is-on' : 'is-off'}`}
                      onClick={() => toggleEnabled(ad)}
                    >
                      {ad.enabled ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="admin-table-actions">
                    <button onClick={() => moveItem(list, index, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(list, index, 1)}
                      disabled={index === list.length - 1}
                    >
                      ↓
                    </button>
                    <button onClick={() => startEdit(ad)}>កែប្រែ</button>
                    <button onClick={() => handleDelete(ad)}>លុប</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {formOpenHere && (
          <form className="ad-form" onSubmit={handleSubmit}>
            <h2>{editingId ? 'កែប្រែ Ad' : `បន្ថែម Ad ថ្មី — ${placement.label}`}</h2>

            <div className="ad-form-grid">
              <label className="ad-form-field ad-form-field-full">
                <span>ឈ្មោះ (សម្រាប់សម្គាល់ក្នុង Admin) *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ឧ. AdSense Banner"
                  required
                />
              </label>

              <label className="ad-form-field ad-form-field-full">
                <span>HTML/JS Code *</span>
                <textarea
                  rows={6}
                  className="ad-code-textarea"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder={'<!-- ឧ. Google AdSense snippet, banner <img>/<a>, ។ល។ -->'}
                  spellCheck={false}
                  required
                />
              </label>

              <label className="ad-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                />
                <span>បើកបញ្ចាំង (Enabled)</span>
              </label>
            </div>

            <div className="ad-form-actions">
              <button type="submit" className="ad-submit-btn">
                {editingId ? 'រក្សាទុកការកែប្រែ' : '+ បន្ថែម Ad'}
              </button>
              <button type="button" className="ad-cancel-btn" onClick={resetForm}>
                បោះបង់
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default AdminAds
