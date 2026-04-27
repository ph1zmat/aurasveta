'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import FileUploader from '@/shared/ui/FileUploader'
import {
	Plus,
	Pencil,
	Trash2,
	X,
	FileText,
	Calendar,
	Code2,
	ChevronDown,
	ChevronUp,
} from 'lucide-react'
import { generateSlug } from '@/shared/lib/generateSlug'

type PageItem = RouterOutputs['pages']['getAll'][number]

export default function PagesClient() {
	const { data: pages, refetch } = trpc.pages.getAll.useQuery()
	const deleteMut = trpc.pages.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [search, setSearch] = useState('')

	const filtered = useMemo(() => {
		if (!pages) return []
		if (!search) return pages
		const q = search.toLowerCase()
		return pages.filter(
			(p: PageItem) =>
				p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q),
		)
	}, [pages, search])

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Страницы
				</h1>
				<button
					onClick={() => {
						setEditId(null)
						setShowForm(true)
					}}
					className='flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
				>
					<Plus className='h-4 w-4' /> Добавить
				</button>
			</div>

			{pages && pages.length > 4 && (
				<input
					type='search'
					placeholder='Поиск страниц...'
					value={search}
					onChange={e => setSearch(e.target.value)}
					className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
			)}

			{showForm && (
				<PageFormModal
					editId={editId}
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
						refetch()
					}}
				/>
			)}

			{filtered.length > 0 ? (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{filtered.map((page: PageItem) => {
						const contentPreview = page.content
							? page.content.slice(0, 120) +
								(page.content.length > 120 ? '...' : '')
							: null

						return (
							<div
								key={page.id}
								className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/30'
							>
								{/* Cover or placeholder */}
								{page.imagePath ? (
									<div className='relative h-32 w-full'>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={`/api/storage/file?key=${page.imagePath}`}
											alt={page.title ?? 'Обложка'}
											className='h-full w-full object-cover'
										/>
										<div className='absolute inset-0 bg-linear-to-t from-black/40 to-transparent' />
										<div
											className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-white/30 ${
												page.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
											}`}
											title={page.isPublished ? 'Опубликовано' : 'Черновик'}
										/>
									</div>
								) : (
									<div className='relative flex h-20 w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted/20'>
										<FileText className='h-8 w-8 text-muted-foreground/20' />
										<div
											className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
												page.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
											}`}
											title={page.isPublished ? 'Опубликовано' : 'Черновик'}
										/>
									</div>
								)}

								{/* Hover actions */}
								<div className='absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
									<button
										onClick={() => {
											setEditId(page.id)
											setShowForm(true)
										}}
										className='rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60'
									>
										<Pencil className='h-3.5 w-3.5' />
									</button>
									<button
										onClick={() => {
											if (confirm('Удалить страницу?'))
												deleteMut.mutate(page.id)
										}}
										className='rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/70'
									>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</div>

								{/* Info */}
								<div className='flex flex-1 flex-col gap-2 p-4'>
									<div className='line-clamp-2 text-sm font-semibold leading-tight text-foreground'>
										{page.title}
									</div>
									<div className='font-mono text-[11px] text-muted-foreground'>
										/{page.slug}
									</div>
									{contentPreview && (
										<p className='mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground'>
											{contentPreview}
										</p>
									)}
									<div className='mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground'>
										<Calendar className='h-3 w-3' />
										{new Date(page.createdAt).toLocaleDateString('ru-RU', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<FileText className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='text-sm text-muted-foreground'>
						{search ? 'Страницы не найдены' : 'Нет страниц'}
					</p>
				</div>
			)}
		</div>
	)
}

/* ============ Page Form Modal ============ */

function PageFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const { data: pages, refetch: refetchPages } = trpc.pages.getAll.useQuery()

	const editPage = useMemo(
		() =>
			editId && pages
				? (pages.find((p: PageItem) => p.id === editId) ?? null)
				: null,
		[editId, pages],
	)

	const createMut = trpc.pages.create.useMutation({ onSuccess })
	const updateMut = trpc.pages.update.useMutation({ onSuccess })
	const updateImageMut = trpc.pages.updateImagePath.useMutation({
		onSuccess: () => refetchPages(),
	})
	const removeImageMut = trpc.pages.removeImage.useMutation({
		onSuccess: () => refetchPages(),
	})

	const [form, setForm] = useState({
		title: editPage?.title ?? '',
		slug: editPage?.slug ?? '',
		content: editPage?.content ?? '',
		contentBlocks: JSON.stringify(editPage?.contentBlocks ?? [], null, 2),
		seo: JSON.stringify(editPage?.seo ?? {}, null, 2),
		metaTitle: editPage?.metaTitle ?? '',
		metaDesc: editPage?.metaDesc ?? '',
		isPublished: editPage?.isPublished ?? false,
		showAsBanner: editPage?.showAsBanner ?? false,
		bannerLink: editPage?.bannerLink ?? '',
		isSystem: editPage?.isSystem ?? false,
	})
	const [slugTouched, setSlugTouched] = useState(!!editId)
	const [jsonError, setJsonError] = useState<string | null>(null)
	const [showAdvancedBlocks, setShowAdvancedBlocks] = useState(false)
	const [pendingImage, setPendingImage] = useState<{
		key: string
		originalName: string
	} | null>(null)

	const inputCls =
		'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		let parsedBlocks: Array<Record<string, unknown>>
		let parsedSeo: Record<string, unknown>
		try {
			parsedBlocks = JSON.parse(form.contentBlocks || '[]')
			parsedSeo = JSON.parse(form.seo || '{}')
			setJsonError(null)
		} catch {
			setJsonError('Некорректный JSON в Content blocks или SEO')
			return
		}

		const data = {
			title: form.title,
			slug: form.slug || generateSlug(form.title),
			content: form.content || undefined,
			contentBlocks: parsedBlocks,
			seo: parsedSeo,
			metaTitle: form.metaTitle || undefined,
			metaDesc: form.metaDesc || undefined,
			isPublished: form.isPublished,
			showAsBanner: form.showAsBanner,
			bannerLink: form.bannerLink || undefined,
			isSystem: form.isSystem,
		}
		if (editId) {
			updateMut.mutate({ id: editId, ...data })
		} else {
			createMut.mutate(data, {
				onSuccess: (created: any) => {
					if (pendingImage?.key) {
						updateImageMut.mutate({
							pageId: created.id,
							imagePath: pendingImage.key,
							imageOriginalName: pendingImage.originalName,
						})
					}
					onSuccess()
				},
			})
		}
	}

	return (
		<div className='fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm'>
			<div className='my-8 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>
						{editId ? 'Редактировать страницу' : 'Новая страница'}
					</h2>
					<button
						onClick={onClose}
						className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Body */}
				<form onSubmit={handleSubmit} className='space-y-4 p-6'>
					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Заголовок <span className='text-destructive'>*</span>
							</label>
							<input
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
								className={inputCls}
								placeholder='Заголовок страницы'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Slug <span className='text-destructive'>*</span>
							</label>
							<input
								required
								value={form.slug}
								onChange={e => {
									setSlugTouched(true)
									setForm(f => ({ ...f, slug: e.target.value }))
								}}
								onBlur={() => {
									if (form.slug)
										setForm(f => ({ ...f, slug: generateSlug(f.slug) }))
								}}
								className={inputCls}
								placeholder='page-slug'
							/>
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Содержимое (HTML/Markdown)
						</label>
						<textarea
							value={form.content}
							onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
							rows={8}
							className='flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
							placeholder='<h2>Заголовок</h2>'
						/>
					</div>

					{/* Content blocks — скрыт за расширенным режимом */}
					<div>
						<button
							type='button'
							onClick={() => setShowAdvancedBlocks(v => !v)}
							className='flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							<Code2 className='h-3.5 w-3.5' />
							Блоки контента (расширенный режим)
							{showAdvancedBlocks ? (
								<ChevronUp className='h-3 w-3' />
							) : (
								<ChevronDown className='h-3 w-3' />
							)}
						</button>
						{showAdvancedBlocks && (
							<div className='mt-2 rounded-xl border border-amber-300/40 bg-amber-500/5 p-3'>
								<p className='mb-2 text-[10px] font-medium text-amber-700 dark:text-amber-400'>
									⚠ Content blocks — техническое поле для разработчиков.
									Редактирование в JSON формате.
								</p>
								<textarea
									value={form.contentBlocks}
									onChange={e => {
										setForm(f => ({ ...f, contentBlocks: e.target.value }))
										if (jsonError) setJsonError(null)
									}}
									rows={8}
									className='flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
									placeholder='[{"type":"heading","data":{"text":"Заголовок","level":2}}]'
								/>
								{jsonError && (
									<p className='mt-1 text-xs text-destructive'>{jsonError}</p>
								)}
							</div>
						)}
					</div>

					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Meta Title
							</label>
							<input
								value={form.metaTitle}
								onChange={e =>
									setForm(f => ({ ...f, metaTitle: e.target.value }))
								}
								className={inputCls}
								placeholder='SEO заголовок'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Meta Description
							</label>
							<input
								value={form.metaDesc}
								onChange={e =>
									setForm(f => ({ ...f, metaDesc: e.target.value }))
								}
								className={inputCls}
								placeholder='SEO описание'
							/>
						</div>
					</div>

					<FileUploader
						currentImage={editPage?.imagePath ?? pendingImage?.key ?? null}
						onUploaded={(key, originalName) => {
							if (editId) {
								updateImageMut.mutate({
									pageId: editId,
									imagePath: key,
									imageOriginalName: originalName,
								})
							} else {
								setPendingImage({ key, originalName })
							}
						}}
						onRemove={() => {
							if (editId) removeImageMut.mutate(editId)
							else setPendingImage(null)
						}}
						isLoading={updateImageMut.isPending || removeImageMut.isPending}
						label='Обложка страницы'
					/>

					<div className='grid gap-4 sm:grid-cols-2'>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								id='isPublished'
								checked={form.isPublished}
								onChange={e =>
									setForm(f => ({ ...f, isPublished: e.target.checked }))
								}
								className='h-4 w-4 rounded border-border'
							/>
							<label htmlFor='isPublished' className='text-sm text-foreground'>
								Опубликовать
							</label>
						</div>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								id='showAsBanner'
								checked={form.showAsBanner}
								onChange={e =>
									setForm(f => ({ ...f, showAsBanner: e.target.checked }))
								}
								className='h-4 w-4 rounded border-border'
							/>
							<label htmlFor='showAsBanner' className='text-sm text-foreground'>
								Показывать как баннер
							</label>
						</div>
						<div className='flex items-center gap-2 sm:col-span-2'>
							<input
								type='checkbox'
								id='isSystem'
								checked={form.isSystem}
								onChange={e =>
									setForm(f => ({ ...f, isSystem: e.target.checked }))
								}
								className='h-4 w-4 rounded border-border'
							/>
							<label htmlFor='isSystem' className='text-sm text-foreground'>
								Системная страница
							</label>
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Banner link
						</label>
						<input
							value={form.bannerLink}
							onChange={e =>
								setForm(f => ({ ...f, bannerLink: e.target.value }))
							}
							className={inputCls}
							placeholder='/pages/welcome'
						/>
					</div>

					<div className='flex justify-end gap-2 pt-2'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							Отмена
						</button>
						<button
							type='submit'
							disabled={createMut.isPending || updateMut.isPending}
							className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
						>
							{createMut.isPending || updateMut.isPending
								? 'Сохранение...'
								: 'Сохранить'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
