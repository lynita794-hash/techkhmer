import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <AdminAuthProvider>
                <App />
              </AdminAuthProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
