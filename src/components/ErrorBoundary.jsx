import { Component } from 'react'
import translations from '../i18n/translations'
import './ErrorBoundary.css'

// Catches render/lifecycle errors anywhere in the component tree below it
// so one broken component shows a recovery screen instead of a blank white
// page. Must be a class component — React only supports error boundaries
// via componentDidCatch/getDerivedStateFromError, no hook equivalent exists.
// Since class components can't use hooks, this reads the saved language
// directly from localStorage rather than useLanguage() — also means it
// still works even if the crash happened inside LanguageProvider itself.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      const lang = localStorage.getItem('dramatv_lang') === 'en' ? 'en' : 'km'
      const strings = translations[lang].error
      return (
        <div className="error-boundary">
          <h1>{strings.title}</h1>
          <p>{strings.description}</p>
          <button onClick={() => window.location.reload()}>{strings.reload}</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
