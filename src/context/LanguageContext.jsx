import { createContext, useContext, useMemo, useState } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'dramatv_lang'
const DEFAULT_LANG = 'km'

// Reads a dot-notation path (e.g. "auth.loginTitle") out of a translation
// object. Returns undefined if any segment along the way is missing.
function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'km' || saved === 'en' ? saved : DEFAULT_LANG
  })

  const setLang = (next) => {
    if (next !== 'km' && next !== 'en') return
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }

  // t(path, ...args) — looks up `path` in the current language, falling
  // back to Khmer (then the path itself) if missing. If the resolved
  // value is a function (used for strings that need interpolation, like
  // "{n} comments"), it's called with the remaining arguments.
  const t = useMemo(() => {
    return (path, ...args) => {
      const value = getPath(translations[lang], path) ?? getPath(translations.km, path) ?? path
      return typeof value === 'function' ? value(...args) : value
    }
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
