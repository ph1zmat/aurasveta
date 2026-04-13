import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'] as const

export function PropertiesPage() {
  const { data: properties, refetch } = trpc.properties.getAll.useQuery()
  const deleteMut = trpc.properties.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Свойства</h1>
        <Button size="sm" onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      {showForm && (
        <PropertyFormModal editId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch() }} />
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Ключ</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Товаров</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {properties?.map((prop: any) => (
              <tr key={prop.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-foreground">{prop.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{prop.key}</td>
                <td className="px-4 py-3 text-xs">{prop.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{prop._count?.productValues ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(prop.id); setShowForm(true) }}
                      className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm('Удалить?')) deleteMut.mutate(prop.id) }}
                      className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PropertyFormModal({ editId, onClose, onSuccess }: { editId: string | null; onClose: () => void; onSuccess: () => void }) {
  const createMut = trpc.properties.create.useMutation({ onSuccess })
  const updateMut = trpc.properties.update.useMutation({ onSuccess })
  const { data: editProp } = trpc.properties.getById.useQuery(editId!, { enabled: !!editId })

  const emptyForm = useMemo(() => ({
    name: '',
    key: '',
    type: 'STRING' as (typeof TYPES)[number],
    optionsText: '',
  }), [])

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!editId) {
      setForm(emptyForm)
      return
    }
    if (editProp) {
      const options = Array.isArray(editProp.options) ? (editProp.options as unknown as string[]) : []
      setForm({
        name: editProp.name ?? '',
        key: editProp.key ?? '',
        type: (editProp.type as (typeof TYPES)[number]) ?? 'STRING',
        optionsText: options.join(', '),
      })
    }
  }, [editId, editProp, emptyForm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const options =
      form.type === 'SELECT'
        ? form.optionsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : null

    if (form.type === 'SELECT' && (!options || options.length === 0)) {
      // Minimal UX: do not submit empty select options
      return
    }

    if (editId) updateMut.mutate({ id: editId, name: form.name, key: form.key, type: form.type as any, options })
    else createMut.mutate({ name: form.name, key: form.key, type: form.type as any, options })
  }

  return (
    <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editId ? 'Редактировать' : 'Новое свойство'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Название</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Ключ</label>
            <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Тип</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {form.type === 'SELECT' && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">
                Опции (через запятую)
              </label>
              <input
                value={form.optionsText}
                onChange={e => setForm(f => ({ ...f, optionsText: e.target.value }))}
                placeholder="Белый, Чёрный, Золотой"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Для типа SELECT список опций обязателен
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit">{editId ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
