'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { generateSlug } from '@/shared/lib/generateSlug'

type PageItem = RouterOutputs['pages']['getAll'][number]

export default function PagesClient() {
	const { data: pages, refetch } = trpc.pages.getAll.useQuery()
	const deleteMut = trpc.pages.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const updateMut = trpc.pages.update.useMutation({
		onSuccess: () => {
			refetch()
			setShowForm(false)
		},
	})
	const updateImageMut = trpc.pages.updateImagePath.useMutation({
		onSuccess: () => refetch(),
	})
	const removeImageMut = trpc.pages.removeImage.useMutation({
		onSuccess: () => refetch(),
	})

	const [showForm, setShowForm] = useState(false)
	const [editPage, setEditPage] = useState<PageItem | null>(null)
	const [form, setForm] = useState({
		title: '',
		slug: '',
		content: '',
		metaTitle: '',
		metaDesc: '',
		isPublished: false,
	})
	const [slugTouched, setSlugTouched] = useState(false)
	const [pendingImage, setPendingImage] = useState<{
		key: string
		originalName: string
	} | null>(null)

	const createMut = trpc.pages.create.useMutation({
		onSuccess: (created) => {
			if (pendingImage?.key) {
				updateImageMut.mutate({
					pageId: created.id,
					imagePath: pendingImage.key,
					imageOriginalName: pendingImage.originalName,
				})
			}
			refetch()
			setShowForm(false)
		},
	})

	function openCreate() {
		setEditPage(null)
		setForm({
			title: '',
			slug: '',
			content: '',
			metaTitle: '',
			metaDesc: '',
			isPublished: false,
		})
		setSlugTouched(false)
		setPendingImage(null)
		setShowForm(true)
	}

	function openEdit(page: PageItem) {
		setEditPage(page)
		setForm({
			title: page.title,
			slug: page.slug,
			content: page.content ?? '',
			metaTitle: page.metaTitle ?? '',
			metaDesc: page.metaDesc ?? '',
			isPublished: page.isPublished,
		})
		setSlugTouched(true)
		setPendingImage(null)
		setShowForm(true)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const data = {
			title: form.title,
			slug: form.slug,
			content: form.content || undefined,
			metaTitle: form.metaTitle || undefined,
			metaDesc: form.metaDesc || undefined,
			isPublished: form.isPublished,
		}
		if (editPage) {
			updateMut.mutate({ id: editPage.id, ...data })
		} else {
			createMut.mutate(data)
		}
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Страницы
				</h1>
				<Button variant='primary' size='sm' onClick={openCreate}>
					<Plus className='mr-1 h-4 w-4' /> Создать
				</Button>
			</div>

			{showForm && (
				<div className='rounded-xl border border-border bg-muted/30 p-6'>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='grid gap-4 sm:grid-cols-2'>
							<input
								placeholder='Заголовок'
								required
								value={form.title}
								onChange={e => {
									const title = e.target.value
									setForm(f => ({
										...f,
										title,
										slug: slugTouched ? f.slug : generateSlug(title),
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
						</div>
						<textarea
							placeholder='Содержимое (Markdown)'
							value={form.content}
							onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
							rows={10}
							className='input-field w-full resize-none font-mono text-xs'
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<input
								placeholder='Meta Title'
								value={form.metaTitle}
								onChange={e =>
									setForm(f => ({ ...f, metaTitle: e.target.value }))
								}
								className='input-field'
							/>
							<input
								placeholder='Meta Description'
								value={form.metaDesc}
								onChange={e =>
									setForm(f => ({ ...f, metaDesc: e.target.value }))
								}
								className='input-field'
							/>
						</div>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								id='isPublished'
								checked={form.isPublished}
								onChange={e =>
									setForm(f => ({ ...f, isPublished: e.target.checked }))
								}
							/>
							<label htmlFor='isPublished' className='text-sm'>
								Опубликовать
							</label>
						</div>
						{editPage && (
							<FileUploader
								currentImage={editPage.imagePath}
								onUploaded={(key, originalName) =>
									updateImageMut.mutate({
										pageId: editPage.id,
										imagePath: key,
										imageOriginalName: originalName,
									})
								}
								onRemove={() => removeImageMut.mutate(editPage.id)}
								isLoading={updateImageMut.isPending || removeImageMut.isPending}
							/>
						)}
						{!editPage && (
							<FileUploader
								currentImage={pendingImage?.key ?? null}
								onUploaded={(key, originalName) =>
									setPendingImage({ key, originalName })
								}
								onRemove={() => setPendingImage(null)}
								isLoading={createMut.isPending || updateImageMut.isPending}
								label='Изображение (необязательно)'
							/>
						)}
						<div className='flex gap-2'>
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

			<div className='space-y-2'>
				{pages?.map(page => (
					<div
						key={page.id}
						className='flex items-center gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3'
					>
						<div className='flex-1'>
							<div className='flex items-center gap-2'>
								<span className='font-medium text-foreground'>
									{page.title}
								</span>
								{page.isPublished ? (
									<Eye className='h-3.5 w-3.5 text-green-500' />
								) : (
									<EyeOff className='h-3.5 w-3.5 text-muted-foreground' />
								)}
							</div>
							<div className='text-xs text-muted-foreground'>
								/{page.slug} · {page._count?.versions ?? 0} версий ·{' '}
								{page.author?.name ?? page.author?.email ?? '—'}
							</div>
						</div>
						<button
							onClick={() => openEdit(page)}
							className='text-muted-foreground hover:text-foreground'
						>
							<Pencil className='h-4 w-4' />
						</button>
						<button
							onClick={() => {
								if (confirm('Удалить страницу?')) deleteMut.mutate(page.id)
							}}
							className='text-muted-foreground hover:text-destructive'
						>
							<Trash2 className='h-4 w-4' />
						</button>
					</div>
				))}
				{!pages?.length && (
					<p className='text-sm text-muted-foreground'>Страниц пока нет</p>
				)}
			</div>
		</div>
	)
}

