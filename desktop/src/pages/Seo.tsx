import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Search, Save } from 'lucide-react'

type TargetType = 'product' | 'category' | 'page'

const STATIC_PAGES: Array<{ id: string; label: string; targetType: TargetType }> = [
  { id: 'home', label: 'Главная страница', targetType: 'page' },
]

function SeoEditor({ targetType, targetId }: { targetType: TargetType; targetId: string }) {
  const { data, isLoading } = trpc.seo.getByTarget.useQuery({ targetType, targetId })
  const updateMut = trpc.seo.update.useMutation()

  const empty = useMemo(
    () => ({
      title: '',
      description: '',
      keywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      canonicalUrl: '',
      noIndex: false,
    }),
    [],
  )

  const [form, setForm] = useState(empty)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) {
      setForm(empty)
      return
    }
    setForm({
      title: data.title ?? '',
      description: data.description ?? '',
      keywords: data.keywords ?? '',
      ogTitle: data.ogTitle ?? '',
      ogDescription: data.ogDescription ?? '',
      ogImage: data.ogImage ?? '',
      canonicalUrl: data.canonicalUrl ?? '',
      noIndex: !!data.noIndex,
    })
  }, [data, empty])

  const onSave = async () => {
    setSaved(false)
    await updateMut.mutateAsync({
      targetType,
      targetId,
      title: form.title || null,
      description: form.description || null,
      keywords: form.keywords || null,
      ogTitle: form.ogTitle || null,
      ogDescription: form.ogDescription || null,
      ogImage: form.ogImage || null,
      canonicalUrl: form.canonicalUrl || null,
      noIndex: form.noIndex,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
        <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
        <Field label="Keywords" value={form.keywords} onChange={v => setForm(f => ({ ...f, keywords: v }))} />
        <Field label="Canonical URL" value={form.canonicalUrl} onChange={v => setForm(f => ({ ...f, canonicalUrl: v }))} />
        <Field label="OG Title" value={form.ogTitle} onChange={v => setForm(f => ({ ...f, ogTitle: v }))} />
        <Field label="OG Description" value={form.ogDescription} onChange={v => setForm(f => ({ ...f, ogDescription: v }))} />
        <Field label="OG Image" value={form.ogImage} onChange={v => setForm(f => ({ ...f, ogImage: v }))} />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.noIndex}
          onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))}
        />
        noIndex
      </label>

      <div className="mt-4 flex items-center justify-end gap-2">
        {isLoading && <span className="text-xs text-muted-foreground">Загрузка…</span>}
        {saved && <span className="text-xs text-muted-foreground">✓ Сохранено</span>}
        <Button onClick={onSave} disabled={updateMut.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Сохранить
        </Button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

export function SeoPage() {
  const { data: pages } = trpc.pages.getAll.useQuery()
  const { data: categories } = trpc.categories.getTree.useQuery()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">SEO</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Статические страницы</h2>
        {STATIC_PAGES.map(p => (
          <div key={p.id} className="space-y-2">
            <div className="text-sm font-medium text-foreground">{p.label}</div>
            <SeoEditor targetType={p.targetType} targetId={p.id} />
          </div>
        ))}
      </section>

      {pages && pages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">CMS страницы</h2>
          {pages.map((p: any) => (
            <div key={p.id} className="space-y-2">
              <div className="text-sm font-medium text-foreground">{p.title}</div>
              <SeoEditor targetType="page" targetId={p.id} />
            </div>
          ))}
        </section>
      )}

      {categories && categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Категории</h2>
          {categories.map((c: any) => (
            <div key={c.id} className="space-y-2">
              <div className="text-sm font-medium text-foreground">{c.name}</div>
              <SeoEditor targetType="category" targetId={c.id} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

