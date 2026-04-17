import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { getApiUrl, setApiUrl } from '../lib/store'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [showServerField, setShowServerField] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getApiUrl().then(url => setServerUrl(url))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Сохраняем URL сервера перед логином
      const trimmedUrl = serverUrl.replace(/\/+$/, '')
      await setApiUrl(trimmedUrl)
      // Диагностика: пробуем явно сделать запрос
      const res = await fetch(`${trimmedUrl}/api/desktop/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        setError(`Ошибка входа: ${res.status} ${res.statusText}\n${text}`)
        setLoading(false)
        return
      }
      // Если всё ок, пробуем обычный login
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('EXCEPTION: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">
            Аура Света
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Вход в панель управления
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowServerField(!showServerField)}
              className="mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showServerField ? '▾ Скрыть настройки сервера' : '▸ Настройки сервера'}
            </button>
            {showServerField && (
              <div className="mb-3">
                <label className="mb-1 block text-sm text-muted-foreground">
                  URL сервера
                </label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="http://localhost:3000"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Для локальной разработки: http://localhost:3000
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  )
}
