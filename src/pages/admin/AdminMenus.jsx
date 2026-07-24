import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createMenu,
  deleteMenu,
  fetchMenus,
  reorderMenus,
  updateMenu,
} from '../../utils/adminApi'
import './AdminMenus.css'

const emptyForm = { location: 'navbar', label: '', labelEn: '', url: '', openNewTab: false }

function AdminMenus() {
  const { token } = useAdminAuth()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const load = () => {
    setLoading(true)
    fetchMenus()
      .then(setMenus)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const navbarMenus = menus
    .filter((m) => m.location === 'navbar')
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const footerMenus = menus
    .filter((m) => m.location === 'footer')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        const updated = await updateMenu(token, editingId, form)
        setMenus((prev) => prev.map((m) => (m.id === editingId ? updated : m)))
      } else {
        const created = await createMenu(token, form)
        setMenus((prev) => [...prev, created])
      }
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (menu) => {
    setEditingId(menu.id)
    setForm({
      location: menu.location,
      label: menu.label,
      labelEn: menu.labelEn || '',
      url: menu.url,
      openNewTab: menu.openNewTab,
    })
  }

  const handleDelete = async (menu) => {
    if (!window.confirm(`លុប Menu "${menu.label}" ចេញមែនទេ?`)) return
    try {
      await deleteMenu(token, menu.id)
      setMenus((prev) => prev.filter((m) => m.id !== menu.id))
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

    setMenus((prev) => {
      const otherLocation = prev.filter((m) => m.location !== list[0]?.location)
      return [...otherLocation, ...reordered]
    })

    try {
      await reorderMenus(token, reordered.map((m) => m.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const renderTable = (list, locationLabel) => (
    <div className="menu-group">
      <h2>{locationLabel}</h2>
      {list.length === 0 ? (
        <p className="admin-empty">មិនទាន់មាន menu ក្នុងកន្លែងនេះទេ។</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ចំណងជើង</th>
              <th>URL</th>
              <th>Tab ថ្មី</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((menu, index) => (
              <tr key={menu.id}>
                <td>{menu.label}</td>
                <td className="menu-url">{menu.url}</td>
                <td>{menu.openNewTab ? 'បាទ' : '-'}</td>
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
                  <button onClick={() => startEdit(menu)}>កែប្រែ</button>
                  <button onClick={() => handleDelete(menu)}>លុប</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="admin-menus">
      <h1>គ្រប់គ្រង Menu</h1>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && (
        <>
          {renderTable(navbarMenus, 'Navbar (ខាងលើ)')}
          {renderTable(footerMenus, 'Footer (ខាងក្រោម)')}

          <form className="menu-form" onSubmit={handleSubmit}>
            <h2>{editingId ? 'កែប្រែ Menu' : 'បន្ថែម Menu ថ្មី'}</h2>

            <div className="menu-form-grid">
              <label className="menu-form-field">
                <span>ទីតាំង</span>
                <select
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                >
                  <option value="navbar">Navbar (ខាងលើ)</option>
                  <option value="footer">Footer (ខាងក្រោម)</option>
                </select>
              </label>

              <label className="menu-form-field">
                <span>ចំណងជើង (ខ្មែរ) *</span>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="ឧ. ព័ត៌មាន"
                  required
                />
              </label>

              <label className="menu-form-field">
                <span>ចំណងជើង (English) — ស្រេចចិត្ត</span>
                <input
                  type="text"
                  value={form.labelEn}
                  onChange={(e) => setForm((p) => ({ ...p, labelEn: e.target.value }))}
                  placeholder="e.g. News"
                />
              </label>

              <label className="menu-form-field menu-form-field-full">
                <span>URL *</span>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="ឧ. /about ឬ https://..."
                  required
                />
              </label>

              <label className="menu-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.openNewTab}
                  onChange={(e) => setForm((p) => ({ ...p, openNewTab: e.target.checked }))}
                />
                <span>បើកនៅ Tab ថ្មី</span>
              </label>
            </div>

            <div className="menu-form-actions">
              <button type="submit" className="menu-submit-btn">
                {editingId ? 'រក្សាទុកការកែប្រែ' : '+ បន្ថែម Menu'}
              </button>
              {editingId && (
                <button type="button" className="menu-cancel-btn" onClick={resetForm}>
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

export default AdminMenus
