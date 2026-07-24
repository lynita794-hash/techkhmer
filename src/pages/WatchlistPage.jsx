import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DramaGrid from '../components/DramaGrid'
import SeoHead from '../components/SeoHead'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { fetchWatchlist } from '../utils/adminApi'
import './WatchlistPage.css'

function WatchlistPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [dramas, setDramas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchWatchlist(token)
      .then(setDramas)
      .finally(() => setLoading(false))
  }, [token])

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <SeoHead title={t('watchlist.seoTitle')} description={t('watchlist.seoDescription')} />
      <Navbar search="" onSearchChange={() => {}} />

      <main className="watchlist-page">
        <h1>{t('watchlist.title')}</h1>

        {loading ? (
          <p className="admin-loading">{t('common.loading')}</p>
        ) : dramas.length === 0 ? (
          <p className="watchlist-empty">{t('watchlist.empty')}</p>
        ) : (
          <DramaGrid dramas={dramas} />
        )}
      </main>

      <Footer />
    </>
  )
}

export default WatchlistPage
