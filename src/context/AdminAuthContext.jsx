import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)
const STORAGE_KEY = 'dramatv_admin_token'

async function apiRequest(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'មានបញ្ហាកើតឡើង សូមព្យាយាមម្តងទៀត។')
  }
  return data
}

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [username, setUsername] = useState(null)

  // When the admin account has 2FA enabled, the server responds with
  // { requiresCode: true } and no token on the first call (username +
  // password only) — the caller (AdminLoginPage) then shows a 6-digit
  // code input and calls login() again with `code` set, which either
  // returns a real token or an error if the code is wrong.
  const login = async (usernameInput, password, code) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameInput, password, code }),
    })
    if (data.requiresCode) {
      return data
    }
    localStorage.setItem(STORAGE_KEY, data.token)
    setToken(data.token)
    setUsername(data.username)
    return data
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUsername(null)
  }

  return (
    <AdminAuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  return ctx
}
