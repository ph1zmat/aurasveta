import { useEffect, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react'
import { getApiUrl, getToken } from '../lib/store'

export function CategoriesPage() {
  const { data: tree, refetch } = trpc.categories.getTree.useQuery()
  const deleteMut = trpc.categories.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Категории</h1>
        <Button size="sm" onClick={() => { setEditId(null); setParentId(null); setShowForm(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      {showForm && (
        <CategoryFormModal
          editId={editId}
          parentId={parentId}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refetch() }}
        />
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        {tree?.map((cat: any) => (
          <CategoryNode
            key={cat.id}
            category={cat}
            level={0}
            onEdit={id => { setEditId(id); setShowForm(true) }}
            onDelete={id => { if (confirm('Удалить категорию?')) deleteMut.mutate(id) }}
            onAddChild={id => { setEditId(null); setParentId(id); setShowForm(true) }}
          />
        ))}
        {(!tree || tree.length === 0) && (
          <p className="text-sm text-muted-foreground p-4">Нет категорий</p>
        )}
      </div>
    </div>
  )
}

function CategoryNode({ category, level, onEdit, onDelete, onAddChild }: {
  category: any; level: number
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddChild: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(level < 1)
  const hasChildren = category.children && category.children.length > 0

  return (
    <div style={{ marginLeft: level * 16 }}>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50">
        <button onClick={() => setExpanded(!expanded)} className="w-5 h-5 flex items-center justify-center">
          {hasChildren ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="w-4" />}
        </button>
        <span className="flex-1 text-sm text-foreground">{category.name}</span>
        <span className="text-xs text-muted-foreground">{category._count?.products ?? 0} товаров</span>
        <button onClick={() => onAddChild(category.id)} className="text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={() => onEdit(category.id)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(category.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      {expanded && hasChildren && category.children.map((child: any) => (
        <CategoryNode key={child.id} category={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  )
}

function CategoryFormModal({ editId, parentId, onClose, onSuccess }: {
  editId: string | null; parentId: string | null; onClose: () => void; onSuccess: () => void
}) {
  const { data: allCategories } = trpc.categories.getAll.useQuery()
  const createMut = trpc.categories.create.useMutation({ onSuccess })
  const updateMut = trpc.categories.update.useMutation({ onSuccess })
  const updateImageMut = trpc.categories.updateImagePath.useMutation({ onSuccess })
  const removeImageMut = trpc.categories.removeImage.useMutation({ onSuccess })

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!editId) {
      setName('')
      setSlug('')
      setDescription('')
      return
    }
    const cat = allCategories?.find((c: any) => c.id === editId)
    if (cat) {
      setName(cat.name ?? '')
      setSlug(cat.slug ?? '')
      setDescription(cat.description ?? '')
    }
  }, [editId, allCategories])

  const handleUploadImage = async (file: File) => {
    if (!editId) return
    const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
    const token = await getToken()
    if (!token) throw new Error('Нет токена сессии')

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Upload failed: ${res.status}`)
    }

    const out = await res.json()
    const imagePath = out.path as string | undefined
    const originalName = out.originalName as string | undefined
    if (!imagePath) throw new Error('Upload: не вернулся путь')

    await updateImageMut.mutateAsync({
      categoryId: editId,
      imagePath,
      imageOriginalName: originalName ?? null,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'),
      description: description || undefined,
      parentId: parentId || undefined,
    }
    if (editId) {
      updateMut.mutate({ id: editId, ...data })
    } else {
      createMut.mutate(data as any)
    }
  }

  return (
    <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editId ? 'Редактировать' : 'Новая категория'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Название</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="flex h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit">{editId ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </form>

        {editId && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 text-sm font-medium text-foreground">Изображение категории</div>
            {allCategories?.find((c: any) => c.id === editId)?.imagePath ? (
              <div className="mb-3">
                <img
                  src={allCategories.find((c: any) => c.id === editId).imagePath}
                  alt=""
                  className="h-32 w-32 rounded-lg border border-border object-cover"
                />
              </div>
            ) : (
              <div className="mb-3 text-sm text-muted-foreground">Изображение не загружено</div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
                Загрузить / заменить
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      await handleUploadImage(file)
                    } finally {
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </label>

              {allCategories?.find((c: any) => c.id === editId)?.imagePath && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeImageMut.mutate(editId)}
                  disabled={removeImageMut.isPending}
                >
                  Удалить
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
