import { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { getApiUrl, setApiUrl } from '../lib/store'

export function SettingsPage() {
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getApiUrl().then(setUrl)
  }, [])

  const handleSave = async () => {
    await setApiUrl(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Настройки</h1>

      <div className="rounded-2xl border border-border bg-muted/30 p-6 max-w-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-foreground">
          Подключение к серверу
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">URL API-сервера</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://aurasveta.ru"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Изменение требует перезапуска приложения
            </p>
          </div>
          <Button onClick={handleSave}>
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-6 max-w-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-foreground">
          О приложении
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Аура Света CMS Desktop v1.0.0</p>
          <p>Electron + React + tRPC</p>
        </div>
      </div>
    </div>
  )
}
