import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { deleteUser, fetchUsers, setUserBlocked } from '../../utils/adminApi'
import './AdminUsers.css'

function AdminUsers() {
  const { token } = useAdminAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers(token)
      .then(setUsers)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }, [token])

  const toggleBlock = async (user) => {
    try {
      const updated = await setUserBlocked(token, user.id, !user.isBlocked)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `លុបគណនី "${user.name}" (${user.email}) ចេញជាអចិន្ត្រៃយ៍មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      )
    ) {
      return
    }
    try {
      await deleteUser(token, user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-users">
      <h1>អ្នកប្រើប្រាស់</h1>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ឈ្មោះ</th>
              <th>អ៊ីមែល</th>
              <th>បានចុះឈ្មោះ</th>
              <th>ស្ថានភាព</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.createdAt}</td>
                <td>
                  <span className={`user-status ${u.isBlocked ? 'blocked' : 'active'}`}>
                    {u.isBlocked ? 'ត្រូវបានទប់ស្កាត់' : 'ធម្មតា'}
                  </span>
                </td>
                <td className="admin-table-actions">
                  <button className="admin-action-neutral" onClick={() => toggleBlock(u)}>
                    {u.isBlocked ? 'ដកការទប់ស្កាត់' : 'ទប់ស្កាត់'}
                  </button>
                  <button onClick={() => handleDelete(u)}>លុប</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  មិនទាន់មាន user ណាម្នាក់ចុះឈ្មោះទេ។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminUsers
