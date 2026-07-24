import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  changeAdminPassword,
  disable2FA,
  enable2FA,
  exportBackup,
  fetch2FAStatus,
  fetchAdminSettings,
  importBackup,
  setup2FA,
  updateSettings,
  uploadPoster,
} from '../../utils/adminApi'
import './AdminSettings.css'

// Groups related settings under tabs instead of one long scrolling page.
const TABS = [
  { key: 'general', label: 'ទូទៅ' },
  { key: 'appearance', label: 'រូបរាង' },
  { key: 'colors', label: 'Custom Color' },
  { key: 'footer', label: 'Footer' },
  { key: 'code', label: 'Code Snippets' },
  { key: 'integrations', label: 'API' },
  { key: 'security', label: 'សុវត្ថិភាព' },
  { key: 'backup', label: 'Backup' },
]

// Full-site color presets — one click sets every theme color field at
// once (Primary, Navbar/Footer/Body backgrounds, Playlist, Headings, Body
// text, Card background, Rating accent), instead of picking all 9
// individually. Admins can still fine-tune any single color afterward
// using the pickers below — presets are just a fast starting point.
const THEME_PRESETS = [
  {
    key: 'netflix',
    label: 'ក្រហម (Netflix)',
    swatch: '#e50914',
    values: {
      themePrimaryColor: '#e50914',
      themeNavbarBg: '#0d0d0d',
      themeFooterBg: '#0a0a0a',
      themeBodyBg: '#0d0d0d',
      themePlaylistColor: '#e50914',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#e5e5e5',
      themeCardBg: '#1a1a1a',
      themeRatingColor: '#f7941d',
    },
  },
  {
    key: 'ocean',
    label: 'ខៀវសមុទ្រ (Ocean)',
    swatch: '#0ea5e9',
    values: {
      themePrimaryColor: '#0ea5e9',
      themeNavbarBg: '#0b1220',
      themeFooterBg: '#0a0f1a',
      themeBodyBg: '#0b1220',
      themePlaylistColor: '#0ea5e9',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#dbeafe',
      themeCardBg: '#132033',
      themeRatingColor: '#38bdf8',
    },
  },
  {
    key: 'purple',
    label: 'ស្វាយ (Purple Night)',
    swatch: '#a855f7',
    values: {
      themePrimaryColor: '#a855f7',
      themeNavbarBg: '#150f24',
      themeFooterBg: '#120c1e',
      themeBodyBg: '#150f24',
      themePlaylistColor: '#a855f7',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#e9d5ff',
      themeCardBg: '#221a35',
      themeRatingColor: '#facc15',
    },
  },
  {
    key: 'forest',
    label: 'បៃតង (Forest)',
    swatch: '#22c55e',
    values: {
      themePrimaryColor: '#22c55e',
      themeNavbarBg: '#0a1410',
      themeFooterBg: '#08110d',
      themeBodyBg: '#0a1410',
      themePlaylistColor: '#22c55e',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#d1fae5',
      themeCardBg: '#12241c',
      themeRatingColor: '#facc15',
    },
  },
  {
    key: 'sunset',
    label: 'ថ្ងៃលិច (Sunset)',
    swatch: '#f97316',
    values: {
      themePrimaryColor: '#f97316',
      themeNavbarBg: '#1a0f0a',
      themeFooterBg: '#150c08',
      themeBodyBg: '#1a0f0a',
      themePlaylistColor: '#f97316',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#fde8d3',
      themeCardBg: '#291a10',
      themeRatingColor: '#fbbf24',
    },
  },
  {
    key: 'mono',
    label: 'ប្រផេះ (Monochrome)',
    swatch: '#9ca3af',
    values: {
      themePrimaryColor: '#6b7280',
      themeNavbarBg: '#141414',
      themeFooterBg: '#111111',
      themeBodyBg: '#141414',
      themePlaylistColor: '#9ca3af',
      themeHeadingColor: '#ffffff',
      themeTextColor: '#d4d4d4',
      themeCardBg: '#1f1f1f',
      themeRatingColor: '#e5e7eb',
    },
  },
]

// Default values for every resettable field, grouped by the section each
// "Reset" button applies to. Kept as one lookup table so each button just
// spreads the relevant slice into `settings` instead of repeating literals
// in multiple places (JSX defaults, this table, and the DB/API defaults
// all need to agree, but this is the one the UI reset buttons read from).
const SECTION_DEFAULTS = {
  siteWidth: { siteWidth: 1280 },
  gridColumns: { gridColumns: 6 },
  googleFonts: {
    googleFontKhmer: '',
    googleFontEnglish: '',
    googleFontMenu: '',
    googleFontTitle: '',
  },
  colors: {
    themePrimaryColor: '#e50914',
    themeNavbarBg: '#0d0d0d',
    themeFooterBg: '#0a0a0a',
    themeBodyBg: '#0d0d0d',
    themePlaylistColor: '#e50914',
    themeHeadingColor: '#ffffff',
    themeTextColor: '#e5e5e5',
    themeCardBg: '#1a1a1a',
    themeRatingColor: '#f7941d',
  },
  footerInfo: { footerDescription: '', footerCopyright: '' },
  socialLinks: { socialFacebook: '', socialTelegram: '', socialYoutube: '' },
  customCss: { customCss: '' },
  headerCode: { headerCode: '' },
  footerCode: { footerCode: '' },
  general: { siteName: '', seoDescription: '' },
  logo: { logoUrl: '' },
}

function AdminSettings() {
  const { token } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('general')

  const [settings, setSettings] = useState({
    siteName: '',
    logoUrl: '',
    seoDescription: '',
    tmdbApiKey: '',
    customCss: '',
    headerCode: '',
    footerCode: '',
    footerDescription: '',
    socialFacebook: '',
    socialTelegram: '',
    socialYoutube: '',
    footerCopyright: '',
    showFooterBrand: true,
    showFooterSocial: true,
    themePrimaryColor: '#e50914',
    themeNavbarBg: '#0d0d0d',
    themeFooterBg: '#0a0a0a',
    themeBodyBg: '#0d0d0d',
    themePlaylistColor: '#e50914',
    themeHeadingColor: '#ffffff',
    themeTextColor: '#e5e5e5',
    themeCardBg: '#1a1a1a',
    themeRatingColor: '#f7941d',
    googleFontKhmer: '',
    googleFontEnglish: '',
    googleFontMenu: '',
    googleFontTitle: '',
    disableRightClick: false,
    disableDevtools: false,
    rightClickRedirectUrl: '',
    siteWidth: 1280,
    gridColumns: 6,
  })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showTmdbKey, setShowTmdbKey] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // --- 2FA (Two-Factor Authentication) ---
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(true)
  const [twoFactorSetup, setTwoFactorSetup] = useState(null) // { secret, qrDataUrl } while mid-setup
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [twoFactorBusy, setTwoFactorBusy] = useState(false)

  useEffect(() => {
    fetch2FAStatus(token)
      .then((data) => setTwoFactorEnabled(data.enabled))
      .catch(() => {})
      .finally(() => setTwoFactorLoading(false))
  }, [token])

  const handleStart2FASetup = async () => {
    setTwoFactorError('')
    setTwoFactorBusy(true)
    try {
      const data = await setup2FA(token)
      setTwoFactorSetup(data)
    } catch (err) {
      setTwoFactorError(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const handleConfirm2FA = async (e) => {
    e.preventDefault()
    setTwoFactorError('')
    setTwoFactorBusy(true)
    try {
      await enable2FA(token, twoFactorCode)
      setTwoFactorEnabled(true)
      setTwoFactorSetup(null)
      setTwoFactorCode('')
    } catch (err) {
      setTwoFactorError(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const handleDisable2FA = async (e) => {
    e.preventDefault()
    setTwoFactorError('')
    setTwoFactorBusy(true)
    try {
      await disable2FA(token, twoFactorCode)
      setTwoFactorEnabled(false)
      setTwoFactorCode('')
    } catch (err) {
      setTwoFactorError(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [pendingImportFile, setPendingImportFile] = useState(null)

  useEffect(() => {
    fetchAdminSettings(token)
      .then((data) =>
        setSettings({
          siteName: data.siteName || '',
          logoUrl: data.logoUrl || '',
          seoDescription: data.seoDescription || '',
          tmdbApiKey: data.tmdbApiKey || '',
          customCss: data.customCss || '',
          headerCode: data.headerCode || '',
          footerCode: data.footerCode || '',
          footerDescription: data.footerDescription || '',
          socialFacebook: data.socialFacebook || '',
          socialTelegram: data.socialTelegram || '',
          socialYoutube: data.socialYoutube || '',
          footerCopyright: data.footerCopyright || '',
          showFooterBrand: data.showFooterBrand ?? true,
          showFooterSocial: data.showFooterSocial ?? true,
          themePrimaryColor: data.themePrimaryColor || '#e50914',
          themeNavbarBg: data.themeNavbarBg || '#0d0d0d',
          themeFooterBg: data.themeFooterBg || '#0a0a0a',
          themeBodyBg: data.themeBodyBg || '#0d0d0d',
          themePlaylistColor: data.themePlaylistColor || '#e50914',
          themeHeadingColor: data.themeHeadingColor || '#ffffff',
          themeTextColor: data.themeTextColor || '#e5e5e5',
          themeCardBg: data.themeCardBg || '#1a1a1a',
          themeRatingColor: data.themeRatingColor || '#f7941d',
          googleFontKhmer: data.googleFontKhmer || '',
          googleFontEnglish: data.googleFontEnglish || '',
          googleFontMenu: data.googleFontMenu || '',
          googleFontTitle: data.googleFontTitle || '',
          disableRightClick: data.disableRightClick ?? false,
          disableDevtools: data.disableDevtools ?? false,
          rightClickRedirectUrl: data.rightClickRedirectUrl || '',
          siteWidth: data.siteWidth || 1280,
          gridColumns: data.gridColumns || 6,
        }),
      )
      .finally(() => setLoading(false))
  }, [token])

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setSettingsError('')
    setSettingsSaved(false)
    setSavingSettings(true)
    try {
      await updateSettings(token, settings)
      setSettingsSaved(true)
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  // Resets one section's fields to their default values and saves
  // immediately (rather than just filling the form and waiting for a
  // separate "រក្សាទុក" click) — that's the whole point of a "Reset"
  // button, and matches how the destructive backup-import flow already
  // confirms before doing something irreversible to saved settings.
  const handleResetSection = async (sectionKey, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    const defaults = SECTION_DEFAULTS[sectionKey]
    setSettingsError('')
    setSettingsSaved(false)
    setSavingSettings(true)
    try {
      const merged = { ...settings, ...defaults }
      await updateSettings(token, merged)
      setSettings(merged)
      setSettingsSaved(true)
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  // Applies a full-site color preset and saves immediately — same
  // "reset + auto-save" pattern as handleResetSection, since a preset is
  // effectively "reset to this palette" rather than something worth a
  // separate manual Save step.
  const handleApplyPreset = async (preset) => {
    setSettingsError('')
    setSettingsSaved(false)
    setSavingSettings(true)
    try {
      const merged = { ...settings, ...preset.values }
      await updateSettings(token, merged)
      setSettings(merged)
      setSettingsSaved(true)
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPoster(token, file)
      setSettings((prev) => ({ ...prev, logoUrl: url }))
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSaved(false)
    setSavingPassword(true)
    try {
      await changeAdminPassword(token, currentPassword, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleExport = async () => {
    setExportError('')
    setExporting(true)
    try {
      const blob = await exportBackup(token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dramatv-backup-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    setImportSuccess('')
    setPendingImportFile(file)
  }

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return
    setImportError('')
    setImportSuccess('')
    setImporting(true)
    try {
      const text = await pendingImportFile.text()
      const parsed = JSON.parse(text)
      const result = await importBackup(token, parsed)
      const totalRows = result.imported.reduce((sum, t) => sum + t.count, 0)
      setImportSuccess(
        `Import ជោគជ័យ! បានស្តារ ${totalRows} កំណត់ត្រា។ សូម Refresh ទំព័រ ឬ Login ឡើងវិញ។`,
      )
      setPendingImportFile(null)
    } catch (err) {
      setImportError(err.message)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <p className="admin-loading">កំពុងផ្ទុក...</p>
  }

  return (
    <div className="admin-settings">
      <h1>ការកំណត់</h1>

      <div className="settings-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`settings-tab-btn ${activeTab === tab.key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <section className="settings-section">
          <h2>ព័ត៌មាន Site</h2>
          <form onSubmit={handleSettingsSubmit}>
            {settingsError && <p className="admin-error">{settingsError}</p>}
            {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

            <label className="settings-field">
              <span>ឈ្មោះ Site</span>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings((p) => ({ ...p, siteName: e.target.value }))}
              />
            </label>

            <label className="settings-field">
              <span>SEO Description</span>
              <textarea
                rows={3}
                value={settings.seoDescription}
                onChange={(e) => setSettings((p) => ({ ...p, seoDescription: e.target.value }))}
              />
            </label>

            <div className="settings-form-actions">
              <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
              <button
                type="button"
                className="settings-reset-btn"
                onClick={() =>
                  handleResetSection('general', 'សម្អាតឈ្មោះ Site និង SEO Description មែនទេ?')
                }
                disabled={savingSettings}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'appearance' && (
        <>
          <section className="settings-section">
            <h2>Logo</h2>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <label className="settings-field settings-field-stack">
                <span>Logo</span>
                <div className="logo-upload-row">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings((p) => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="https://... ឬ upload ខាងស្តាំ"
                  />
                  <label className="upload-btn">
                    {uploading ? 'កំពុង Upload...' : 'ជ្រើសរូបភាព'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                  </label>
                </div>
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo preview" className="logo-preview" />
                )}
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() => handleResetSection('logo', 'លុប Logo ចេញមែនទេ?')}
                  disabled={savingSettings}
                >
                  Reset (លុប Logo)
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section">
            <h2>ទំហំ Site (Site Width)</h2>
            <p className="settings-hint">
              កំណត់ទំហំអតិបរមារបស់មាតិកា Site (Navbar, Footer, Grid រឿងភាគ, ទំព័រមើលរឿង ។ល។)។
              តម្លៃធម្មតាគឺ 1280px។ អាចកំណត់ចាប់ពី 960px (តូច/ចង្អៀត) ដល់ 2560px (ធំ/ទូលាយ)។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <label className="settings-field">
                <span>ទំហំ Site: {settings.siteWidth}px</span>
                <div className="site-width-row">
                  <input
                    type="range"
                    min={960}
                    max={2560}
                    step={20}
                    value={settings.siteWidth}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, siteWidth: Number(e.target.value) }))
                    }
                    className="site-width-slider"
                  />
                  <input
                    type="number"
                    min={960}
                    max={2560}
                    step={20}
                    value={settings.siteWidth}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, siteWidth: Number(e.target.value) }))
                    }
                    className="site-width-number"
                  />
                  <span className="site-width-unit">px</span>
                </div>
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() => handleResetSection('siteWidth')}
                  disabled={savingSettings}
                >
                  Reset ទៅ 1280px
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section">
            <h2>ចំនួន Column ក្នុងមួយជួរ (Grid Columns)</h2>
            <p className="settings-hint">
              កំណត់ចំនួនផុសរឿងភាគក្នុងមួយជួរ សម្រាប់អេក្រង់ Desktop/ធំ (ឧ. 6, 8, 10)។ តម្លៃ
              ធម្មតាគឺ 6 ជួរ។ អេក្រង់ Mobile/Tablet នៅតែប្រើទម្រង់ 2/3/4 columns ដូចដើម
              ដើម្បីធានាថារូបភាពនៅតែមើលច្បាស់ មិនតូចពេក។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <label className="settings-field">
                <span>ចំនួន Column: {settings.gridColumns}</span>
                <div className="site-width-row">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={settings.gridColumns}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, gridColumns: Number(e.target.value) }))
                    }
                    className="site-width-slider"
                  />
                  <input
                    type="number"
                    min={2}
                    max={10}
                    step={1}
                    value={settings.gridColumns}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, gridColumns: Number(e.target.value) }))
                    }
                    className="site-width-number"
                  />
                </div>
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() => handleResetSection('gridColumns')}
                  disabled={savingSettings}
                >
                  Reset ទៅ 6 Column
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section">
            <h2>Font (Google Fonts) តាមផ្នែក</h2>
            <p className="settings-hint">
              ជ្រើស Font ដោយឡែកពីគ្នាសម្រាប់ផ្នែកនីមួយៗនៅលើ Site ពី{' '}
              <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer">
                fonts.google.com
              </a>
              ។ ចម្លងឈ្មោះ Font ជាភាសាអង់គ្លេស (ឧ. "Poppins", "Hanuman") ពីលើគេហទំព័រនោះ ដាក់ចូល
              ក្នុងប្រអប់ត្រូវនឹងផ្នែកនីមួយៗខាងក្រោម។ ទំនេរបើចង់ប្រើ Font លំនាំដើម
              (Arial/Battambang)។ សម្រាប់អក្សរខ្មែរ ត្រូវជ្រើស Font ដែលគាំទ្រអក្សរខ្មែរ (ឧ. "Noto
              Sans Khmer", "Battambang", "Moul", "Hanuman", "Siemreap" សុទ្ធតែមាននៅ Google Fonts)។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <label className="settings-field">
                <span>Font អក្សរខ្មែរ (Khmer Text)</span>
                <input
                  type="text"
                  value={settings.googleFontKhmer}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, googleFontKhmer: e.target.value }))
                  }
                  placeholder="ឧ. Noto Sans Khmer, Battambang, Hanuman"
                />
              </label>
              {settings.googleFontKhmer && (
                <p
                  className="font-preview"
                  style={{ fontFamily: `'${settings.googleFontKhmer}', sans-serif` }}
                >
                  ឧទាហរណ៍ — សួស្តី DramaTV Aa Bb Cc
                </p>
              )}

              <label className="settings-field">
                <span>Font អក្សរអង់គ្លេស (English Text)</span>
                <input
                  type="text"
                  value={settings.googleFontEnglish}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, googleFontEnglish: e.target.value }))
                  }
                  placeholder="ឧ. Poppins, Roboto, Inter"
                />
              </label>
              {settings.googleFontEnglish && (
                <p
                  className="font-preview"
                  style={{ fontFamily: `'${settings.googleFontEnglish}', sans-serif` }}
                >
                  Example — Sample Text Aa Bb Cc 123
                </p>
              )}

              <label className="settings-field">
                <span>Font Menu (Navbar Links)</span>
                <input
                  type="text"
                  value={settings.googleFontMenu}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, googleFontMenu: e.target.value }))
                  }
                  placeholder="ឧ. Montserrat, Kantumruy Pro"
                />
              </label>
              {settings.googleFontMenu && (
                <p
                  className="font-preview"
                  style={{ fontFamily: `'${settings.googleFontMenu}', sans-serif` }}
                >
                  ឧទាហរណ៍ Menu — ទំព័រដើម / HOME
                </p>
              )}

              <label className="settings-field">
                <span>Font ចំណងជើង (Headings/Titles)</span>
                <input
                  type="text"
                  value={settings.googleFontTitle}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, googleFontTitle: e.target.value }))
                  }
                  placeholder="ឧ. Moul, Bayon, Playfair Display"
                />
              </label>
              {settings.googleFontTitle && (
                <p
                  className="font-preview"
                  style={{ fontFamily: `'${settings.googleFontTitle}', sans-serif` }}
                >
                  ឧទាហរណ៍ ចំណងជើង — Title Example
                </p>
              )}

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('googleFonts', 'Reset Font ទាំងអស់ត្រឡប់ទៅលំនាំដើមមែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset Font ទាំងអស់
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {activeTab === 'colors' && (
        <>
        <section className="settings-section">
          <h2>ប្តូរពណ៌ Site ទាំងមូល (Theme Presets)</h2>
          <p className="settings-hint">
            ចុចលើពណ៌ណាមួយខាងក្រោម ដើម្បីប្តូរពណ៌គ្រប់ផ្នែកនៅលើ Site ក្នុងចុចតែម្តង
            (Navbar, Footer, Body, ចំណងជើង, អក្សរ, Card, Rating ។ល។)។ រក្សាទុកដោយស្វ័យប្រវត្តិ
            ក្រោយពេលចុច — អាចកែពណ៌ណាមួយបន្ថែមទៀតដោយឡែកនៅខាងក្រោមបានក្រោយពេលជ្រើស។
          </p>
          <div className="theme-preset-list">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="theme-preset-btn"
                onClick={() => handleApplyPreset(preset)}
                disabled={savingSettings}
              >
                <span
                  className="theme-preset-swatch"
                  style={{ background: preset.swatch }}
                />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Custom Color តាមផ្នែក</h2>
          <p className="settings-hint">
            ជ្រើសពណ៌ផ្ទាល់ខ្លួនសម្រាប់ផ្នែកនីមួយៗនៅលើ Site។ ពណ៌ "សំខាន់ (Primary)" អនុវត្តទៅលើ
            ប៊ូតុង, tab active, badge, និង accent ផ្សេងៗនៅទូទាំង site ដោយស្វ័យប្រវត្តិ។
          </p>
          <form onSubmit={handleSettingsSubmit}>
            {settingsError && <p className="admin-error">{settingsError}</p>}
            {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

            <div className="color-field-list">
              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themePrimaryColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themePrimaryColor: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themePrimaryColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themePrimaryColor: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌សំខាន់ (Primary) — ប៊ូតុង, tab active, badge, accent</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeNavbarBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeNavbarBg: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeNavbarBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeNavbarBg: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ផ្ទៃខាងក្រោយ Navbar (ខាងលើ)</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeFooterBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeFooterBg: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeFooterBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeFooterBg: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ផ្ទៃខាងក្រោយ Footer (ខាងក្រោម)</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeBodyBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeBodyBg: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeBodyBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeBodyBg: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ផ្ទៃខាងក្រោយសម្រាប់ទំព័រទាំងអស់ (Body)</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themePlaylistColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themePlaylistColor: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themePlaylistColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themePlaylistColor: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ប៊ូតុង Episode កំពុងចាក់ (Playlist) នៅទំព័រមើលរឿង</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeHeadingColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeHeadingColor: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeHeadingColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeHeadingColor: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ចំណងជើង (Headings) — ចំណងជើងផ្នែក, ចំណងជើងរឿងភាគ, ចំណងជើងមតិយោបល់</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeTextColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeTextColor: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeTextColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeTextColor: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌អក្សរធម្មតា (Body Text) — អក្សរទូទៅនៅទូទាំង site</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeCardBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeCardBg: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeCardBg}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeCardBg: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ផ្ទៃខាងក្រោយ Poster/Card — មុនរូបភាពផ្ទុកចប់</span>
              </label>

              <label className="color-field">
                <div className="color-field-swatch-row">
                  <input
                    type="color"
                    value={settings.themeRatingColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeRatingColor: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={settings.themeRatingColor}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, themeRatingColor: e.target.value }))
                    }
                  />
                </div>
                <span>ពណ៌ Rating (⭐ ចំណាត់ថ្នាក់) នៅទំព័រមើលរឿង</span>
              </label>
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
              <button
                type="button"
                className="settings-reset-btn"
                onClick={() =>
                  handleResetSection(
                    'colors',
                    'Reset ពណ៌ទាំងអស់ត្រឡប់ទៅជាលំនាំដើមមែនទេ?',
                  )
                }
                disabled={savingSettings}
              >
                Reset ពណ៌ទាំងអស់
              </button>
            </div>
          </form>
        </section>
        </>
      )}

      {activeTab === 'footer' && (
        <>
          <section className="settings-section settings-section-wide">
            <h2>បិទ/បើក ផ្នែកនីមួយៗក្នុង Footer</h2>
            <p className="settings-hint">
              បិទផ្នែកណាមួយ ដើម្បីលាក់វាចេញពី Footer ដោយមិនចាំបាច់លុបទិន្នន័យខាងក្នុង។ បើកឡើងវិញនៅពេលណាក៍បាន។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <div className="footer-toggle-list">
                <div className="footer-toggle-row">
                  <span>Logo + អក្សរពិពណ៌នា + Social Icons</span>
                  <div className="subtitle-status-toggle footer-toggle-buttons">
                    <button
                      type="button"
                      className={`status-toggle-btn ${settings.showFooterBrand ? 'is-on' : ''}`}
                      onClick={() => setSettings((p) => ({ ...p, showFooterBrand: true }))}
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      className={`status-toggle-btn ${!settings.showFooterBrand ? 'is-off' : ''}`}
                      onClick={() => setSettings((p) => ({ ...p, showFooterBrand: false }))}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                <div className="footer-toggle-row">
                  <span>Social Media Icons (Facebook/Telegram/YouTube)</span>
                  <div className="subtitle-status-toggle footer-toggle-buttons">
                    <button
                      type="button"
                      className={`status-toggle-btn ${settings.showFooterSocial ? 'is-on' : ''}`}
                      onClick={() => setSettings((p) => ({ ...p, showFooterSocial: true }))}
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      className={`status-toggle-btn ${!settings.showFooterSocial ? 'is-off' : ''}`}
                      onClick={() => setSettings((p) => ({ ...p, showFooterSocial: false }))}
                    >
                      OFF
                    </button>
                  </div>
                </div>

              </div>

              <p className="settings-hint">
                ជួរឈរតំណភ្ជាប់ (ទំព័រ/ព័ត៌មានផ្លូវច្បាប់/ប្រភេទ/ជួរឈរផ្សេងទៀត) ឥឡូវគ្រប់គ្រងនៅ
                ផ្នែក "Footer Columns" ក្នុង Sidebar — អាចបន្ថែម/លុប/កែឈ្មោះ/អូសប្តូរទីតាំងបានផ្ទាល់
                ដោយមិនចាំបាច់ប្រើ toggle ទេ (លុបជួរឈរ = លាក់ចេញពី Footer)។
              </p>

              <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
              </button>
            </form>
          </section>

          <section className="settings-section">
            <h2>ព័ត៌មាន Footer</h2>
            <p className="settings-hint">
              កែសម្រួលអក្សរពិពណ៌នា និងសិទ្ធិចម្លង ដែលបង្ហាញនៅផ្នែក Footer (ខាងក្រោមទំព័រ)។
              តំណភ្ជាប់ (Pages/Legal/Categories) គ្រប់គ្រងនៅផ្នែក "Menu" ដាច់ដោយឡែក។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              {settingsError && <p className="admin-error">{settingsError}</p>}
              {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

              <label className="settings-field">
                <span>អក្សរពិពណ៌នា (ក្រោម Logo)</span>
                <textarea
                  rows={3}
                  value={settings.footerDescription}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, footerDescription: e.target.value }))
                  }
                  placeholder="ឧ. គេហទំព័រមើលរឿងភាគអនឡាញ ចិន កូរ៉េ និងថៃ..."
                />
              </label>

              <label className="settings-field">
                <span>អក្សរសិទ្ធិចម្លង (Copyright) — ទំនេរបើចង់ប្រើលំនាំដើម</span>
                <input
                  type="text"
                  value={settings.footerCopyright}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, footerCopyright: e.target.value }))
                  }
                  placeholder={`ឧ. © ${new Date().getFullYear()} ${settings.siteName || 'DramaTV'} — រក្សាសិទ្ធិគ្រប់យ៉ាង។`}
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('footerInfo', 'សម្អាតអក្សរពិពណ៌នា និង Copyright មែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section">
            <h2>Social Media Links</h2>
            <p className="settings-hint">
              ដាក់ URL ពេញ (ឧ. https://facebook.com/yourpage)។ ទំនេរបើមិនចង់បង្ហាញ icon នោះទេ។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              <label className="settings-field">
                <span>Facebook URL</span>
                <input
                  type="text"
                  value={settings.socialFacebook}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, socialFacebook: e.target.value }))
                  }
                  placeholder="https://facebook.com/..."
                />
              </label>

              <label className="settings-field">
                <span>Telegram URL</span>
                <input
                  type="text"
                  value={settings.socialTelegram}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, socialTelegram: e.target.value }))
                  }
                  placeholder="https://t.me/..."
                />
              </label>

              <label className="settings-field">
                <span>YouTube URL</span>
                <input
                  type="text"
                  value={settings.socialYoutube}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, socialYoutube: e.target.value }))
                  }
                  placeholder="https://youtube.com/..."
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('socialLinks', 'សម្អាត Social Media Links ទាំងអស់មែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {activeTab === 'code' && (
        <>
          <section className="settings-section settings-section-wide">
            <h2>Custom CSS</h2>
            <p className="settings-hint">
              បញ្ចូល CSS ផ្ទាល់ខ្លួន ដើម្បីកែម៉ូតទំព័រទាំងអស់នៅលើ Site (ឧ. ប្តូរពណ៌, font,
              spacing)។ CSS នេះនឹងត្រូវផ្ទុកនៅរាល់ទំព័រ ក្រោយ stylesheet ធម្មតា ដូច្នេះអាចត្រួតជាន់
              (override) style ដើមបានទាំងអស់។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              <label className="settings-field">
                <span>CSS Code</span>
                <textarea
                  rows={10}
                  className="custom-css-textarea"
                  value={settings.customCss}
                  onChange={(e) => setSettings((p) => ({ ...p, customCss: e.target.value }))}
                  placeholder={'ឧ.\n.navbar {\n  background: #000;\n}'}
                  spellCheck={false}
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('customCss', 'លុប Custom CSS ទាំងអស់មែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset (សម្អាត)
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section settings-section-wide">
            <h2>Global Header Code</h2>
            <p className="settings-hint">
              បញ្ចូល HTML/JS snippet ដែលនឹងត្រូវផ្ទុកចូល <code>&lt;head&gt;</code> របស់រាល់ទំព័រ។
              ប្រើសម្រាប់ដាក់ <strong>Google Analytics</strong>, <strong>Google Search
              Console</strong> verification tag, ឬ script tracking ផ្សេងទៀត។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              <label className="settings-field">
                <span>Header Code</span>
                <textarea
                  rows={8}
                  className="custom-css-textarea"
                  value={settings.headerCode}
                  onChange={(e) => setSettings((p) => ({ ...p, headerCode: e.target.value }))}
                  placeholder={
                    '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag(\'js\', new Date());\n  gtag(\'config\', \'G-XXXXXXX\');\n</script>'
                  }
                  spellCheck={false}
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('headerCode', 'លុប Header Code ទាំងអស់មែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset (សម្អាត)
                </button>
              </div>
            </form>
          </section>

          <section className="settings-section settings-section-wide">
            <h2>Global Footer Code</h2>
            <p className="settings-hint">
              បញ្ចូល HTML/JS snippet ដែលនឹងត្រូវផ្ទុកមុន <code>&lt;/body&gt;</code> របស់រាល់ទំព័រ។
              ប្រើសម្រាប់ chat widget, pixel tracking, ឬ script ផ្សេងទៀតដែលមិនចាំបាច់ block
              ការផ្ទុកទំព័រ។
            </p>
            <form onSubmit={handleSettingsSubmit}>
              <label className="settings-field">
                <span>Footer Code</span>
                <textarea
                  rows={8}
                  className="custom-css-textarea"
                  value={settings.footerCode}
                  onChange={(e) => setSettings((p) => ({ ...p, footerCode: e.target.value }))}
                  placeholder={'<!-- ឧ. Facebook Pixel, live chat widget, ។ល។ -->'}
                  spellCheck={false}
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
                  {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={() =>
                    handleResetSection('footerCode', 'លុប Footer Code ទាំងអស់មែនទេ?')
                  }
                  disabled={savingSettings}
                >
                  Reset (សម្អាត)
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {activeTab === 'integrations' && (
        <section className="settings-section">
          <h2>TMDB API Key</h2>
          <p className="settings-hint">
            ត្រូវការសម្រាប់មុខងារ "ស្វែងរកពី TMDB" ក្នុងទំព័រផុសរឿង។ ចុះឈ្មោះទទួល key
            ឥតគិតថ្លៃនៅ{' '}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
              themoviedb.org/settings/api
            </a>
            ។
          </p>
          <form onSubmit={handleSettingsSubmit}>
            {settingsError && <p className="admin-error">{settingsError}</p>}
            {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

            <label className="settings-field">
              <span>API Key</span>
              <div className="tmdb-key-row">
                <input
                  type={showTmdbKey ? 'text' : 'password'}
                  value={settings.tmdbApiKey}
                  onChange={(e) => setSettings((p) => ({ ...p, tmdbApiKey: e.target.value }))}
                  placeholder="ដាក់ TMDB API Key របស់អ្នកនៅទីនេះ"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="tmdb-key-toggle-btn"
                  onClick={() => setShowTmdbKey((v) => !v)}
                >
                  {showTmdbKey ? 'លាក់' : 'បង្ហាញ'}
                </button>
              </div>
            </label>

            <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
              {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="settings-section">
          <h2>ការការពារមាតិកា (Content Protection)</h2>
          <p className="settings-hint">
            ការកំណត់ទាំងនេះ <strong>មិនមែនជាការការពារពិតប្រាកដទេ</strong> — គ្រាន់តែរារាំង
            ការចុច Right Click និង Keyboard Shortcut ធម្មតា (F12, Ctrl+Shift+I/J,
            Ctrl+U) ប៉ុណ្ណោះ។ អ្នកប្រើដែលចេះបច្ចេកទេស នៅតែអាចបើក DevTools តាមមធ្យោបាយផ្សេង
            បានដែរ (ឧ. ពី Browser Menu ផ្ទាល់)។ ការកំណត់នេះ <strong>មិនអនុវត្តលើ Admin
            Panel</strong> ដើម្បីអោយអ្នកគ្រប់គ្រងនៅតែអាចប្រើ Right Click/DevTools ធម្មតា។
          </p>
          <form onSubmit={handleSettingsSubmit}>
            {settingsError && <p className="admin-error">{settingsError}</p>}
            {settingsSaved && <p className="admin-success">បានរក្សាទុករួច។</p>}

            <div className="footer-toggle-list">
              <div className="footer-toggle-row">
                <span>បិទ Right Click (លើទំព័រសាធារណៈ)</span>
                <div className="subtitle-status-toggle footer-toggle-buttons">
                  <button
                    type="button"
                    className={`status-toggle-btn ${settings.disableRightClick ? 'is-on' : ''}`}
                    onClick={() => setSettings((p) => ({ ...p, disableRightClick: true }))}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn ${!settings.disableRightClick ? 'is-off' : ''}`}
                    onClick={() => setSettings((p) => ({ ...p, disableRightClick: false }))}
                  >
                    OFF
                  </button>
                </div>
              </div>

              <div className="footer-toggle-row">
                <span>បិទ F12 / DevTools Shortcut (លើទំព័រសាធារណៈ)</span>
                <div className="subtitle-status-toggle footer-toggle-buttons">
                  <button
                    type="button"
                    className={`status-toggle-btn ${settings.disableDevtools ? 'is-on' : ''}`}
                    onClick={() => setSettings((p) => ({ ...p, disableDevtools: true }))}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`status-toggle-btn ${!settings.disableDevtools ? 'is-off' : ''}`}
                    onClick={() => setSettings((p) => ({ ...p, disableDevtools: false }))}
                  >
                    OFF
                  </button>
                </div>
              </div>
            </div>

            {settings.disableRightClick && (
              <label className="settings-field">
                <span>លោតទៅ URL នេះពេលចុច Right Click — ទំនេរបើគ្រាន់តែចង់បិទប៉ុណ្ណោះ</span>
                <input
                  type="text"
                  value={settings.rightClickRedirectUrl}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, rightClickRedirectUrl: e.target.value }))
                  }
                  placeholder="ឧ. https://example.com"
                />
              </label>
            )}

            <button type="submit" className="settings-submit-btn" disabled={savingSettings}>
              {savingSettings ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="settings-section">
          <h2>ប្តូរពាក្យសម្ងាត់ Admin</h2>
          <form onSubmit={handlePasswordSubmit}>
            {passwordError && <p className="admin-error">{passwordError}</p>}
            {passwordSaved && <p className="admin-success">ប្តូរពាក្យសម្ងាត់ជោគជ័យ។</p>}

            <label className="settings-field">
              <span>ពាក្យសម្ងាត់បច្ចុប្បន្ន</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>

            <label className="settings-field">
              <span>ពាក្យសម្ងាត់ថ្មី</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            <button type="submit" className="settings-submit-btn" disabled={savingPassword}>
              {savingPassword ? 'កំពុងផ្លាស់ប្តូរ...' : 'ប្តូរពាក្យសម្ងាត់'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'security' && !twoFactorLoading && (
        <section className="settings-section">
          <h2>ការផ្ទៀងផ្ទាត់ ២ជាន់ (2FA)</h2>
          <p className="settings-hint">
            បន្ថែមសុវត្ថិភាពដោយតម្រូវឱ្យបញ្ចូលកូដ ៦ខ្ទង់ពី Authenticator App (Google
            Authenticator, Authy...) រាល់ពេលចូលគណនី Admin បន្ថែមលើ Username/Password។
          </p>

          {twoFactorError && <p className="admin-error">{twoFactorError}</p>}

          {twoFactorEnabled ? (
            <>
              <p className="admin-success">2FA កំពុងបើក។ គណនីរបស់អ្នកមានសុវត្ថិភាពបន្ថែម។</p>
              <form onSubmit={handleDisable2FA}>
                <label className="settings-field">
                  <span>បញ្ចូលកូដបច្ចុប្បន្ន ដើម្បីបិទ 2FA</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    required
                  />
                </label>
                <button type="submit" className="settings-submit-btn" disabled={twoFactorBusy}>
                  {twoFactorBusy ? 'កំពុងបិទ...' : 'បិទ 2FA'}
                </button>
              </form>
            </>
          ) : twoFactorSetup ? (
            <>
              <p className="settings-hint">
                ស្កេន QR Code នេះជាមួយ Authenticator App បន្ទាប់មកបញ្ចូលកូដ ៦ខ្ទង់ ដើម្បីបញ្ជាក់។
              </p>
              <img
                src={twoFactorSetup.qrDataUrl}
                alt="2FA QR Code"
                className="twofactor-qr"
              />
              <p className="settings-hint">
                ឬបញ្ចូល Secret ដោយដៃ: <code>{twoFactorSetup.secret}</code>
              </p>
              <form onSubmit={handleConfirm2FA}>
                <label className="settings-field">
                  <span>កូដ ៦ខ្ទង់ ពី Authenticator App</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoFocus
                  />
                </label>
                <button type="submit" className="settings-submit-btn" disabled={twoFactorBusy}>
                  {twoFactorBusy ? 'កំពុងបញ្ជាក់...' : 'បញ្ជាក់ និងបើក 2FA'}
                </button>
              </form>
            </>
          ) : (
            <button
              type="button"
              className="settings-submit-btn"
              onClick={handleStart2FASetup}
              disabled={twoFactorBusy}
            >
              {twoFactorBusy ? 'កំពុងផ្ទុក...' : 'Setup 2FA'}
            </button>
          )}
        </section>
      )}

      {activeTab === 'backup' && (
        <section className="settings-section">
          <h2>Export / Import Website</h2>
          <p className="settings-hint">
            Export ទាញយកទិន្នន័យទាំងអស់ (រឿងភាគ, episodes, category, user, menu, ការកំណត់)
            ជា file JSON មួយ។ Import ជាមួយ file នេះនៅ server ថ្មី ដើម្បីផ្លាស់ប្តូរ Hosting/VPS
            បានយ៉ាងងាយស្រួល។ <strong>មិនរួមបញ្ចូល</strong> រូបភាព poster ដែល upload ផ្ទាល់
            (ក្នុងថត server/uploads) និង file server/.env — ត្រូវចម្លងទាំងនេះដោយដៃ។
          </p>

          <div className="backup-actions">
            <button className="settings-submit-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? 'កំពុង Export...' : 'Export ទិន្នន័យទាំងអស់'}
            </button>

            <label className="upload-btn import-btn">
              ជ្រើស File Import
              <input type="file" accept=".json" onChange={handleImportFileSelect} hidden />
            </label>
          </div>

          {exportError && <p className="admin-error">{exportError}</p>}
          {importError && <p className="admin-error">{importError}</p>}
          {importSuccess && <p className="admin-success">{importSuccess}</p>}

          {pendingImportFile && (
            <div className="import-confirm-box">
              <p className="import-warning">
                ⚠️ Import ជាមួយ <strong>{pendingImportFile.name}</strong> នឹង{' '}
                <strong>លុបទិន្នន័យទាំងអស់ដែលមានស្រាប់</strong> (រឿងភាគ, user, category, menu,
                ការកំណត់) រួចជំនួសដោយទិន្នន័យក្នុង file នេះ។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
              </p>
              <div className="import-confirm-actions">
                <button
                  className="settings-submit-btn"
                  onClick={handleConfirmImport}
                  disabled={importing}
                >
                  {importing ? 'កំពុង Import...' : 'បាទ/ចាស Import ជំនួសទិន្នន័យទាំងអស់'}
                </button>
                <button
                  type="button"
                  className="tmdb-key-toggle-btn"
                  onClick={() => setPendingImportFile(null)}
                  disabled={importing}
                >
                  បោះបង់
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default AdminSettings
