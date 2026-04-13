import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { getApiUrl, getToken } from '../lib/store'

export function PagesPage() {
  const { data: pages, refetch } = trpc.pages.getAll.useQuery()
  const deleteMut = trpc.pages.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Страницы</h1>
        <Button size="sm" onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      {showForm && (
        <PageFormModal editId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch() }} />
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Заголовок</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {pages?.map((page: any) => (
              <tr key={page.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-foreground">{page.title}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    page.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {page.isPublished ? 'Опубликовано' : 'Черновик'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(page.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(page.id); setShowForm(true) }}
                      className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm('Удалить?')) deleteMut.mutate(page.id) }}
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

function PageFormModal({ editId, onClose, onSuccess }: { editId: string | null; onClose: () => void; onSuccess: () => void }) {
  const { data: editPage } = trpc.pages.getById.useQuery(editId!, { enabled: !!editId })
  const createMut = trpc.pages.create.useMutation({ onSuccess })
  const updateMut = trpc.pages.update.useMutation({ onSuccess })
  const updateImageMut = trpc.pages.updateImagePath.useMutation({ onSuccess })
  const removeImageMut = trpc.pages.removeImage.useMutation({ onSuccess })

  const emptyForm = useMemo(() => ({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDesc: '',
    isPublished: false,
  }), [])

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!editId) {
      setForm(emptyForm)
      return
    }
    if (editPage) {
      setForm({
        title: editPage.title ?? '',
        slug: editPage.slug ?? '',
        content: editPage.content ?? '',
        metaTitle: editPage.metaTitle ?? '',
        metaDesc: editPage.metaDesc ?? '',
        isPublished: !!editPage.isPublished,
      })
    }
  }, [editId, editPage, emptyForm])

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
      pageId: editId,
      imagePath,
      imageOriginalName: originalName ?? null,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'),
      content: form.content || undefined,
      metaTitle: form.metaTitle || undefined,
      metaDesc: form.metaDesc || undefined,
      isPublished: form.isPublished,
    }
    if (editId) updateMut.mutate({ id: editId, ...data })
    else createMut.mutate(data as any)
  }

  return (
    <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editId ? 'Редактировать' : 'Новая страница'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Заголовок</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Slug</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Контент</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8}
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Meta Title</label>
            <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Meta Description</label>
            <textarea value={form.metaDesc} onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))} rows={2}
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
            Опубликовано
          </label>

          {editId && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">Изображение страницы</div>
              {editPage?.imagePath ? (
                <div className="mb-3">
                  <img
                    src={editPage.imagePath}
                    alt=""
                    className="h-32 w-full max-w-[240px] rounded-lg border border-border object-cover"
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
                {editPage?.imagePath && (
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

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit">{editId ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
