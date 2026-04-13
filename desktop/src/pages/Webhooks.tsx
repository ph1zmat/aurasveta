import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Trash2, Send, X } from 'lucide-react'

const EVENTS = ['product.created', 'product.updated', 'order.created', 'order.updated'] as const

export function WebhooksPage() {
  const { data: webhooks, refetch } = trpc.webhooks.getAll.useQuery()
  const deleteMut = trpc.webhooks.delete.useMutation({ onSuccess: () => refetch() })
  const testMut = trpc.webhooks.test.useMutation()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Вебхуки</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      {showForm && (
        <WebhookFormModal onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch() }} />
      )}

      <div className="space-y-3">
        {webhooks?.map((wh: any) => (
          <div key={wh.id} className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground break-all">{wh.url}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {wh.events.map((ev: string) => (
                    <span key={ev} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{ev}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => testMut.mutate(wh.id)}
                  className="text-muted-foreground hover:text-foreground" title="Тест">
                  <Send className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm('Удалить?')) deleteMut.mutate(wh.id) }}
                  className="text-muted-foreground hover:text-destructive" title="Удалить">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {testMut.data && testMut.variables === wh.id && (
              <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                Тест: {JSON.stringify(testMut.data)}
              </div>
            )}
          </div>
        ))}
        {(!webhooks || webhooks.length === 0) && (
          <p className="text-sm text-muted-foreground">Нет зарегистрированных вебхуков</p>
        )}
      </div>
    </div>
  )
}

function WebhookFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const createMut = trpc.webhooks.create.useMutation({ onSuccess })
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])

  const toggleEvent = (ev: string) => {
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate({ url, events })
  }

  return (
    <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Новый вебхук</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} type="url" required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/webhook" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">События</label>
            <div className="space-y-2">
              {EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={events.includes(ev)} onChange={() => toggleEvent(ev)} />
                  {ev}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={events.length === 0}>Создать</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
