import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Pencil, Trash2, X, Shapes } from 'lucide-react'

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

export function SectionTypesPage() {
  const { data: sectionTypes, refetch } = trpc.sectionType.getAll.useQuery()

  const createMut = trpc.sectionType.create.useMutation({
    onSuccess: () => {
      refetch()
      setShowForm(false)
    },
  })
  const updateMut = trpc.sectionType.update.useMutation({
    onSuccess: () => {
      refetch()
      setShowForm(false)
    },
  })
  const deleteMut = trpc.sectionType.delete.useMutation({ onSuccess: () => refetch() })

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [component, setComponent] = useState('')
  const [configSchema, setConfigSchema] = useState('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const items = sectionTypes ?? []

  function openCreate() {
    setEditId(null)
    setName('')
    setComponent('')
    setConfigSchema('{}')
    setJsonError(null)
    setShowForm(true)
  }

  function openEdit(item: (typeof items)[number]) {
    setEditId(item.id)
    setName(item.name)
    setComponent(item.component)
    setConfigSchema(prettyJson(item.configSchema))
    setJsonError(null)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(configSchema)
      setJsonError(null)
    } catch {
      setJsonError('Некорректный JSON')
      return
    }

    if (editId) {
      updateMut.mutate({ id: editId, name, component, configSchema: parsed })
      return
    }

    createMut.mutate({ name, component, configSchema: parsed })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
            <Shapes className='h-5 w-5 text-primary' />
          </div>
          <h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
            Типы секций
          </h1>
        </div>
        <Button size='sm' onClick={openCreate}>
          <Plus className='mr-1 h-4 w-4' /> Добавить
        </Button>
      </div>

      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
          <div className='w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl'>
            <div className='flex items-center justify-between border-b border-border px-6 py-4'>
              <h2 className='text-base font-semibold text-foreground'>
                {editId ? 'Редактировать тип секции' : 'Новый тип секции'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4 p-6'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-muted-foreground'>Название</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-muted-foreground'>Компонент</label>
                  <input
                    required
                    value={component}
                    onChange={e => setComponent(e.target.value)}
                    className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>Config schema (JSON)</label>
                <textarea
                  value={configSchema}
                  onChange={e => setConfigSchema(e.target.value)}
                  rows={10}
                  className='flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground'
                />
                {jsonError && <p className='mt-1 text-xs text-destructive'>{jsonError}</p>}
              </div>

              <div className='flex justify-end gap-2'>
                <Button type='button' variant='ghost' size='sm' onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
                <Button type='submit' size='sm' disabled={createMut.isPending || updateMut.isPending}>
                  {editId ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className='flex flex-col divide-y divide-border/50 overflow-hidden rounded-xl border border-border bg-card'>
          {items.map(item => (
            <div key={item.id} className='flex items-center gap-4 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium text-foreground'>{item.name}</span>
                  <span className='rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
                    {item.component}
                  </span>
                </div>
              </div>
              <div className='flex gap-1'>
                <button
                  onClick={() => openEdit(item)}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  <Pencil className='h-3.5 w-3.5' />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить тип секции "${item.name}"?`)) {
                      deleteMut.mutate(item.id)
                    }
                  }}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center text-sm text-muted-foreground'>
          Нет типов секций
        </div>
      )}
    </div>
  )
}
