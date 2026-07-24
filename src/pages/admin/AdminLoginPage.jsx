import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminLoginPage.css'

function AdminLoginPage() {
  const { token, login } = useAdminAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  // Once the server responds with requiresCode=true, we switch to asking
  // for the 6-digit authenticator code instead of username/password again.
  const [needsCode, setNeedsCode] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (token) {
    return <Navigate to={`/${ADMIN_BASE_PATH}`} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await login(username, password, needsCode ? code : undefined)
      if (data.requiresCode) {
        setNeedsCode(true)
        return
      }
      navigate(`/${ADMIN_BASE_PATH}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Panel</h1>
        <p className="admin-login-subtitle">ចូលគណនីអ្នកគ្រប់គ្រង</p>

        {error && <p className="admin-login-error">{error}</p>}

        {!needsCode ? (
          <>
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

            <label className="admin-login-field">
              <span>ពាក្យសម្ងាត់</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
          </>
        ) : (
          <label className="admin-login-field">
            <span>កូដ 2FA (6 ខ្ទង់ ពី Authenticator App)</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              placeholder="123456"
            />
          </label>
        )}

        <button type="submit" className="admin-login-submit" disabled={submitting}>
          {submitting ? 'កំពុងចូល...' : needsCode ? 'បញ្ជាក់កូដ' : 'ចូលគណនី'}
        </button>

        {!needsCode && (
          <p className="admin-login-forgot">
            <Link to={`/${ADMIN_BASE_PATH}/forgot-password`}>ភ្លេចពាក្យសម្ងាត់?</Link>
          </p>
        )}
      </form>
    </div>
  )
}

export default AdminLoginPage
