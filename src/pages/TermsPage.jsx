import StaticPage from './StaticPage'
import { useLanguage } from '../context/LanguageContext'

function TermsPage() {
  const { t } = useLanguage()
  return (
    <StaticPage title={t('static.termsTitle')}>
      {t('static.termsBody').map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </StaticPage>
  )
}

export default TermsPage
