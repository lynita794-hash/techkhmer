import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'
import { confirmPasswordReset } from '../utils/adminApi'
import './AuthPage.css'

function ResetPasswordPage() {
  const { t } = useLanguage()
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
      setError(t('auth.invalidLink'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordReset(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar search="" onSearchChange={() => {}} />

      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>{t('auth.resetTitle')}</h1>

          {!token && <p className="auth-error">{t('auth.invalidLink')}</p>}
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{t('auth.resetSuccess')}</p>}

          <label className="auth-field">
            <span>{t('auth.newPassword')}</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <label className="auth-field">
            <span>{t('auth.confirmNewPassword')}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting || !token}>
            {submitting ? t('auth.saving') : t('auth.setNewPassword')}
          </button>

          <p className="auth-switch">
            <Link to="/login">{t('auth.backToLogin')}</Link>
          </p>
        </form>
      </main>

      <Footer />
    </>
  )
}

export default ResetPasswordPage
