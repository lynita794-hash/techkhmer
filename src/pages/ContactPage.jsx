import StaticPage from './StaticPage'
import { useLanguage } from '../context/LanguageContext'

function ContactPage() {
  const { t } = useLanguage()
  return (
    <StaticPage title={t('static.contactTitle')}>
      <p>{t('static.contactIntro')}</p>
      <p>{t('static.contactEmail')}</p>
      <p>{t('static.contactTelegram')}</p>
      <p>{t('static.contactFacebook')}</p>
    </StaticPage>
  )
}

export default ContactPage
