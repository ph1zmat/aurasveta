import { useEffect, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import {
Plus,
Pencil,
Trash2,
X,
ImagePlus,
Trash,
FolderTree,
Package,
ChevronLeft,
ArrowRight,
} from 'lucide-react'
import { getApiUrl, getToken, useApiBaseUrl, resolveImgUrl } from '../lib/store'

export function CategoriesPage() {
const [selectedId, setSelectedId] = useState<string | null>(null)

if (selectedId) {
return (
<CategoryDetailView
categoryId={selectedId}
onBack={() => setSelectedId(null)}
/>
)
}

return <CategoriesGrid onSelect={setSelectedId} />
}

/* --- Grid of root categories --- */

function CategoriesGrid({ onSelect }: { onSelect: (id: string) => void }) {
const { data: tree, refetch } = trpc.categories.getTree.useQuery()
const [showForm, setShowForm] = useState(false)

return (
<div className='space-y-5'>
<div className='flex items-center justify-between'>
<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
Категории
</h1>
<Button
size='sm'
onClick={() => setShowForm(true)}
>
<Plus className='mr-1 h-4 w-4' /> Добавить
</Button>
</div>

{showForm && (
<CategoryFormModal
editId={null}
parentId={null}
onClose={() => setShowForm(false)}
onSuccess={() => {
setShowForm(false)
refetch()
}}
/>
)}

{tree && tree.length > 0 ? (
<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
{tree.map((cat: any) => (
<CategoryCard
key={cat.id}
category={cat}
onClick={() => onSelect(cat.id)}
/>
))}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
<FolderTree className='mb-3 h-10 w-10 text-muted-foreground/30' />
<p className='text-sm text-muted-foreground'>Нет категорий</p>
</div>
)}
</div>
)
}

/* --- Category card --- */

function CategoryCard({
category,
onClick,
onEdit,
onDelete,
}: {
category: any
onClick?: () => void
onEdit?: () => void
onDelete?: () => void
}) {
const apiBaseUrl = useApiBaseUrl()
const productCount = category._count?.products ?? 0
const childrenCount = category.children?.length ?? 0

return (
<div className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/30'>
{/* Image */}
<div className='aspect-4/3 w-full bg-muted/30'>
{category.imagePath ? (
<img
src={resolveImgUrl(category.imagePath, apiBaseUrl)}
alt={category.name}
className='h-full w-full object-cover'
/>
) : (
<div className='flex h-full w-full items-center justify-center'>
<FolderTree className='h-10 w-10 text-muted-foreground/20' />
</div>
)}
</div>

{/* Info */}
<div className='flex flex-1 flex-col gap-2 p-3'>
<span className='text-sm font-semibold leading-tight text-foreground line-clamp-2'>
{category.name}
</span>

<div className='mt-auto flex items-center gap-3 text-[11px] text-muted-foreground'>
{productCount > 0 && (
<span className='flex items-center gap-1'>
<Package className='h-3 w-3' />
{productCount}
</span>
)}
{childrenCount > 0 && (
<span className='flex items-center gap-1'>
<FolderTree className='h-3 w-3' />
{childrenCount}
</span>
)}
</div>

{/* Actions */}
<div className='flex gap-1.5'>
{onClick && (
<button
onClick={onClick}
className='flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
>
Открыть
<ArrowRight className='h-3 w-3' />
</button>
)}
{onEdit && (
<button
onClick={onEdit}
className='rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
>
<Pencil className='h-3.5 w-3.5' />
</button>
)}
{onDelete && (
<button
onClick={onDelete}
className='rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
>
<Trash2 className='h-3.5 w-3.5' />
</button>
)}
</div>
</div>
</div>
)
}

/* --- Category detail view --- */

function CategoryDetailView({
categoryId,
onBack,
}: {
categoryId: string
onBack: () => void
}) {
const { data: allCategories, refetch } = trpc.categories.getAll.useQuery()
const { data: tree, refetch: refetchTree } = trpc.categories.getTree.useQuery()
const deleteMut = trpc.categories.delete.useMutation({
onSuccess: () => {
refetch()
refetchTree()
},
})

const [showEditModal, setShowEditModal] = useState(false)
const [showAddChild, setShowAddChild] = useState(false)
const [editChildId, setEditChildId] = useState<string | null>(null)

const findInTree = (nodes: any[], id: string): any | null => {
for (const n of nodes) {
if (n.id === id) return n
if (n.children) {
const found = findInTree(n.children, id)
if (found) return found
}
}
return null
}

const category = tree ? findInTree(tree, categoryId) : null
const flatCat = allCategories?.find((c: any) => c.id === categoryId)
const children = category?.children ?? []

const updateImageMut = trpc.categories.updateImagePath.useMutation({
onSuccess: () => {
refetch()
refetchTree()
},
})
const removeImageMut = trpc.categories.removeImage.useMutation({
onSuccess: () => {
refetch()
refetchTree()
},
})
const apiBaseUrl = useApiBaseUrl()

const handleUploadImage = async (file: File) => {
const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
const token = await getToken()
if (!token) throw new Error('No token')

const fd = new FormData()
fd.append('file', file)

const res = await fetch(`${apiUrl}/api/upload`, {
method: 'POST',
headers: { Authorization: `Bearer ${token}` },
body: fd,
})

if (!res.ok) {
const body = await res.json().catch(() => null)
throw new Error(body?.error ?? `Upload failed: ${res.status}`)
}

const out = await res.json()
const imagePath = out.path as string | undefined
const originalName = out.originalName as string | undefined
if (!imagePath) throw new Error('Upload: path missing')

await updateImageMut.mutateAsync({
categoryId,
imagePath,
imageOriginalName: originalName ?? null,
})
}

if (!category && !flatCat) {
return (
<div className='space-y-5'>
<button
onClick={onBack}
className='flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
>
<ChevronLeft className='h-4 w-4' />
Назад
</button>
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
<p className='text-sm text-muted-foreground'>Категория не найдена</p>
</div>
</div>
)
}

const cat = category || flatCat
const productCount = cat?._count?.products ?? 0

return (
<div className='space-y-6'>
{/* Breadcrumb */}
<div className='flex items-center gap-2'>
<button
onClick={onBack}
className='flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
>
<ChevronLeft className='h-4 w-4' />
Все категории
</button>
</div>

{/* Category info card */}
<div className='overflow-hidden rounded-2xl border border-border bg-muted/10'>
<div className='flex gap-6 p-6'>
{/* Image */}
<div className='group relative h-40 w-40 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center'>
{cat?.imagePath ? (
<>
<img
src={resolveImgUrl(cat.imagePath, apiBaseUrl)}
alt=''
className='h-full w-full object-cover'
/>
<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
<label className='cursor-pointer rounded-lg bg-white/10 p-2.5 text-white backdrop-blur-sm hover:bg-white/20'>
<ImagePlus className='h-5 w-5' />
<input
type='file'
accept='image/*'
className='hidden'
onChange={async e => {
const input = e.currentTarget
const file = input.files?.[0]
if (!file) return
try {
await handleUploadImage(file)
} finally {
input.value = ''
}
}}
/>
</label>
<button
type='button'
onClick={() => removeImageMut.mutate(categoryId)}
disabled={removeImageMut.isPending}
className='rounded-lg bg-white/10 p-2.5 text-white backdrop-blur-sm hover:bg-red-500/60'
>
<Trash className='h-5 w-5' />
</button>
</div>
</>
) : (
<label className='flex cursor-pointer flex-col items-center gap-2 text-muted-foreground hover:text-foreground'>
<ImagePlus className='h-8 w-8' />
<span className='text-xs'>Загрузить фото</span>
<input
type='file'
accept='image/*'
className='hidden'
onChange={async e => {
const input = e.currentTarget
const file = input.files?.[0]
if (!file) return
try {
await handleUploadImage(file)
} finally {
input.value = ''
}
}}
/>
</label>
)}
</div>

{/* Info */}
<div className='flex flex-1 flex-col gap-3'>
<div>
<h2 className='text-2xl font-bold text-foreground'>
{cat?.name}
</h2>
<p className='mt-0.5 font-mono text-xs text-muted-foreground'>
/{cat?.slug}
</p>
</div>

{cat?.description && (
<p className='text-sm leading-relaxed text-muted-foreground'>
{cat.description}
</p>
)}

<div className='mt-auto flex items-center gap-4'>
{productCount > 0 && (
<span className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
<Package className='h-3 w-3' />
{productCount} товаров
</span>
)}
<span className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
<FolderTree className='h-3 w-3' />
{children.length} подкатегорий
</span>
</div>

<div className='flex gap-2'>
<Button
size='sm'
variant='ghost'
onClick={() => setShowEditModal(true)}
>
<Pencil className='mr-1.5 h-3.5 w-3.5' />
Редактировать
</Button>
<Button
size='sm'
variant='ghost'
onClick={() => {
if (confirm('Удалить категорию и все подкатегории?')) {
deleteMut.mutate(categoryId)
onBack()
}
}}
className='text-destructive hover:text-destructive'
>
<Trash2 className='mr-1.5 h-3.5 w-3.5' />
Удалить
</Button>
</div>
</div>
</div>
</div>

{/* Subcategories */}
<div className='space-y-4'>
<div className='flex items-center justify-between'>
<h3 className='text-base font-semibold text-foreground'>
Подкатегории
</h3>
<Button
size='sm'
onClick={() => {
setEditChildId(null)
setShowAddChild(true)
}}
>
<Plus className='mr-1 h-4 w-4' /> Добавить
</Button>
</div>

{children.length > 0 ? (
<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
{children.map((child: any) => (
<CategoryCard
key={child.id}
category={child}
onEdit={() => {
setEditChildId(child.id)
setShowAddChild(true)
}}
onDelete={() => {
if (confirm('Удалить подкатегорию?')) {
deleteMut.mutate(child.id)
}
}}
/>
))}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
<FolderTree className='mb-2 h-8 w-8 text-muted-foreground/20' />
<p className='text-sm text-muted-foreground'>
Нет подкатегорий
</p>
</div>
)}
</div>

{showEditModal && (
<CategoryFormModal
editId={categoryId}
parentId={null}
onClose={() => setShowEditModal(false)}
onSuccess={() => {
setShowEditModal(false)
refetch()
refetchTree()
}}
/>
)}

{showAddChild && (
<CategoryFormModal
editId={editChildId}
parentId={editChildId ? null : categoryId}
onClose={() => setShowAddChild(false)}
onSuccess={() => {
setShowAddChild(false)
refetch()
refetchTree()
}}
/>
)}
</div>
)
}

/* --- Category form modal --- */

function CategoryFormModal({
editId,
parentId,
onClose,
onSuccess,
}: {
editId: string | null
parentId: string | null
onClose: () => void
onSuccess: () => void
}) {
const { data: allCategories } = trpc.categories.getAll.useQuery()
const utils = trpc.useUtils()
const createMut = trpc.categories.create.useMutation({ onSuccess })
const updateMut = trpc.categories.update.useMutation({ onSuccess })
const updateImageMut = trpc.categories.updateImagePath.useMutation({
onSuccess: () => utils.categories.getAll.invalidate(),
})
const removeImageMut = trpc.categories.removeImage.useMutation({
onSuccess: () => utils.categories.getAll.invalidate(),
})
const apiBaseUrl = useApiBaseUrl()

const [name, setName] = useState('')
const [slug, setSlug] = useState('')
const [description, setDescription] = useState('')
const [uploadError, setUploadError] = useState<string | null>(null)

const editCat = allCategories?.find((c: any) => c.id === editId)

useEffect(() => {
if (!editId) {
setName('')
setSlug('')
setDescription('')
return
}
if (editCat) {
setName(editCat.name ?? '')
setSlug(editCat.slug ?? '')
setDescription(editCat.description ?? '')
}
}, [editId, editCat])

const handleUploadImage = async (file: File) => {
if (!editId) return
setUploadError(null)
const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
const token = await getToken()
if (!token) throw new Error('No token')

const fd = new FormData()
fd.append('file', file)

const res = await fetch(`${apiUrl}/api/upload`, {
method: 'POST',
headers: { Authorization: `Bearer ${token}` },
body: fd,
})

if (!res.ok) {
const body = await res.json().catch(() => null)
const msg = body?.error ?? `Upload failed: ${res.status}`
setUploadError(msg)
throw new Error(msg)
}

const out = await res.json()
const imagePath = out.path as string | undefined
const originalName = out.originalName as string | undefined
if (!imagePath) throw new Error('Upload: path missing')

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

const inputCls =
'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

return (
<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
<div className='flex w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
{/* Header */}
<div className='flex items-center justify-between border-b border-border px-6 py-4'>
<h2 className='text-lg font-semibold text-foreground'>
{editId ? 'Редактировать категорию' : 'Новая категория'}
</h2>
<button
onClick={onClose}
className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
>
<X className='h-5 w-5' />
</button>
</div>

{/* Body */}
<form
onSubmit={handleSubmit}
className='flex-1 overflow-y-auto px-6 py-5 space-y-5'
>
{/* Image + Name row */}
<div className='flex gap-5'>
<div className='relative group h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center'>
{editId && editCat?.imagePath ? (
<>
<img
src={resolveImgUrl(editCat.imagePath, apiBaseUrl)}
alt=''
className='h-full w-full object-cover'
/>
<div className='absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
<label className='cursor-pointer rounded-lg bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20'>
<ImagePlus className='h-4 w-4' />
<input
type='file'
accept='image/*'
className='hidden'
onChange={async e => {
const input = e.currentTarget
const file = input.files?.[0]
if (!file) return
try {
await handleUploadImage(file)
} finally {
input.value = ''
}
}}
/>
</label>
<button
type='button'
onClick={() => removeImageMut.mutate(editId!)}
disabled={removeImageMut.isPending}
className='rounded-lg bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-red-500/60'
>
<Trash className='h-4 w-4' />
</button>
</div>
</>
) : editId ? (
<label className='flex cursor-pointer flex-col items-center gap-1 text-muted-foreground hover:text-foreground'>
<ImagePlus className='h-6 w-6' />
<span className='text-[10px]'>Загрузить</span>
<input
type='file'
accept='image/*'
className='hidden'
onChange={async e => {
const input = e.currentTarget
const file = input.files?.[0]
if (!file) return
try {
await handleUploadImage(file)
} finally {
input.value = ''
}
}}
/>
</label>
) : (
<div className='flex flex-col items-center gap-1 text-muted-foreground'>
<ImagePlus className='h-6 w-6 opacity-40' />
<span className='text-[10px]'>Сохраните</span>
</div>
)}
</div>
{uploadError && (
<p className='text-[10px] text-red-500 text-center leading-tight'>{uploadError}</p>
)}

<div className='flex flex-1 flex-col gap-3'>
<div>
<label className='mb-1 block text-xs font-medium text-muted-foreground'>
Название
</label>
<input
value={name}
onChange={e => setName(e.target.value)}
required
placeholder='Название категории'
className={inputCls}
/>
</div>
<div>
<label className='mb-1 block text-xs font-medium text-muted-foreground'>
Slug
</label>
<input
value={slug}
onChange={e => setSlug(e.target.value)}
placeholder='auto-generated'
className={inputCls}
/>
</div>
</div>
</div>

{/* Description */}
<div>
<label className='mb-1 block text-xs font-medium text-muted-foreground'>
Описание
</label>
<textarea
value={description}
onChange={e => setDescription(e.target.value)}
placeholder='Описание категории...'
rows={3}
className='flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary'
/>
</div>
</form>

{/* Footer */}
<div className='flex justify-end gap-2 border-t border-border px-6 py-4'>
<Button variant='ghost' type='button' onClick={onClose}>
Отмена
</Button>
<Button
type='submit'
disabled={createMut.isPending || updateMut.isPending}
onClick={handleSubmit}
>
{editId ? 'Сохранить' : 'Создать'}
</Button>
</div>
</div>
</div>
)
}