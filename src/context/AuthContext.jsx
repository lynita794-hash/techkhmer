import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'dramatv_user_token'

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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    apiRequest('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const data = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const data = await apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    localStorage.setItem(STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
