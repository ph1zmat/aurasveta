import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getToken, setToken, getApiUrl } from './store'

interface AuthUser {
  id: string
  name: string | null
  email: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) { setUser(null); setIsLoading(false); return }

      const apiUrl = await getApiUrl()
      const res = await fetch(`${apiUrl}/api/auth/get-session`, {
        headers: { Cookie: `better-auth.session_token=${token}` },
      })

      if (!res.ok) { await setToken(null); setUser(null); setIsLoading(false); return }

      const data = await res.json()
      if (data?.user && (data.user.role === 'ADMIN' || data.user.role === 'EDITOR')) {
        setUser(data.user)
      } else {
        await setToken(null)
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSession() }, [fetchSession])

  const login = useCallback(async (email: string, password: string) => {
    const apiUrl = await getApiUrl()
    const res = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Ошибка входа')
    }

    const data = await res.json()
    let token = data.token || data.session?.token
    const setCookie = res.headers.get('set-cookie')
    if (!token && setCookie) {
      const m = setCookie.match(/better-auth\.session_token=([^;]+)/)
      if (m) token = m[1]
    }
    if (token) await setToken(token)
    await fetchSession()
  }, [fetchSession])

  const logout = useCallback(async () => {
    try {
      const apiUrl = await getApiUrl()
      const token = await getToken()
      await fetch(`${apiUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: token ? { Cookie: `better-auth.session_token=${token}` } : {},
      })
    } catch { /* ignore */ }
    await setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
