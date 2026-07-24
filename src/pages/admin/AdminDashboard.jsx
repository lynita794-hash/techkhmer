import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  bulkChangeCategory,
  bulkDeleteDramas,
  deleteDrama,
  fetchCategories,
  fetchDramas,
  fetchStats,
  reorderDramas,
} from '../../utils/adminApi'
import Pagination from '../../components/Pagination'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminDashboard.css'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function AdminDashboard() {
  const { token } = useAdminAuth()
  const [dramas, setDramas] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkCategory, setBulkCategory] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragSavedOrder = useRef(null)
  // "Number of items per page" — 'all' shows every drama on one page
  // (matches the old behavior before pagination was added).
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')

  const loadDramas = () => {
    setLoading(true)
    fetchDramas()
      .then(setDramas)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  // Filters by title only (case-insensitive) — matches the same search
  // behavior used on the public homepage. Drag-and-drop reordering is
  // disabled while a search is active (see draggable below): dragging a
  // filtered subset can't meaningfully reorder the full drama list, since
  // sort_order applies across every drama, not just the visible matches.
  const searchQuery = search.trim().toLowerCase()
  const filteredDramas = searchQuery
    ? dramas.filter((d) => d.title.toLowerCase().includes(searchQuery))
    : dramas

  const handleSearchChange = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const totalPages =
    itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(filteredDramas.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const pageOffset = itemsPerPage === 'all' ? 0 : (safePage - 1) * itemsPerPage
  const pagedDramas =
    itemsPerPage === 'all'
      ? filteredDramas
      : filteredDramas.slice(pageOffset, pageOffset + itemsPerPage)

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value === 'all' ? 'all' : Number(value))
    setCurrentPage(1)
  }

  useEffect(() => {
    loadDramas()
    fetchCategories().then(setCategories)
    fetchStats(token)
      .then(setStats)
      .catch(() => {})
  }, [token])

  const handleDelete = async (drama) => {
    if (!window.confirm(`លុប "${drama.title}" ចេញមែនទេ?`)) return
    try {
      await deleteDrama(token, drama.id)
      setDramas((prev) => prev.filter((d) => d.id !== drama.id))
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  // Selects/deselects only the dramas visible on the current page, to
  // match what the header checkbox visually represents.
  const toggleSelectAll = () => {
    const pageIds = pagedDramas.map((d) => d.id)
    const allPageSelected = pageIds.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) =>
      allPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`លុប ${selectedIds.length} រឿងភាគចេញមែនទេ?`)) return
    try {
      await bulkDeleteDramas(token, selectedIds)
      setDramas((prev) => prev.filter((d) => !selectedIds.includes(d.id)))
      setSelectedIds([])
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBulkCategory = async () => {
    if (selectedIds.length === 0 || !bulkCategory) return
    try {
      await bulkChangeCategory(token, selectedIds, bulkCategory)
      setDramas((prev) =>
        prev.map((d) => (selectedIds.includes(d.id) ? { ...d, category: bulkCategory } : d)),
      )
      setSelectedIds([])
      setBulkCategory('')
    } catch (err) {
      alert(err.message)
    }
  }

  // --- Drag-and-drop reordering (mouse-based) ---
  // `index` here is always the absolute index within the full `dramas`
  // array (pageOffset + the row's position on the current page), so
  // dragging still works correctly when items-per-page is less than the
  // total drama count.
  const handleDragStart = (index) => {
    dragSavedOrder.current = dramas
    setDragIndex(index)
  }

  const handleDragEnter = (index) => {
    if (dragIndex === null || index === dragIndex) return
    setDragOverIndex(index)

    setDramas((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = async () => {
    const startOrder = dragSavedOrder.current
    setDragIndex(null)
    setDragOverIndex(null)
    dragSavedOrder.current = null

    if (!startOrder) return
    const changed = startOrder.some((d, i) => d.id !== dramas[i]?.id)
    if (!changed) return

    try {
      await reorderDramas(token, dramas.map((d) => d.id))
    } catch (err) {
      alert(err.message)
      setDramas(startOrder)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>រឿងភាគទាំងអស់</h1>
        <Link to={`/${ADMIN_BASE_PATH}/dramas/new`} className="admin-new-btn">
          + ផុសរឿងថ្មី
        </Link>
      </div>

      <div className="dashboard-toolbar-row">
        <div className="dashboard-search">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 9.5 9.5 4.5 4.5 0 0 1 9.5 14z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ស្វែងរកតាមចំណងជើងរឿងភាគ..."
            aria-label="Search dramas"
          />
        </div>

        <div className="items-per-page-row">
          <label>
            <span>បង្ហាញ</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="all">ទាំងអស់</option>
            </select>
            <span>ក្នុងមួយទំព័រ</span>
          </label>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.totalDramas}</span>
            <span className="stat-label">រឿងភាគ</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalEpisodes}</span>
            <span className="stat-label">Episodes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">អ្នកប្រើប្រាស់</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.blockedUsers}</span>
            <span className="stat-label">ត្រូវបានទប់ស្កាត់</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalComments}</span>
            <span className="stat-label">មតិយោបល់</span>
          </div>
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && !error && (
        <>
          {selectedIds.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedIds.length} បានជ្រើស</span>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
              >
                <option value="">ប្តូរទៅជា Category...</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button onClick={handleBulkCategory} disabled={!bulkCategory}>
                ប្តូរ Category
              </button>
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
                    checked={
                      pagedDramas.length > 0 &&
                      pagedDramas.every((d) => selectedIds.includes(d.id))
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th></th>
                <th>ចំណងជើង</th>
                <th>ប្រភេទ</th>
                <th>Episodes</th>
                <th>ស្ថានភាព</th>
                <th>View</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedDramas.map((drama, pageIndex) => {
                const index = pageOffset + pageIndex
                // Drag-and-drop reordering only makes sense against the
                // full unfiltered list — disabled while a search is
                // active, since `index` here would no longer line up
                // with the drama's real position in the full `dramas`
                // array.
                return (
                  <tr
                    key={drama.id}
                    draggable={!searchQuery}
                    onDragStart={() => !searchQuery && handleDragStart(index)}
                    onDragEnter={() => !searchQuery && handleDragEnter(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={handleDragEnd}
                    className={`draggable-row ${dragOverIndex === index ? 'drag-over' : ''} ${
                      dragIndex === index ? 'dragging' : ''
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(drama.id)}
                        onChange={() => toggleSelect(drama.id)}
                      />
                    </td>
                    <td className="reorder-cell">
                      <span className="drag-handle" title="អូសដើម្បីតម្រៀប">
                        ⠿
                      </span>
                    </td>
                    <td className="admin-table-title">
                      <img src={drama.poster} alt="" className="admin-table-poster" />
                      <span>{drama.title}</span>
                    </td>
                    <td>{drama.category}</td>
                    <td>{drama.ep}</td>
                    <td>{drama.status}</td>
                    <td className="admin-table-views">
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
                        />
                      </svg>
                      {(drama.views || 0).toLocaleString()}
                    </td>
                    <td className="admin-table-actions">
                      <Link to={`/${ADMIN_BASE_PATH}/dramas/${drama.id}/edit`}>កែប្រែ</Link>
                      <button onClick={() => handleDelete(drama)}>លុប</button>
                    </td>
                  </tr>
                )
              })}
              {filteredDramas.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    {searchQuery
                      ? 'រកមិនឃើញរឿងភាគដែលត្រូវនឹងការស្វែងរកនេះទេ។'
                      : 'មិនទាន់មានរឿងភាគនៅឡើយទេ។'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default AdminDashboard
