import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Pencil, Trash2, X, ImagePlus, Trash, FileText, Calendar } from 'lucide-react'
import { getApiUrl, getToken } from '../lib/store'

export function PagesPage() {
	const { data: pages, refetch } = trpc.pages.getAll.useQuery()
	const deleteMut = trpc.pages.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [search, setSearch] = useState('')

	const filtered = pages?.filter(
		(p: any) =>
			!search ||
			p.title?.toLowerCase().includes(search.toLowerCase()) ||
			p.slug?.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Страницы
				</h1>
				<Button
					size='sm'
					onClick={() => {
						setEditId(null)
						setShowForm(true)
					}}
				>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
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

			{filtered && filtered.length > 0 ? (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{filtered.map((page: any) => {
						const contentPreview = page.content
							? page.content.slice(0, 120) + (page.content.length > 120 ? '...' : '')
							: null

						return (
							<div
								key={page.id}
								className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/30'
							>
								{/* Cover image or gradient header */}
								{page.imagePath ? (
									<div className='relative h-32 w-full'>
										<img
											src={page.imagePath}
											alt=''
											className='h-full w-full object-cover'
										/>
										<div className='absolute inset-0 bg-linear-to-t from-black/40 to-transparent' />
										{/* Status dot over image */}
										<div
											className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-white/30 ${
												page.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
											}`}
											title={
												page.isPublished ? 'Опубликовано' : 'Черновик'
											}
										/>
									</div>
								) : (
									<div className='relative flex h-20 w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted/20'>
										<FileText className='h-8 w-8 text-muted-foreground/20' />
										<div
											className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
												page.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
											}`}
											title={
												page.isPublished ? 'Опубликовано' : 'Черновик'
											}
										/>
									</div>
								)}

								{/* Actions (hover) */}
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
											if (confirm('Удалить?'))
												deleteMut.mutate(page.id)
										}}
										className='rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/70'
									>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</div>

								{/* Content area */}
								<div className='flex flex-1 flex-col gap-2 p-4'>
									<div className='text-sm font-semibold leading-tight text-foreground line-clamp-2'>
										{page.title}
									</div>
									<div className='font-mono text-[11px] text-muted-foreground'>
										/{page.slug}
									</div>
									{contentPreview && (
										<p className='mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3'>
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

function PageFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const { data: editPage } = trpc.pages.getById.useQuery(editId!, {
		enabled: !!editId,
	})
	const createMut = trpc.pages.create.useMutation({ onSuccess })
	const updateMut = trpc.pages.update.useMutation({ onSuccess })
	const updateImageMut = trpc.pages.updateImagePath.useMutation({ onSuccess })
	const removeImageMut = trpc.pages.removeImage.useMutation({ onSuccess })

	const emptyForm = useMemo(
		() => ({
			title: '',
			slug: '',
			content: '',
			metaTitle: '',
			metaDesc: '',
			isPublished: false,
		}),
		[],
	)

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
			slug:
				form.slug || form.title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'),
			content: form.content || undefined,
			metaTitle: form.metaTitle || undefined,
			metaDesc: form.metaDesc || undefined,
			isPublished: form.isPublished,
		}
		if (editId) updateMut.mutate({ id: editId, ...data })
		else createMut.mutate(data as any)
	}

	const inputCls =
		'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='flex w-full max-w-3xl max-h-[90vh] flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>
						{editId ? 'Редактировать страницу' : 'Новая страница'}
					</h2>
					<div className='flex items-center gap-3'>
						<label className='flex items-center gap-2 text-sm text-muted-foreground select-none'>
							<input
								type='checkbox'
								checked={form.isPublished}
								onChange={e =>
									setForm(f => ({ ...f, isPublished: e.target.checked }))
								}
								className='h-4 w-4 rounded border-border accent-primary'
							/>
							Опубликовано
						</label>
						<button
							onClick={onClose}
							className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							<X className='h-5 w-5' />
						</button>
					</div>
				</div>

				{/* Body */}
				<form
					onSubmit={handleSubmit}
					className='flex-1 overflow-y-auto px-6 py-5 space-y-5'
				>
					{/* Top row: Image + Title/Slug */}
					<div className='flex gap-5'>
						{/* Cover image */}
						<div className='relative group h-32 w-48 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center'>
							{editId && editPage?.imagePath ? (
								<>
									<img
										src={editPage.imagePath}
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
									<span className='text-[10px]'>Обложка</span>
									<input
										type='file'
										accept='image/*'
										className='hidden'
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
							) : (
								<div className='flex flex-col items-center gap-1 text-muted-foreground'>
									<ImagePlus className='h-6 w-6 opacity-40' />
									<span className='text-[10px]'>Сохраните</span>
								</div>
							)}
						</div>

						{/* Title + Slug */}
						<div className='flex flex-1 flex-col gap-3'>
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Заголовок
								</label>
								<input
									value={form.title}
									onChange={e =>
										setForm(f => ({ ...f, title: e.target.value }))
									}
									required
									placeholder='Заголовок страницы'
									className={inputCls}
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Slug
								</label>
								<input
									value={form.slug}
									onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
									placeholder='auto-generated'
									className={inputCls}
								/>
							</div>
						</div>
					</div>

					{/* Content */}
					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Контент
						</label>
						<textarea
							value={form.content}
							onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
							rows={10}
							placeholder='Содержимое страницы...'
							className='flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary'
						/>
					</div>

					{/* SEO section */}
					<div className='rounded-xl border border-border p-4 space-y-3'>
						<span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
							SEO
						</span>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Meta Title
							</label>
							<input
								value={form.metaTitle}
								onChange={e =>
									setForm(f => ({ ...f, metaTitle: e.target.value }))
								}
								placeholder='Title для поисковиков'
								className={inputCls}
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Meta Description
							</label>
							<textarea
								value={form.metaDesc}
								onChange={e =>
									setForm(f => ({ ...f, metaDesc: e.target.value }))
								}
								rows={2}
								placeholder='Описание для поисковиков...'
								className='flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary'
							/>
						</div>
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
