import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { getApiUrl, getToken } from '../lib/store'

export function ProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data, refetch } = trpc.products.getMany.useQuery({
    page, limit: 20, search: search || undefined,
  })
  const deleteMut = trpc.products.delete.useMutation({ onSuccess: () => refetch() })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Товары</h1>
        <Button size="sm" onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      <input
        type="search"
        placeholder="Поиск по названию..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {showForm && (
        <ProductFormModal editId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch() }} />
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Остаток</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((product: any) => (
              <tr key={product.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                <td className="px-4 py-3">{product.price?.toLocaleString('ru-RU')} ₽</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3 text-muted-foreground">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    product.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {product.isActive ? 'Активный' : 'Скрытый'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(product.id); setShowForm(true) }}
                      className="text-muted-foreground hover:text-foreground" aria-label="Редактировать">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm('Удалить товар?')) deleteMut.mutate(product.id) }}
                      className="text-muted-foreground hover:text-destructive" aria-label="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Button>
          <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>→</Button>
        </div>
      )}
    </div>
  )
}

// Product form modal
function ProductFormModal({ editId, onClose, onSuccess }: { editId: string | null; onClose: () => void; onSuccess: () => void }) {
  const { data: categories } = trpc.categories.getAll.useQuery()
  const { data: editProduct } = trpc.products.getById.useQuery(editId!, { enabled: !!editId })

  const createMut = trpc.products.create.useMutation({ onSuccess })
  const updateMut = trpc.products.update.useMutation({ onSuccess })
  const updateImageMut = trpc.products.updateImagePath.useMutation({ onSuccess })
  const removeImageMut = trpc.products.removeImage.useMutation({ onSuccess })

  const initialForm = useMemo(() => ({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '0',
    sku: '',
    categoryId: '',
    brand: '',
    brandCountry: '',
    isActive: true,
  }), [])

  const [form, setForm] = useState(initialForm)

  // Populate form when editing
  useEffect(() => {
    if (!editId) {
      setForm(initialForm)
      return
    }
    if (editProduct) {
      setForm({
        name: editProduct.name ?? '',
        slug: editProduct.slug ?? '',
        description: editProduct.description ?? '',
        price: editProduct.price != null ? String(editProduct.price) : '',
        compareAtPrice: editProduct.compareAtPrice != null ? String(editProduct.compareAtPrice) : '',
        stock: editProduct.stock != null ? String(editProduct.stock) : '0',
        sku: editProduct.sku ?? '',
        categoryId: editProduct.categoryId ?? '',
        brand: editProduct.brand ?? '',
        brandCountry: editProduct.brandCountry ?? '',
        isActive: !!editProduct.isActive,
      })
    }
  }, [editId, editProduct, initialForm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'),
      description: form.description || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
      stock: parseInt(form.stock) || 0,
      sku: form.sku || undefined,
      categoryId: form.categoryId || undefined,
      brand: form.brand || undefined,
      brandCountry: form.brandCountry || undefined,
      isActive: form.isActive,
    }

    if (editId) {
      updateMut.mutate({ id: editId, ...data })
    } else {
      createMut.mutate(data as any)
    }
  }

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
      productId: editId,
      imagePath,
      imageOriginalName: originalName ?? null,
    })
  }

  return (
    <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {editId ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Название" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <Field label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} />
          <Field label="Описание" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Цена" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" />
            <Field label="Старая цена" value={form.compareAtPrice} onChange={v => setForm(f => ({ ...f, compareAtPrice: v }))} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Остаток" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} type="number" />
            <Field label="SKU" value={form.sku} onChange={v => setForm(f => ({ ...f, sku: v }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Категория</label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Без категории</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="Бренд" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} />
          <Field label="Страна бренда" value={form.brandCountry} onChange={v => setForm(f => ({ ...f, brandCountry: v }))} />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Активный
          </label>

          {editId && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">Фото товара</div>
              {editProduct?.imagePath ? (
                <div className="mb-3">
                  <img
                    src={editProduct.imagePath}
                    alt=""
                    className="h-32 w-32 rounded-lg border border-border object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 text-sm text-muted-foreground">Фото не загружено</div>
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

                {editProduct?.imagePath && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeImageMut.mutate(editId)}
                    disabled={removeImageMut.isPending}
                  >
                    Удалить фото
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; textarea?: boolean
}) {
  const cls = "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={`${cls} h-24 resize-none`} required={required} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} required={required} />
      )}
    </div>
  )
}
