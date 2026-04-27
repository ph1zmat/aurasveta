'use client'

import { useMemo, useState } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import {
	Globe,
	Save,
	Search,
	FileText,
	FolderTree,
	Package,
	Home,
	CheckCircle2,
	AlertCircle,
	Circle,
	EyeOff,
	Share2,
	Link2,
	Type,
	AlignLeft,
	Tag,
	ImageIcon,
	Pencil,
	X,
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'

type TargetType = 'product' | 'category' | 'page'
type SeoPageItem = RouterOutputs['pages']['getAll'][number]
type SeoCategoryItem = RouterOutputs['categories']['getAll'][number]
type SeoProductItem = RouterOutputs['products']['getMany']['items'][number]
type SeoTargetRecord = RouterOutputs['seo']['getByTarget']
type SeoFormState = {
	title: string
	description: string
	keywords: string
	ogTitle: string
	ogDescription: string
	ogImage: string
	canonicalUrl: string
	noIndex: boolean
}

function getSeoFormState(data: SeoTargetRecord): SeoFormState {
	return {
		title: data?.title ?? '',
		description: data?.description ?? '',
		keywords: data?.keywords ?? '',
		ogTitle: data?.ogTitle ?? '',
		ogDescription: data?.ogDescription ?? '',
		ogImage: data?.ogImage ?? '',
		canonicalUrl: data?.canonicalUrl ?? '',
		noIndex: !!data?.noIndex,
	}
}

/* ============ Main ============ */

export default function SeoClient() {
	const [activeTab, setActiveTab] = useState<'pages' | 'categories' | 'products'>('pages')
	const [search, setSearch] = useState('')
	const [editTarget, setEditTarget] = useState<{
		type: TargetType
		id: string
		name: string
	} | null>(null)

	const tabs = [
		{ key: 'pages' as const, label: 'Страницы', icon: FileText },
		{ key: 'categories' as const, label: 'Категории', icon: FolderTree },
		{ key: 'products' as const, label: 'Товары', icon: Package },
	]

	return (
		<div className='space-y-5'>
			{/* Header */}
			<div className='flex items-center gap-3'>
				<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
					<Globe className='h-5 w-5 text-primary' />
				</div>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					SEO
				</h1>
			</div>

			{/* Tabs */}
			<div className='flex gap-1 rounded-xl border border-border bg-muted/20 p-1'>
				{tabs.map(tab => {
					const Icon = tab.icon
					return (
						<button
							key={tab.key}
							onClick={() => {
								setActiveTab(tab.key)
								setSearch('')
							}}
							className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								activeTab === tab.key
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Icon className='h-4 w-4' />
							{tab.label}
						</button>
					)
				})}
			</div>

			{/* Search */}
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
				<input
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder='Поиск...'
					className='flex h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
			</div>

			{/* Tab content */}
			{activeTab === 'pages' && <PagesTab search={search} onEdit={setEditTarget} />}
			{activeTab === 'categories' && <CategoriesTab search={search} onEdit={setEditTarget} />}
			{activeTab === 'products' && <ProductsTab search={search} onEdit={setEditTarget} />}

			{/* Modal */}
			{editTarget && (
				<SeoModal
					targetType={editTarget.type}
					targetId={editTarget.id}
					name={editTarget.name}
					onClose={() => setEditTarget(null)}
				/>
			)}
		</div>
	)
}

/* ============ Pages Tab ============ */

type EditHandler = (t: { type: TargetType; id: string; name: string }) => void

function PagesTab({ search, onEdit }: { search: string; onEdit: EditHandler }) {
	const { data: pages } = trpc.pages.getAll.useQuery()

	const staticPages = [{ id: 'home', name: 'Главная страница', slug: '/' }]

	const cmsPages = useMemo(() => {
		if (!pages) return []
		const q = search.toLowerCase()
		return pages.filter(
			(page: SeoPageItem) => !q || page.title?.toLowerCase().includes(q),
		)
	}, [pages, search])

	return (
		<div className='space-y-5'>
			{(!search || 'главная'.includes(search.toLowerCase())) && (
				<div className='space-y-3'>
					<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						<Home className='h-3.5 w-3.5' />
						Статические
					</div>
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
						{staticPages.map(p => (
							<SeoCard
								key={p.id}
								targetType='page'
								targetId={p.id}
								name={p.name}
								subtitle={p.slug}
								onEdit={() => onEdit({ type: 'page', id: p.id, name: p.name })}
							/>
						))}
					</div>
				</div>
			)}

			{cmsPages.length > 0 && (
				<div className='space-y-3'>
					<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						<FileText className='h-3.5 w-3.5' />
						CMS страницы
					</div>
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
						{cmsPages.map(page => (
							<SeoCard
								key={page.id}
								targetType='page'
								targetId={page.id}
								name={page.title}
								subtitle={`/${page.slug}`}
								onEdit={() =>
									onEdit({ type: 'page', id: page.id, name: page.title })
								}
							/>
						))}
					</div>
				</div>
			)}

			{!cmsPages.length && search && <EmptySearch />}
		</div>
	)
}

/* ============ Categories Tab ============ */

function CategoriesTab({ search, onEdit }: { search: string; onEdit: EditHandler }) {
	const { data: categories } = trpc.categories.getAll.useQuery()

	const filtered = useMemo(() => {
		if (!categories) return []
		const q = search.toLowerCase()
		return categories.filter(
			(category: SeoCategoryItem) =>
				!q || category.name?.toLowerCase().includes(q),
		)
	}, [categories, search])

	if (!filtered.length && search) return <EmptySearch />
	if (!filtered.length) {
		return (
			<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
				<FolderTree className='mb-3 h-10 w-10 text-muted-foreground/20' />
				<p className='text-sm text-muted-foreground'>Нет категорий</p>
			</div>
		)
	}

	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
			{filtered.map(category => (
				<SeoCard
					key={category.id}
					targetType='category'
					targetId={category.id}
					name={category.name}
					subtitle={`/${category.slug}`}
					image={
						category.imagePath
							? `/api/storage/file?key=${category.imagePath}`
							: undefined
					}
					onEdit={() =>
						onEdit({
							type: 'category',
							id: category.id,
							name: category.name,
						})
					}
				/>
			))}
		</div>
	)
}

/* ============ Products Tab ============ */

function ProductsTab({ search, onEdit }: { search: string; onEdit: EditHandler }) {
	const [page, setPage] = useState(1)

	const { data } = trpc.products.getMany.useQuery({
		page,
		limit: 24,
		search: search || undefined,
	})

	const items = (data?.items ?? []) as SeoProductItem[]
	const total = data?.total ?? 0
	const totalPages = Math.ceil(total / 24)

	if (!items.length && search) return <EmptySearch />
	if (!items.length) {
		return (
			<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
				<Package className='mb-3 h-10 w-10 text-muted-foreground/20' />
				<p className='text-sm text-muted-foreground'>Нет товаров</p>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
				{items.map(product => (
					<SeoCard
						key={product.id}
						targetType='product'
						targetId={product.id}
						name={product.name}
						subtitle={`/${product.slug}`}
						image={
							product.images?.[0]?.imageAsset?.url ??
							product.images?.[0]?.url ??
							(product.images?.[0]?.key
								? `/api/storage/file?key=${product.images[0].key}`
								: undefined)
						}
						onEdit={() =>
							onEdit({ type: 'product', id: product.id, name: product.name })
						}
					/>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-center gap-2 pt-2'>
					<button
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Назад
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage(p => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Далее
					</button>
				</div>
			)}
		</div>
	)
}

/* ============ SEO Card ============ */

function SeoCard({
	targetType,
	targetId,
	name,
	subtitle,
	image,
	onEdit,
}: {
	targetType: TargetType
	targetId: string
	name: string
	subtitle?: string
	image?: string
	onEdit: () => void
}) {
	const { data } = trpc.seo.getByTarget.useQuery({ targetType, targetId })

	const filledCount = useMemo(() => {
		if (!data) return 0
		let count = 0
		if (data.title) count++
		if (data.description) count++
		if (data.keywords) count++
		if (data.ogTitle) count++
		if (data.ogDescription) count++
		if (data.ogImage) count++
		if (data.canonicalUrl) count++
		return count
	}, [data])

	const status = useMemo(() => {
		if (!data || filledCount === 0) return 'empty'
		if (filledCount >= 3) return 'good'
		return 'partial'
	}, [data, filledCount])

	const statusConfig = {
		good: {
			icon: CheckCircle2,
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10',
			label: 'Настроено',
		},
		partial: {
			icon: AlertCircle,
			color: 'text-amber-500',
			bg: 'bg-amber-500/10',
			label: 'Частично',
		},
		empty: {
			icon: Circle,
			color: 'text-muted-foreground/40',
			bg: 'bg-muted',
			label: 'Пусто',
		},
	}

	const st = statusConfig[status]
	const StatusIcon = st.icon

	return (
		<div className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'>
			{/* Image */}
			<div className='relative aspect-video w-full bg-muted/30'>
				{image ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={image} alt='' className='h-full w-full object-cover' />
				) : (
					<div className='flex h-full w-full items-center justify-center'>
						<Globe className='h-10 w-10 text-muted-foreground/15' />
					</div>
				)}

				{/* Status badge */}
				<div
					className={`absolute left-2 top-2 flex items-center gap-1 rounded-full ${st.bg} px-2 py-0.5`}
				>
					<StatusIcon className={`h-3 w-3 ${st.color}`} />
					<span className={`text-[10px] font-medium ${st.color}`}>{st.label}</span>
				</div>

				{/* noIndex badge */}
				{data?.noIndex && (
					<div className='absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5'>
						<EyeOff className='h-3 w-3 text-white' />
						<span className='text-[10px] font-medium text-white'>noindex</span>
					</div>
				)}

				{/* Fill progress bar */}
				<div className='absolute bottom-0 left-0 right-0 h-1 bg-black/10'>
					<div
						className={`h-full transition-all ${
							status === 'good'
								? 'bg-emerald-500'
								: status === 'partial'
									? 'bg-amber-500'
									: 'bg-muted-foreground/20'
						}`}
						style={{ width: `${(filledCount / 7) * 100}%` }}
					/>
				</div>
			</div>

			{/* Content */}
			<div className='flex flex-1 flex-col gap-2 p-3'>
				<div className='min-w-0'>
					<div className='truncate text-sm font-semibold text-foreground'>{name}</div>
					{subtitle && (
						<div className='truncate font-mono text-[11px] text-muted-foreground'>
							{subtitle}
						</div>
					)}
				</div>

				{data?.title && (
					<p className='line-clamp-1 text-[11px] leading-snug text-blue-500'>
						{data.title}
					</p>
				)}
				{data?.description && (
					<p className='line-clamp-2 text-[10px] leading-snug text-muted-foreground'>
						{data.description}
					</p>
				)}

				<div className='mt-auto flex items-center gap-2 pt-1'>
					<span className='text-[10px] tabular-nums text-muted-foreground'>
						{filledCount}/7 полей
					</span>
					<div className='flex-1' />
					<button
						onClick={onEdit}
						className='flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
					>
						<Pencil className='h-3 w-3' />
						Изменить
					</button>
				</div>
			</div>
		</div>
	)
}

/* ============ SEO Modal ============ */

function SeoModal({
	targetType,
	targetId,
	name,
	onClose,
}: {
	targetType: TargetType
	targetId: string
	name: string
	onClose: () => void
}) {
	const { data, isLoading } = trpc.seo.getByTarget.useQuery({ targetType, targetId })

	return (
		<SeoModalContent
			key={`${targetType}:${targetId}:${isLoading ? 'loading' : data ? 'filled' : 'empty'}`}
			targetType={targetType}
			targetId={targetId}
			name={name}
			onClose={onClose}
			initialData={data ?? null}
			isLoading={isLoading}
		/>
	)
}

function SeoModalContent({
	targetType,
	targetId,
	name,
	onClose,
	initialData,
	isLoading,
}: {
	targetType: TargetType
	targetId: string
	name: string
	onClose: () => void
	initialData: SeoTargetRecord
	isLoading: boolean
}) {
	const utils = trpc.useUtils()
	const updateMut = trpc.seo.update.useMutation({
		onSuccess: () => {
			utils.seo.getByTarget.invalidate({ targetType, targetId })
		},
	})
	const [form, setForm] = useState<SeoFormState>(() =>
		getSeoFormState(initialData),
	)
	const [saved, setSaved] = useState(false)

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
		setTimeout(() => setSaved(false), 2500)
	}

	const previewTitle = form.title || form.ogTitle || 'Заголовок страницы'
	const previewDesc =
		form.description || form.ogDescription || 'Описание страницы для поисковых систем...'

	const typeLabels: Record<TargetType, string> = {
		page: 'Страница',
		category: 'Категория',
		product: 'Товар',
	}

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>SEO настройки</h2>
						<p className='text-xs text-muted-foreground'>
							{typeLabels[targetType]}: {name}
						</p>
					</div>
					<button
						onClick={onClose}
						className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Body */}
				<div className='flex-1 space-y-6 overflow-y-auto px-6 py-5'>
					{/* SERP preview */}
					<div className='space-y-2'>
						<div className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
							<Search className='h-3 w-3' />
							Предпросмотр в поиске
						</div>
						<div className='rounded-xl border border-border bg-background p-4'>
							<div className='truncate text-base text-blue-600'>{previewTitle}</div>
							<div className='mt-0.5 truncate text-xs text-emerald-700'>
								{form.canonicalUrl || 'https://example.com/...'}
							</div>
							<div className='mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
								{previewDesc}
							</div>
						</div>
					</div>

					{/* Basic SEO */}
					<div className='space-y-3'>
						<div className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
							<Search className='h-3 w-3' />
							Основное SEO
						</div>
						<div className='grid gap-3 sm:grid-cols-2'>
							<SeoField
								icon={Type}
								label='Title'
								value={form.title}
								onChange={v => setForm(f => ({ ...f, title: v }))}
								placeholder='SEO заголовок'
								maxRecommended={60}
							/>
							<SeoField
								icon={AlignLeft}
								label='Description'
								value={form.description}
								onChange={v => setForm(f => ({ ...f, description: v }))}
								placeholder='SEO описание'
								maxRecommended={160}
								multiline
							/>
							<SeoField
								icon={Tag}
								label='Keywords'
								value={form.keywords}
								onChange={v => setForm(f => ({ ...f, keywords: v }))}
								placeholder='ключевое, слово, фраза'
							/>
							<SeoField
								icon={Link2}
								label='Canonical URL'
								value={form.canonicalUrl}
								onChange={v => setForm(f => ({ ...f, canonicalUrl: v }))}
								placeholder='https://...'
							/>
						</div>
					</div>

					{/* Open Graph */}
					<div className='space-y-3'>
						<div className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
							<Share2 className='h-3 w-3' />
							Open Graph
						</div>
						<div className='grid gap-3 sm:grid-cols-2'>
							<SeoField
								icon={Type}
								label='OG Title'
								value={form.ogTitle}
								onChange={v => setForm(f => ({ ...f, ogTitle: v }))}
								placeholder='Заголовок для соцсетей'
							/>
							<SeoField
								icon={AlignLeft}
								label='OG Description'
								value={form.ogDescription}
								onChange={v => setForm(f => ({ ...f, ogDescription: v }))}
								placeholder='Описание для соцсетей'
								multiline
							/>
							<SeoField
								icon={ImageIcon}
								label='OG Image'
								value={form.ogImage}
								onChange={v => setForm(f => ({ ...f, ogImage: v }))}
								placeholder='https://... /image.jpg'
							/>
						</div>
					</div>

					{/* noIndex toggle */}
					<div className='rounded-xl border border-border bg-muted/10 p-4'>
						<label className='flex cursor-pointer items-center gap-3'>
							<div
								className={`flex h-5 w-9 items-center rounded-full transition-colors ${
									form.noIndex ? 'bg-red-500' : 'bg-muted'
								}`}
							>
								<div
									className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
										form.noIndex ? 'translate-x-4' : 'translate-x-0.5'
									}`}
								/>
							</div>
							<input
								type='checkbox'
								checked={form.noIndex}
								onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))}
								className='sr-only'
							/>
							<div>
								<span
									className={`text-sm font-medium ${
										form.noIndex ? 'text-red-500' : 'text-foreground'
									}`}
								>
									noIndex
								</span>
								<p className='text-[11px] text-muted-foreground'>
									{form.noIndex
										? 'Страница скрыта от поисковых систем'
										: 'Страница индексируется поисковыми системами'}
								</p>
							</div>
						</label>
					</div>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-between border-t border-border px-6 py-4'>
					<div>
						{isLoading && (
							<span className='text-xs text-muted-foreground'>Загрузка...</span>
						)}
						{saved && (
							<span className='flex items-center gap-1 text-xs text-emerald-500'>
								<CheckCircle2 className='h-3.5 w-3.5' />
								Сохранено
							</span>
						)}
					</div>
					<div className='flex gap-2'>
						<Button variant='ghost' onClick={onClose}>
							Отмена
						</Button>
						<Button onClick={onSave} disabled={updateMut.isPending}>
							<Save className='mr-1.5 h-3.5 w-3.5' />
							Сохранить
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

/* ============ SEO Field ============ */

function SeoField({
	icon: Icon,
	label,
	value,
	onChange,
	placeholder,
	maxRecommended,
	multiline,
}: {
	icon: React.ComponentType<{ className?: string }>
	label: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	maxRecommended?: number
	multiline?: boolean
}) {
	const overLimit = maxRecommended ? value.length > maxRecommended : false

	return (
		<div>
			<div className='mb-1.5 flex items-center justify-between'>
				<label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
					<Icon className='h-3 w-3' />
					{label}
				</label>
				{maxRecommended && value.length > 0 && (
					<span
						className={`text-[10px] tabular-nums ${
							overLimit ? 'text-amber-500' : 'text-muted-foreground/60'
						}`}
					>
						{value.length}/{maxRecommended}
					</span>
				)}
			</div>
			{multiline ? (
				<textarea
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					rows={2}
					className={`flex w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
						overLimit ? 'border-amber-500/50' : 'border-border'
					}`}
				/>
			) : (
				<input
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					className={`flex h-9 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
						overLimit ? 'border-amber-500/50' : 'border-border'
					}`}
				/>
			)}
		</div>
	)
}

/* ============ Empty Search ============ */

function EmptySearch() {
	return (
		<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
			<Search className='mb-2 h-8 w-8 text-muted-foreground/20' />
			<p className='text-sm text-muted-foreground'>Ничего не найдено</p>
		</div>
	)
}

