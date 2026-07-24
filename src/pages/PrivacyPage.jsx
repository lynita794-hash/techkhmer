import StaticPage from './StaticPage'
import { useLanguage } from '../context/LanguageContext'

function PrivacyPage() {
  const { t } = useLanguage()
  return (
    <StaticPage title={t('static.privacyTitle')}>
      {t('static.privacyBody').map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </StaticPage>
  )
}

export default PrivacyPage
