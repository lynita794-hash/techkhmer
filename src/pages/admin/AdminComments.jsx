import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { bulkDeleteComments, deleteComment, fetchAllComments } from '../../utils/adminApi'
import { buildWatchPath } from '../../utils/slug'
import './AdminComments.css'

// Every comment site-wide in one place, so admins can review/remove spam
// or abusive comments without hunting through each drama's Watch page
// individually. Mirrors the search + bulk-select + bulk-delete pattern
// already used on the Dashboard's drama table.
function AdminComments() {
  const { token } = useAdminAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const load = (searchTerm) => {
    setLoading(true)
    fetchAllComments(token, searchTerm)
      .then(setComments)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Debounce search-as-you-type instead of firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => load(search), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    const allSelected = comments.length > 0 && comments.every((c) => selectedIds.includes(c.id))
    setSelectedIds(allSelected ? [] : comments.map((c) => c.id))
  }

  const handleDelete = async (comment) => {
    if (!window.confirm('លុបមតិយោបល់នេះចេញមែនទេ?')) return
    try {
      await deleteComment(token, comment.id)
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      setSelectedIds((prev) => prev.filter((id) => id !== comment.id))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`លុប ${selectedIds.length} មតិយោបល់ចេញមែនទេ?`)) return
    try {
      await bulkDeleteComments(token, selectedIds)
      setComments((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
      setSelectedIds([])
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-comments">
      <div className="admin-dashboard-header">
        <h1>មតិយោបល់ទាំងអស់</h1>
      </div>

      <input
        type="text"
        className="comments-search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ស្វែងរកតាមមាតិកា, ឈ្មោះអ្នកសរសេរ, ឬចំណងជើងរឿងភាគ..."
      />

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && !error && (
        <>
          {selectedIds.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedIds.length} បានជ្រើស</span>
              <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                លុបទាំងអស់
              </button>
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={comments.length > 0 && comments.every((c) => selectedIds.includes(c.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>រឿងភាគ</th>
                <th>អ្នកសរសេរ</th>
                <th>មតិយោបល់</th>
                <th>កាលបរិច្ឆេទ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="comment-drama-cell">
                    <Link to={buildWatchPath({ id: c.dramaId, title: c.dramaTitle })}>
                      {c.dramaTitle}
                    </Link>
                  </td>
                  <td>{c.userName}</td>
                  <td className="comment-content-cell">{c.content}</td>
                  <td className="comment-date-cell">{c.createdAt}</td>
                  <td className="admin-table-actions">
                    <button onClick={() => handleDelete(c)}>លុប</button>
                  </td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    {search ? 'រកមិនឃើញមតិយោបល់ដែលត្រូវនឹងការស្វែងរកនេះទេ។' : 'មិនទាន់មានមតិយោបល់ណាមួយទេ។'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export default AdminComments
