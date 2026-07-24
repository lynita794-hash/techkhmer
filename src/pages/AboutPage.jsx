import StaticPage from './StaticPage'
import { useLanguage } from '../context/LanguageContext'

function AboutPage() {
  const { t } = useLanguage()
  return (
    <StaticPage title={t('static.aboutTitle')}>
      {t('static.aboutBody').map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </StaticPage>
  )
}

export default AboutPage
