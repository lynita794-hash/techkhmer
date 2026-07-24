import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'
import { requestPasswordReset } from '../utils/adminApi'
import './AuthPage.css'

function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const data = await requestPasswordReset(email)
      setMessage(data.message)
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
          <h1>{t('auth.forgotTitle')}</h1>
          <p className="auth-subtitle">{t('auth.forgotSubtitle')}</p>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <label className="auth-field">
            <span>{t('auth.email')}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t('auth.sending') : t('auth.sendResetLink')}
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

export default ForgotPasswordPage
