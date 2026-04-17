'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
import { Pencil, Trash2, Plus, ChevronRight } from 'lucide-react'
import { generateSlug } from '@/shared/lib/generateSlug'

/** Flexible recursive node used by CategoryNode (deep children may lack _count/children). */
interface CategoryNodeData {
	id: string
	name: string
	slug: string
	description?: string | null
	parentId?: string | null
	imagePath?: string | null
	_count?: { products: number }
	children?: CategoryNodeData[]
}

export default function CategoriesClient() {
	const { data: categories, refetch } = trpc.categories.getTree.useQuery()
	const deleteMut = trpc.categories.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const createMut = trpc.categories.create.useMutation({
		onSuccess: () => {
			refetch()
			setShowForm(false)
		},
	})
	const updateMut = trpc.categories.update.useMutation({
		onSuccess: () => {
			refetch()
			setShowForm(false)
		},
	})
	const updateImageMut = trpc.categories.updateImagePath.useMutation({
		onSuccess: () => refetch(),
	})
	const removeImageMut = trpc.categories.removeImage.useMutation({
		onSuccess: () => refetch(),
	})

	const [showForm, setShowForm] = useState(false)
	const [editCat, setEditCat] = useState<CategoryNodeData | null>(null)
	const [form, setForm] = useState({
		name: '',
		slug: '',
		description: '',
		parentId: '',
	})
	const [slugTouched, setSlugTouched] = useState(false)
	const [pendingImage, setPendingImage] = useState<{
		path: string
		originalName: string
	} | null>(null)

	function openCreate(parentId?: string) {
		setEditCat(null)
		setForm({ name: '', slug: '', description: '', parentId: parentId ?? '' })
		setSlugTouched(false)
		setPendingImage(null)
		setShowForm(true)
	}

	function openEdit(cat: CategoryNodeData) {
		setEditCat(cat)
		setForm({
			name: cat.name,
			slug: cat.slug,
			description: cat.description ?? '',
			parentId: cat.parentId ?? '',
		})
		setSlugTouched(true)
		setPendingImage(null)
		setShowForm(true)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const data = {
			name: form.name,
			slug: form.slug || undefined,
			description: form.description || undefined,
			parentId: form.parentId || undefined,
		}
		if (editCat) {
			updateMut.mutate({ id: editCat.id, ...data })
			return
		}

		createMut.mutate(data, {
			onSuccess: (created) => {
				// bind uploaded image to newly created category
				if (pendingImage?.path) {
					updateImageMut.mutate({
						categoryId: created.id,
						imagePath: pendingImage.path,
						imageOriginalName: pendingImage.originalName,
					})
				}
			},
		})
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Категории
				</h1>
				<Button variant='primary' size='sm' onClick={() => openCreate()}>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{showForm && (
				<div className='rounded-xl border border-border bg-muted/30 p-6'>
					<h3 className='mb-4 font-semibold text-foreground'>
						{editCat ? 'Редактировать' : 'Новая категория'}
					</h3>
					<form onSubmit={handleSubmit} className='grid gap-4 sm:grid-cols-2'>
						<input
							placeholder='Название'
							required
							value={form.name}
							onChange={e => {
								const name = e.target.value
								setForm(f => ({
									...f,
									name,
									slug: slugTouched ? f.slug : generateSlug(name),
								}))
							}}
							className='input-field'
						/>
						<input
							placeholder='Slug'
							required
							value={form.slug}
							onChange={e => {
								setSlugTouched(true)
								setForm(f => ({ ...f, slug: e.target.value }))
							}}
							onBlur={() => {
								if (!form.slug) return
								setSlugTouched(true)
								setForm(f => ({ ...f, slug: generateSlug(f.slug) }))
							}}
							className='input-field'
						/>
						<input
							placeholder='Описание'
							value={form.description}
							onChange={e =>
								setForm(f => ({ ...f, description: e.target.value }))
							}
							className='input-field sm:col-span-2'
						/>
						{editCat && (
							<div className='sm:col-span-2'>
								<FileUploader
									currentImage={editCat.imagePath}
									onUploaded={(filePath, originalName) =>
										updateImageMut.mutate({
											categoryId: editCat.id,
											imagePath: filePath,
											imageOriginalName: originalName,
										})
									}
									onRemove={() => removeImageMut.mutate(editCat.id)}
									isLoading={updateImageMut.isPending || removeImageMut.isPending}
								/>
							</div>
						)}
						{!editCat && (
							<div className='sm:col-span-2'>
								<FileUploader
									currentImage={pendingImage?.path ?? null}
									onUploaded={(filePath, originalName) =>
										setPendingImage({ path: filePath, originalName })
									}
									onRemove={() => setPendingImage(null)}
									isLoading={createMut.isPending || updateImageMut.isPending}
									label='Изображение (необязательно)'
								/>
							</div>
						)}
						<div className='flex gap-2 sm:col-span-2'>
							<Button variant='primary' type='submit' size='sm'>
								Сохранить
							</Button>
							<Button
								variant='outline'
								type='button'
								size='sm'
								onClick={() => setShowForm(false)}
							>
								Отмена
							</Button>
						</div>
					</form>
				</div>
			)}

			{/* Category tree */}
			<div className='space-y-2'>
				{categories?.map(cat => (
					<CategoryNode
						key={cat.id}
						category={cat}
						depth={0}
						onEdit={openEdit}
						onDelete={id => {
							if (confirm('Удалить категорию?')) deleteMut.mutate(id)
						}}
						onAddChild={openCreate}
					/>
				))}
				{!categories?.length && (
					<p className='text-sm text-muted-foreground'>Категорий пока нет</p>
				)}
			</div>
		</div>
	)
}

function CategoryNode({
	category,
	depth,
	onEdit,
	onDelete,
	onAddChild,
}: {
	category: CategoryNodeData
	depth: number
	onEdit: (cat: CategoryNodeData) => void
	onDelete: (id: string) => void
	onAddChild: (parentId: string) => void
}) {
	const [open, setOpen] = useState(true)

	return (
		<div style={{ marginLeft: depth * 24 }}>
			<div className='flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-4 py-2'>
				{(category.children?.length ?? 0) > 0 && (
					<button
						onClick={() => setOpen(o => !o)}
						className='text-muted-foreground'
					>
						<ChevronRight
							className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
						/>
					</button>
				)}
				<span className='flex-1 text-sm font-medium text-foreground'>
					{category.name}
				</span>
				<span className='text-xs text-muted-foreground'>
					{category._count?.products ?? 0} товаров
				</span>
				<button
					onClick={() => onAddChild(category.id)}
					className='text-muted-foreground hover:text-foreground'
				>
					<Plus className='h-3.5 w-3.5' />
				</button>
				<button
					onClick={() => onEdit(category)}
					className='text-muted-foreground hover:text-foreground'
				>
					<Pencil className='h-3.5 w-3.5' />
				</button>
				<button
					onClick={() => onDelete(category.id)}
					className='text-muted-foreground hover:text-destructive'
				>
					<Trash2 className='h-3.5 w-3.5' />
				</button>
			</div>
			{open &&
				category.children?.map((child: CategoryNodeData) => (
					<CategoryNode
						key={child.id}
						category={child}
						depth={depth + 1}
						onEdit={onEdit}
						onDelete={onDelete}
						onAddChild={onAddChild}
					/>
				))}
		</div>
	)
}

