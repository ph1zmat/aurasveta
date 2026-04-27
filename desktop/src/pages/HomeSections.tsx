import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { SectionConfigEditor } from '../components/SectionConfigEditor'
import { Plus, Trash2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, X, LayoutGrid, Pencil } from 'lucide-react'
import { useApiBaseUrl } from '../lib/store'

export function HomeSectionsPage() {
  const { data: sections, refetch } = trpc.homeSection.getAll.useQuery()
  const { data: sectionTypes } = trpc.sectionType.getAll.useQuery()
  const apiBaseUrl = useApiBaseUrl()

  const createMut = trpc.homeSection.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
  const updateMut = trpc.homeSection.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
  const deleteMut = trpc.homeSection.delete.useMutation({ onSuccess: () => refetch() })
  const reorderMut = trpc.homeSection.reorder.useMutation({ onSuccess: () => refetch() })

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [sectionTypeId, setSectionTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [config, setConfig] = useState<Record<string, unknown>>({})

  const items = sections ?? []

  // component name for currently selected section type
  const currentComponentName =
    editId
      ? (items.find(s => s.id === editId)?.sectionType.component ?? '')
      : (sectionTypes?.find(t => t.id === sectionTypeId)?.component ?? '')

  function openCreate() {
    setEditId(null)
    setSectionTypeId(sectionTypes?.[0]?.id ?? '')
    setTitle('')
    setIsActive(true)
    setConfig({})
    setShowForm(true)
  }

  function openEdit(item: (typeof items)[number]) {
    setEditId(item.id)
    setSectionTypeId(item.sectionTypeId)
    setTitle(item.title ?? '')
    setIsActive(item.isActive)
    setConfig((item.config as Record<string, unknown>) ?? {})
    setShowForm(true)
  }

  function moveSection(index: number, dir: -1 | 1) {
    if (!items.length) return
    const next = items.map((s, i) => ({ id: s.id, order: i }))
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const tmp = next[index].order
    next[index].order = next[target].order
    next[target].order = tmp
    reorderMut.mutate(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editId) {
      updateMut.mutate({ id: editId, title: title || undefined, isActive, config })
      return
    }

    createMut.mutate({
      sectionTypeId,
      title: title || undefined,
      isActive,
      order: items.length,
      config,
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
            <LayoutGrid className='h-5 w-5 text-primary' />
          </div>
          <h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
            Секции главной
          </h1>
        </div>
        <Button size='sm' onClick={openCreate}>
          <Plus className='mr-1 h-4 w-4' /> Добавить
        </Button>
      </div>

      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
          <div className='flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
            <div className='flex items-center justify-between border-b border-border px-6 py-4'>
              <h2 className='text-base font-semibold text-foreground'>
                {editId ? 'Редактировать секцию' : 'Новая секция'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='flex min-h-0 flex-col'>
              <div className='flex-1 space-y-4 overflow-y-auto px-6 py-5'>
                {!editId && (
                  <div>
                    <label className='mb-1 block text-xs font-medium text-muted-foreground'>Тип секции</label>
                    <select
                      required
                      value={sectionTypeId}
                      onChange={e => { setSectionTypeId(e.target.value); setConfig({}) }}
                      className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                    >
                      <option value=''>Выберите тип...</option>
                      {sectionTypes?.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.component})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                    Заголовок секции (опционально)
                  </label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                    placeholder='Оставьте пустым для заголовка по умолчанию'
                  />
                </div>

                {(sectionTypeId || editId) && (
                  <div className='rounded-xl border border-border/60 bg-muted/5 p-4'>
                    <SectionConfigEditor
                      componentName={currentComponentName}
                      value={config}
                      onChange={setConfig}
                      apiBaseUrl={apiBaseUrl}
                    />
                  </div>
                )}

                <label className='flex items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className='h-4 w-4 rounded border-border accent-primary'
                  />
                  Показывать на главной
                </label>
              </div>

              <div className='flex justify-end gap-2 border-t border-border px-6 py-4'>
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
        <div className='flex flex-col gap-2'>
          {items.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${item.isActive ? 'border-border bg-card' : 'border-border/50 bg-muted/10 opacity-70'}`}>
              <GripVertical className='h-4 w-4 text-muted-foreground/40' />
              <div className='flex items-center gap-1'>
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'>
                  <ChevronUp className='h-3.5 w-3.5' />
                </button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === items.length - 1} className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'>
                  <ChevronDown className='h-3.5 w-3.5' />
                </button>
              </div>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-mono text-muted-foreground'>
                {item.order + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium text-foreground'>
                    {item.title ?? item.sectionType.name}
                  </span>
                  <span className='rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
                    {item.sectionType.component}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => updateMut.mutate({ id: item.id, isActive: !item.isActive })}
                  title={item.isActive ? 'Скрыть' : 'Показать'}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  {item.isActive ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' />}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  title='Редактировать'
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  <Pencil className='h-3.5 w-3.5' />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить секцию "${item.title ?? item.sectionType.name}"?`)) {
                      deleteMut.mutate(item.id)
                    }
                  }}
                  title='Удалить'
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
          Нет секций главной страницы
        </div>
      )}
    </div>
  )
}

  const { data: sections, refetch } = trpc.homeSection.getAll.useQuery()
  const { data: sectionTypes } = trpc.sectionType.getAll.useQuery()

  const createMut = trpc.homeSection.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
  const updateMut = trpc.homeSection.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
  const deleteMut = trpc.homeSection.delete.useMutation({ onSuccess: () => refetch() })
  const reorderMut = trpc.homeSection.reorder.useMutation({ onSuccess: () => refetch() })

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [sectionTypeId, setSectionTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [config, setConfig] = useState('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const items = sections ?? []

  function openCreate() {
    setEditId(null)
    setSectionTypeId(sectionTypes?.[0]?.id ?? '')
    setTitle('')
    setIsActive(true)
    setConfig('{}')
    setJsonError(null)
    setShowForm(true)
  }

  function openEdit(item: (typeof items)[number]) {
    setEditId(item.id)
    setSectionTypeId(item.sectionTypeId)
    setTitle(item.title ?? '')
    setIsActive(item.isActive)
    setConfig(JSON.stringify(item.config ?? {}, null, 2))
    setJsonError(null)
    setShowForm(true)
  }

  function moveSection(index: number, dir: -1 | 1) {
    if (!items.length) return
    const next = items.map((s, i) => ({ id: s.id, order: i }))
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const tmp = next[index].order
    next[index].order = next[target].order
    next[target].order = tmp
    reorderMut.mutate(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(config)
      setJsonError(null)
    } catch {
      setJsonError('Некорректный JSON')
      return
    }

    if (editId) {
      updateMut.mutate({ id: editId, title: title || undefined, isActive, config: parsed })
      return
    }

    createMut.mutate({
      sectionTypeId,
      title: title || undefined,
      isActive,
      order: items.length,
      config: parsed,
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
            <LayoutGrid className='h-5 w-5 text-primary' />
          </div>
          <h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
            Секции главной
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
                {editId ? 'Редактировать секцию' : 'Новая секция'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4 p-6'>
              {!editId && (
                <div>
                  <label className='mb-1 block text-xs font-medium text-muted-foreground'>Тип секции</label>
                  <select
                    required
                    value={sectionTypeId}
                    onChange={e => setSectionTypeId(e.target.value)}
                    className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  >
                    <option value=''>Выберите тип...</option>
                    {sectionTypes?.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.component})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>Заголовок (опционально)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                />
              </div>

              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>Config (JSON)</label>
                <textarea
                  value={config}
                  onChange={e => setConfig(e.target.value)}
                  rows={8}
                  className='flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground'
                />
                {jsonError && <p className='mt-1 text-xs text-destructive'>{jsonError}</p>}
              </div>

              <label className='flex items-center gap-2 text-sm text-foreground'>
                <input
                  type='checkbox'
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className='h-4 w-4 rounded border-border accent-primary'
                />
                Активна
              </label>

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
        <div className='flex flex-col gap-2'>
          {items.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${item.isActive ? 'border-border bg-card' : 'border-border/50 bg-muted/10 opacity-70'}`}>
              <GripVertical className='h-4 w-4 text-muted-foreground/40' />
              <div className='flex items-center gap-1'>
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'>
                  <ChevronUp className='h-3.5 w-3.5' />
                </button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === items.length - 1} className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'>
                  <ChevronDown className='h-3.5 w-3.5' />
                </button>
              </div>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-mono text-muted-foreground'>
                {item.order + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium text-foreground'>
                    {item.title ?? item.sectionType.name}
                  </span>
                  <span className='rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
                    {item.sectionType.component}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => updateMut.mutate({ id: item.id, isActive: !item.isActive })}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  {item.isActive ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' />}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  <Plus className='h-3.5 w-3.5 rotate-45' />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить секцию "${item.title ?? item.sectionType.name}"?`)) {
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
          Нет секций главной страницы
        </div>
      )}
    </div>
  )
}
