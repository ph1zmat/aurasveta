import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { getToken, setToken, getApiUrl } from './store'

interface AuthUser {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function desktopApiUrl(apiUrl: string, path: string) {
  // In dev use Vite proxy to avoid renderer CORS/origin mismatches.
  if (import.meta.env.DEV) return path
  return `${apiUrl}${path}`
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    const loadingFallback = setTimeout(() => {
      setIsLoading(false)
    }, 6000)

    try {
      const token = await getToken()
      if (!token) {
        setUser(null)
        setIsLoading(false)
        clearTimeout(loadingFallback)
        return
      }

      const apiUrl = await getApiUrl()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(desktopApiUrl(apiUrl, '/api/desktop/auth/get-session'), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        void setToken(null)
        setUser(null)
        setIsLoading(false)
        clearTimeout(loadingFallback)
        return
      }

      const data = await res.json()
      if (data?.user) {
        // Проверяем роль — только ADMIN и EDITOR
        if (data.user.role !== 'ADMIN' && data.user.role !== 'EDITOR') {
          void setToken(null)
          setUser(null)
        } else {
          setUser(data.user)
        }
      } else {
        void setToken(null)
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      clearTimeout(loadingFallback)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const login = useCallback(async (email: string, password: string) => {
    const apiUrl = await getApiUrl()
    const res = await fetch(desktopApiUrl(apiUrl, '/api/desktop/auth/sign-in/email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Ошибка входа')
    }

    const data = await res.json()

    // Desktop needs the full cookie token (token.signature), not the short token from JSON.
    const token = data.sessionToken || data.data?.token || data.data?.session?.token

    if (token) {
      await setToken(token)
    }

    await fetchSession()
  }, [fetchSession])

  const logout = useCallback(async () => {
    await setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
