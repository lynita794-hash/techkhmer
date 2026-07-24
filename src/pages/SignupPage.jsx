import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './AuthPage.css'

function SignupPage() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/', { replace: true })
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
          <h1>{t('auth.signupTitle')}</h1>
          <p className="auth-subtitle">{t('auth.signupSubtitle')}</p>

          {error && <p className="auth-error">{error}</p>}

          <label className="auth-field">
            <span>{t('auth.name')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
            />
          </label>

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
              minLength={6}
              autoComplete="new-password"
              placeholder={t('auth.passwordMinPlaceholder')}
            />
          </label>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t('auth.creating') : t('auth.signup')}
          </button>

          <p className="auth-switch">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
          </p>
        </form>
      </main>

      <Footer />
    </>
  )
}

export default SignupPage
