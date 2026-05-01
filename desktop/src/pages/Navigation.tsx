import { useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import {
	Globe,
	Plus,
	Save,
	Trash2,
	ChevronUp,
	ChevronDown,
	RefreshCw,
	AlertCircle,
} from 'lucide-react'

type NavZone = 'HEADER' | 'FOOTER'

const ZONES: { zone: NavZone; label: string }[] = [
	{ zone: 'HEADER', label: 'Хедер' },
	{ zone: 'FOOTER', label: 'Футер' },
]

type DraftNavItem = {
	id: string
	pageId: string
	labelOverride: string | null
	isActive: boolean
	order: number
}

type PageOption = {
	id: string
	title: string
	slug: string
}

function normalizeOrder(items: DraftNavItem[]): DraftNavItem[] {
	return items.map((item, i) => ({ ...item, order: i }))
}

function normalizeSnapshot(items: DraftNavItem[]) {
	return normalizeOrder(items).map(item => ({
		pageId: item.pageId,
		labelOverride: item.labelOverride?.trim() || null,
		isActive: item.isActive,
	}))
}

function createDraft(pageId: string, order: number): DraftNavItem {
	return {
		id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		pageId,
		labelOverride: null,
		isActive: true,
		order,
	}
}

function ZoneEditor({ zone, zoneLabel }: { zone: NavZone; zoneLabel: string }) {
	const [draftItemsState, setDraftItemsState] = useState<DraftNavItem[] | null>(null)
	const [selectedPageId, setSelectedPageId] = useState('')
	const [successMsg, setSuccessMsg] = useState('')
	const [errorMsg, setErrorMsg] = useState('')
	const utils = trpc.useUtils()

	const { data, isLoading, isError, error, refetch } = trpc.siteNav.getEditorState.useQuery(
		{ zone },
		{ staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
	)

	const { mutate: saveZone, isPending: isSaving } = trpc.siteNav.replaceZone.useMutation({
		onSuccess: async () => {
			setSuccessMsg(`${zoneLabel}: изменения сохранены`)
			setDraftItemsState(null)
			setTimeout(() => setSuccessMsg(''), 3000)
			await utils.siteNav.getEditorState.invalidate({ zone })
		},
		onError: err => {
			setErrorMsg(err.message || 'Ошибка при сохранении')
			setTimeout(() => setErrorMsg(''), 4000)
		},
	})

	const sourceItems = useMemo<DraftNavItem[]>(() => {
		return [...(data?.items ?? [])]
			.sort((a, b) => a.order - b.order)
			.map(item => ({
				id: item.id,
				pageId: item.pageId,
				labelOverride: item.labelOverride,
				isActive: item.isActive,
				order: item.order,
			}))
	}, [data?.items])

	const draftItems = draftItemsState ?? sourceItems
	const pages: PageOption[] = useMemo(() => data?.pages ?? [], [data?.pages])
	const pageById = useMemo(() => new Map(pages.map(p => [p.id, p])), [pages])
	const usedPageIds = useMemo(() => new Set(draftItems.map(i => i.pageId)), [draftItems])

	const hasChanges = useMemo(() => {
		if (!data) return false
		return (
			JSON.stringify(normalizeSnapshot(draftItems)) !==
			JSON.stringify(normalizeSnapshot(sourceItems))
		)
	}, [data, draftItems, sourceItems])

	const addItem = () => {
		if (!selectedPageId) return
		if (usedPageIds.has(selectedPageId)) {
			setErrorMsg('Эта страница уже добавлена в текущую зону')
			setTimeout(() => setErrorMsg(''), 3000)
			return
		}
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			return [...base, createDraft(selectedPageId, base.length)]
		})
		setSelectedPageId('')
	}

	const removeItem = (id: string) => {
		setDraftItemsState(prev =>
			normalizeOrder((prev ?? sourceItems).filter(item => item.id !== id)),
		)
	}

	const moveItem = (id: string, direction: 'up' | 'down') => {
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			const idx = base.findIndex(item => item.id === id)
			if (idx < 0) return base
			const next = direction === 'up' ? idx - 1 : idx + 1
			if (next < 0 || next >= base.length) return base
			const arr = [...base]
			;[arr[idx], arr[next]] = [arr[next], arr[idx]]
			return normalizeOrder(arr)
		})
	}

	const updateItem = (id: string, patch: Partial<Pick<DraftNavItem, 'pageId' | 'labelOverride' | 'isActive'>>) => {
		setDraftItemsState(prev =>
			(prev ?? sourceItems).map(item =>
				item.id === id ? { ...item, ...patch } : item,
			),
		)
	}

	const save = () => {
		saveZone({
			zone,
			items: normalizeOrder(draftItems).map(item => ({
				pageId: item.pageId,
				labelOverride: item.labelOverride,
				isActive: item.isActive,
			})),
		})
	}

	if (isLoading) {
		return (
			<div className='rounded-2xl border border-border bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground'>
				Загрузка навигации...
			</div>
		)
	}

	if (isError) {
		return (
			<div className='rounded-2xl border border-border bg-muted/10 p-6 space-y-3'>
				<p className='text-sm text-destructive flex items-center gap-2'>
					<AlertCircle className='h-4 w-4 shrink-0' />
					{error?.message || 'Не удалось загрузить навигацию'}
				</p>
				<button
					onClick={() => refetch()}
					className='text-xs underline text-muted-foreground hover:text-foreground transition-colors'
				>
					Повторить
				</button>
			</div>
		)
	}

	return (
		<div className='rounded-2xl border border-border bg-muted/10 p-5 space-y-4'>
			{/* Toolbar */}
			<div className='flex flex-wrap items-center gap-2'>
				<select
					value={selectedPageId}
					onChange={e => setSelectedPageId(e.target.value)}
					className='flex-1 min-w-[240px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
					aria-label='Выбор страницы для добавления'
				>
					<option value=''>— Выберите опубликованную страницу —</option>
					{pages.map(page => (
						<option key={page.id} value={page.id} disabled={usedPageIds.has(page.id)}>
							{page.title} (/{page.slug})
						</option>
					))}
				</select>
				<button
					onClick={addItem}
					disabled={!selectedPageId}
					className='inline-flex items-center gap-1 rounded-lg border border-border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50'
				>
					<Plus className='h-4 w-4' />
					Добавить
				</button>
				<div className='ml-auto flex items-center gap-2'>
					{hasChanges && (
						<span className='text-xs rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-600 dark:text-amber-400'>
							Несохранённые изменения
						</span>
					)}
					<button
						onClick={save}
						disabled={!hasChanges || isSaving}
						className='inline-flex items-center gap-1 rounded-lg border border-border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50'
					>
						<Save className='h-4 w-4' />
						{isSaving ? 'Сохранение...' : 'Сохранить'}
					</button>
				</div>
			</div>

			{/* Feedback */}
			{successMsg && (
				<p className='text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
					{successMsg}
				</p>
			)}
			{errorMsg && (
				<p className='text-xs text-destructive flex items-center gap-1'>
					<AlertCircle className='h-3.5 w-3.5 shrink-0' />
					{errorMsg}
				</p>
			)}

			{/* List */}
			{draftItems.length === 0 ? (
				<div className='rounded-xl border border-dashed border-border bg-muted/5 px-4 py-8 text-center text-sm text-muted-foreground'>
					Навигационные ссылки не настроены. Добавьте первую опубликованную страницу.
				</div>
			) : (
				<ul className='space-y-2'>
					{draftItems.map((item, idx) => {
						const page = pageById.get(item.pageId)
						return (
							<li
								key={item.id}
								className='flex flex-wrap items-start gap-2 rounded-xl border border-border bg-background p-3'
							>
								{/* Reorder */}
								<div className='flex flex-col gap-0.5'>
									<button
										onClick={() => moveItem(item.id, 'up')}
										disabled={idx === 0}
										className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors'
										aria-label='Переместить вверх'
									>
										<ChevronUp className='h-4 w-4' />
									</button>
									<button
										onClick={() => moveItem(item.id, 'down')}
										disabled={idx === draftItems.length - 1}
										className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors'
										aria-label='Переместить вниз'
									>
										<ChevronDown className='h-4 w-4' />
									</button>
								</div>

								{/* Page select */}
								<select
									value={item.pageId}
									onChange={e => {
										const nextPageId = e.target.value
										if (draftItems.some(d => d.id !== item.id && d.pageId === nextPageId)) {
											setErrorMsg('Эта страница уже есть в зоне')
											setTimeout(() => setErrorMsg(''), 3000)
											return
										}
										updateItem(item.id, { pageId: nextPageId })
									}}
									className='min-w-[220px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
									aria-label='Страница ссылки'
								>
									{pages.map(pageOption => (
										<option
											key={pageOption.id}
											value={pageOption.id}
											disabled={
												pageOption.id !== item.pageId && usedPageIds.has(pageOption.id)
											}
										>
											{pageOption.title} (/{pageOption.slug})
										</option>
									))}
								</select>

								{/* Label override */}
								<input
									type='text'
									value={item.labelOverride ?? ''}
									onChange={e => updateItem(item.id, { labelOverride: e.target.value || null })}
									placeholder={page?.title ?? 'Метка (необязательно)'}
									className='min-w-[180px] flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40'
									aria-label='Переопределение метки ссылки'
								/>

								{/* Active toggle */}
								<label className='flex items-center gap-1.5 cursor-pointer'>
									<input
										type='checkbox'
										checked={item.isActive}
										onChange={e => updateItem(item.id, { isActive: e.target.checked })}
										className='h-4 w-4 rounded border-border accent-primary'
										aria-label='Активность ссылки'
									/>
									<span className='text-xs text-muted-foreground select-none'>Активна</span>
								</label>

								{/* Remove */}
								<button
									onClick={() => removeItem(item.id)}
									className='rounded p-1 text-muted-foreground hover:text-destructive transition-colors'
									aria-label='Удалить ссылку'
								>
									<Trash2 className='h-4 w-4' />
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}

export function NavigationPage() {
	const [activeZone, setActiveZone] = useState<NavZone>('HEADER')
	const utils = trpc.useUtils()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const handleRefresh = async () => {
		setIsRefreshing(true)
		await utils.siteNav.getEditorState.invalidate()
		setIsRefreshing(false)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
						<Globe className='h-5 w-5 text-primary' />
					</div>
					<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
						Навигация сайта
					</h1>
				</div>
				<button
					onClick={handleRefresh}
					disabled={isRefreshing}
					className='inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50'
					aria-label='Обновить данные'
				>
					<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					Обновить
				</button>
			</div>

			{/* Zone tabs */}
			<div className='flex gap-1 rounded-xl border border-border bg-muted/20 p-1 w-fit'>
				{ZONES.map(({ zone, label }) => (
					<button
						key={zone}
						onClick={() => setActiveZone(zone)}
						className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
							activeZone === zone
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{label}
					</button>
				))}
			</div>

			{/* Zone editor */}
			{ZONES.map(({ zone, label }) =>
				activeZone === zone ? (
					<ZoneEditor key={zone} zone={zone} zoneLabel={label} />
				) : null,
			)}
		</div>
	)
}
