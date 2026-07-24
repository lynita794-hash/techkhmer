import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../utils/adminApi'
import './AdminCategories.css'

function AdminCategories() {
  const { token } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingLabel, setEditingLabel] = useState('')

  const load = () => {
    setLoading(true)
    fetchCategories()
      .then(setCategories)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const created = await createCategory(token, { key: newKey.trim(), label: newLabel.trim() })
      setCategories((prev) => [...prev, created])
      setNewKey('')
      setNewLabel('')
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditingLabel(cat.label)
  }

  const saveEdit = async (id) => {
    try {
      const updated = await updateCategory(token, id, { label: editingLabel })
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, label: updated.label } : c)))
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`លុបប្រភេទ "${cat.label}" ចេញមែនទេ?`)) return
    try {
      await deleteCategory(token, cat.id)
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-categories">
      <h1>គ្រប់គ្រង Category</h1>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>ឈ្មោះបង្ហាញ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.key}</td>
                  <td>
                    {editingId === cat.id ? (
                      <input
                        className="inline-input"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                      />
                    ) : (
                      cat.label
                    )}
                  </td>
                  <td className="admin-table-actions">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => saveEdit(cat.id)}>រក្សាទុក</button>
                        <button onClick={() => setEditingId(null)}>បោះបង់</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(cat)}>កែប្រែ</button>
                        <button onClick={() => handleDelete(cat)}>លុប</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="add-category-form" onSubmit={handleAdd}>
            <h2>បន្ថែម Category ថ្មី</h2>
            <div className="add-category-row">
              <input
                type="text"
                placeholder="key (ឧ. japanese)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="ឈ្មោះបង្ហាញ (ឧ. ជប៉ុន)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
              />
              <button type="submit" className="add-category-btn">
                + បន្ថែម
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default AdminCategories
