import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { fetchActivityLog } from '../../utils/adminApi'
import './AdminActivityLog.css'

// Human-readable labels for the action codes recorded by server/activityLog.js
const ACTION_LABELS = {
  delete_drama: 'លុបរឿងភាគ',
  bulk_delete_dramas: 'លុបរឿងភាគច្រើន',
  block_user: 'ទប់ស្កាត់អ្នកប្រើប្រាស់',
  unblock_user: 'ដកការទប់ស្កាត់',
}

function AdminActivityLog() {
  const { token } = useAdminAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivityLog(token)
      .then(setLogs)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="admin-activity-log">
      <h1>កំណត់ត្រាសកម្មភាព Admin</h1>
      <p className="settings-hint">
        កត់ត្រារាល់សកម្មភាពសំខាន់ៗរបស់ Admin (លុបរឿងភាគ, ទប់ស្កាត់អ្នកប្រើប្រាស់, ។ល។)
        ដើម្បីតាមដានប្រសិនបើមាន Admin ច្រើននាក់គ្រប់គ្រង Site ជាមួយគ្នា។
      </p>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-loading">កំពុងផ្ទុក...</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ពេលវេលា</th>
              <th>Admin</th>
              <th>សកម្មភាព</th>
              <th>គោលដៅ</th>
              <th>លម្អិត</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt}</td>
                <td>{log.adminUsername}</td>
                <td>{ACTION_LABELS[log.action] || log.action}</td>
                <td>{log.target || '-'}</td>
                <td>{log.details || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  មិនទាន់មានកំណត់ត្រាសកម្មភាពទេ។
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminActivityLog
