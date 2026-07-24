import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestAdminPasswordReset } from '../../utils/adminApi'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminLoginPage.css'

function AdminForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const data = await requestAdminPasswordReset(username)
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>ភ្លេចពាក្យសម្ងាត់ Admin?</h1>
        <p className="admin-login-subtitle">
          បញ្ចូល Username — Link ស្តារពាក្យសម្ងាត់ នឹងផ្ញើទៅអ៊ីមែល Admin ដែលបានកំណត់
        </p>

        {error && <p className="admin-login-error">{error}</p>}
        {message && <p className="admin-login-success">{message}</p>}

        <label className="admin-login-field">
          <span>ឈ្មោះអ្នកប្រើ</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <button type="submit" className="admin-login-submit" disabled={submitting}>
          {submitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើ Link ស្តារពាក្យសម្ងាត់'}
        </button>

        <p className="admin-login-forgot">
          <Link to={`/${ADMIN_BASE_PATH}/login`}>ត្រឡប់ទៅចូលគណនី</Link>
        </p>
      </form>
    </div>
  )
}

export default AdminForgotPasswordPage
