import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './AuthPage.css'

function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
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
          <h1>{t('auth.loginTitle')}</h1>
          <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

          {error && <p className="auth-error">{error}</p>}

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

          <label className="auth-field">
            <span>{t('auth.password')}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t('auth.loggingIn') : t('auth.login')}
          </button>

          <p className="auth-switch">
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          </p>

          <p className="auth-switch">
            {t('auth.noAccount')} <Link to="/signup">{t('auth.signupLink')}</Link>
          </p>
        </form>
      </main>

      <Footer />
    </>
  )
}

export default LoginPage
