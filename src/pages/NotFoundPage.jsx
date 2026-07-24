import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'
import './NotFoundPage.css'

function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <>
      <Navbar search="" onSearchChange={() => {}} />

      <main className="not-found-page">
        <h1>404</h1>
        <p>{t('notFound.message')}</p>
        <Link to="/" className="not-found-btn">
          {t('notFound.backHome')}
        </Link>
      </main>

      <Footer />
    </>
  )
}

export default NotFoundPage
