'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { useDebounce } from '@/shared/lib/useDebounce'
import { getTrackingSessionId } from '@/shared/lib/trackingSession'
import EmptyState from '@/shared/ui/EmptyState'
import Skeleton from '@/shared/ui/Skeleton'
import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest'
type SearchItem = RouterOutputs['search']['search']['items'][number]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: 'relevance', label: 'По релевантности' },
	{ value: 'price_asc', label: 'Цена ↑' },
	{ value: 'price_desc', label: 'Цена ↓' },
	{ value: 'newest', label: 'Сначала новые' },
]

export default function SearchContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const initialQuery = searchParams.get('q') ?? ''

	const [searchTerm] = useState(initialQuery)
	const [sortBy, setSortBy] = useState<SortOption>('relevance')
	const [inStock, setInStock] = useState(false)
	const debouncedSearch = useDebounce(searchTerm, 400)

	const observerRef = useRef<HTMLDivElement>(null)

	// Sync URL when search changes
	useEffect(() => {
		if (debouncedSearch && debouncedSearch !== searchParams.get('q')) {
			router.replace(`/search?q=${encodeURIComponent(debouncedSearch)}`, {
				scroll: false,
			})
		}
	}, [debouncedSearch, router, searchParams])

	// Log search query for "Popular searches" feature
	const logSearch = trpc.recommendations.logSearchQuery.useMutation()
	useEffect(() => {
		if (debouncedSearch.length >= 2) {
			const sessionId = getTrackingSessionId()
			if (sessionId) {
				logSearch.mutate({ query: debouncedSearch, sessionId })
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch])

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
	} = trpc.search.search.useInfiniteQuery(
		{
			query: debouncedSearch,
			limit: 12,
			sortBy,
			filters: inStock ? { inStock: true } : undefined,
		},
		{
			enabled: debouncedSearch.length >= 2,
			getNextPageParam: lastPage => lastPage.nextCursor,
			staleTime: 1000 * 60 * 2,
		},
	)

	// Infinite scroll via IntersectionObserver
	useEffect(() => {
		const el = observerRef.current
		if (!el) return

		const observer = new IntersectionObserver(
			entries => {
				if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
					void fetchNextPage()
				}
			},
			{ threshold: 0.1 },
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const allItems =
		data?.pages.flatMap(page =>
			page.items.map((item: SearchItem) => {
				const price = item.price ? Number(item.price) : 0
				const oldPrice = item.compareAtPrice
					? Number(item.compareAtPrice)
					: undefined

				return {
					productId: item.id,
					name: item.name,
					href: `/product/${item.slug}`,
					image: item.imageUrl ?? '/bulb.svg',
					brand: item.brandCountry
						? `${item.brand} (${item.brandCountry})`
						: (item.brand ?? undefined),
					price,
					oldPrice,
					discountPercent:
						price && oldPrice
							? Math.round((1 - price / oldPrice) * 100)
							: undefined,
					bonusAmount: price ? Math.round(price * 0.06) : undefined,
					badges: Array.isArray(item.badges)
						? item.badges.filter(
								(badge: unknown): badge is string => typeof badge === 'string',
							)
						: [],
					inStock: item.stock > 0 ? `В наличии ${item.stock} шт.` : undefined,
					buttonLabel: item.stock > 0 ? 'В КОРЗИНУ' : 'УТОЧНИТЬ',
				}
			}),
		) ?? []

	const total = data?.pages[0]?.total ?? 0

	const handleSortChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			setSortBy(e.target.value as SortOption)
		},
		[],
	)

	return (
		<div className='mx-auto max-w-7xl px-4 py-6'>
			{/* Header */}
			<div className='mb-6'>
				<h1 className='text-2xl font-semibold text-foreground'>
					{debouncedSearch.length >= 2
						? `Результаты поиска: «${debouncedSearch}»`
						: 'Поиск товаров'}
				</h1>
				{debouncedSearch.length >= 2 && !isLoading && (
					<p className='mt-1 text-sm text-muted-foreground'>
						{total > 0
							? `Найдено ${total} ${pluralize(total, 'товар', 'товара', 'товаров')}`
							: 'Ничего не найдено'}
					</p>
				)}
			</div>

			{/* Filters bar */}
			{debouncedSearch.length >= 2 && (
				<div className='mb-6 flex flex-wrap items-center gap-4'>
					<div className='flex items-center gap-2'>
						<SlidersHorizontal className='h-4 w-4 text-muted-foreground' />
						<select
							value={sortBy}
							onChange={handleSortChange}
							className='rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground'
						>
							{SORT_OPTIONS.map(opt => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>

					<label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
						<input
							type='checkbox'
							checked={inStock}
							onChange={e => setInStock(e.target.checked)}
							className='rounded border-border'
						/>
						Только в наличии
					</label>
				</div>
			)}

			{/* Loading state */}
			{isLoading && debouncedSearch.length >= 2 && (
				<div className='py-6'>
					<div className='mb-6 flex items-center justify-center gap-2 text-muted-foreground'>
						<Loader2 className='h-5 w-5 animate-spin' />
						<span>Ищем товары...</span>
					</div>
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className='rounded-2xl border border-border p-4 space-y-3'
							>
								<Skeleton className='h-36 w-full rounded-xl' />
								<Skeleton className='h-4 w-4/5' />
								<Skeleton className='h-4 w-1/2' />
								<Skeleton className='h-10 w-full rounded-lg' />
							</div>
						))}
					</div>
				</div>
			)}

			{/* Error state */}
			{isError && (
				<div className='py-20 text-center text-sm text-destructive'>
					Произошла ошибка при поиске. Попробуйте изменить запрос.
				</div>
			)}

			{/* Empty state */}
			{!isLoading &&
				!isError &&
				debouncedSearch.length >= 2 &&
				allItems.length === 0 && (
					<EmptyState
						title='Ничего не найдено'
						description='Попробуйте изменить запрос или проверьте правильность написания.'
						primaryAction={{ label: 'Открыть каталог', href: '/catalog' }}
					/>
				)}

			{/* Empty query state */}
			{debouncedSearch.length < 2 && (
				<EmptyState
					title='Поиск по каталогу'
					description='Введите запрос (минимум 2 символа), например: “люстра”, “бра”, “LED”.'
					primaryAction={{ label: 'Перейти в каталог', href: '/catalog' }}
				/>
			)}

			{/* Results grid */}
			{allItems.length > 0 && (
				<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
					{allItems.map(card => (
						<InteractiveCatalogCard key={card.productId} {...card} />
					))}
				</div>
			)}

			{/* Infinite scroll sentinel */}
			<div ref={observerRef} className='h-10' />

			{isFetchingNextPage && (
				<div className='flex items-center justify-center gap-2 py-6 text-muted-foreground'>
					<Loader2 className='h-4 w-4 animate-spin' />
					<span className='text-sm'>Загрузка...</span>
				</div>
			)}
		</div>
	)
}

function pluralize(n: number, one: string, few: string, many: string): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod10 === 1 && mod100 !== 11) return one
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
	return many
}
