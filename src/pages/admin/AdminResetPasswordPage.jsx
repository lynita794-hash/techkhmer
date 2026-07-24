import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmAdminPasswordReset } from '../../utils/adminApi'
import { ADMIN_BASE_PATH } from '../../config/adminPath'
import './AdminLoginPage.css'

function AdminResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Link នេះមិនត្រឹមត្រូវ សូមស្នើសុំម្តងទៀត។')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា')
      return
    }

    setSubmitting(true)
    try {
      await confirmAdminPasswordReset(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate(`/${ADMIN_BASE_PATH}/login`, { replace: true }), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>កំណត់ពាក្យសម្ងាត់ថ្មី</h1>

        {!token && (
          <p className="admin-login-error">Link នេះមិនត្រឹមត្រូវ សូមស្នើសុំម្តងទៀត។</p>
        )}
        {error && <p className="admin-login-error">{error}</p>}
        {success && (
          <p className="admin-login-success">ប្តូរពាក្យសម្ងាត់ជោគជ័យ! កំពុងបញ្ជូនទៅចូលគណនី...</p>
        )}

        <label className="admin-login-field">
          <span>ពាក្យសម្ងាត់ថ្មី</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <label className="admin-login-field">
          <span>បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <button type="submit" className="admin-login-submit" disabled={submitting || !token}>
          {submitting ? 'កំពុងរក្សាទុក...' : 'កំណត់ពាក្យសម្ងាត់ថ្មី'}
        </button>

        <p className="admin-login-forgot">
          <Link to={`/${ADMIN_BASE_PATH}/login`}>ត្រឡប់ទៅចូលគណនី</Link>
        </p>
      </form>
    </div>
  )
}

export default AdminResetPasswordPage
