import StaticPage from './StaticPage'
import { useLanguage } from '../context/LanguageContext'

function DmcaPage() {
  const { t } = useLanguage()
  return (
    <StaticPage title={t('static.dmcaTitle')}>
      {t('static.dmcaBody').map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </StaticPage>
  )
}

export default DmcaPage
