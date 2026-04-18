'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { keepPreviousData } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc/client'
import CatalogSidebar from '@/features/catalog-filter/ui/CatalogSidebar'
import MobileFilterWrapper from '@/features/catalog-filter/ui/MobileFilterWrapper'
import ViewToggle from '@/features/catalog-filter/ui/ViewToggle'
import ResultsBar from '@/features/catalog-filter/ui/ResultsBar'
import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'
import Pagination from '@/features/catalog-filter/ui/Pagination'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import { Button } from '@/shared/ui/Button'
import { X } from 'lucide-react'
import type { Product } from '@/shared/types/product'

const STATIC_FILTER_KEYS = {
	isNew: 'isNew',
	onSale: 'onSale',
	freeShipping: 'freeShipping',
} as const

const PROPERTY_PARAM_PREFIX = 'prop.'

function parsePropertyFiltersFromParams(
	params: URLSearchParams,
): Record<string, string[]> {
	const result: Record<string, string[]> = {}

	for (const [key, value] of params.entries()) {
		if (!key.startsWith(PROPERTY_PARAM_PREFIX)) continue
		const propertyKey = key.slice(PROPERTY_PARAM_PREFIX.length)
		if (!propertyKey) continue

		const values = value
			.split(',')
			.map(v => v.trim())
			.filter(Boolean)

		if (values.length > 0) {
			result[propertyKey] = Array.from(new Set(values))
		}
	}

	return result
}

function clearFilterParams(params: URLSearchParams) {
	params.delete('search')
	params.delete('minPrice')
	params.delete('maxPrice')
	params.delete('sort')
	params.delete(STATIC_FILTER_KEYS.isNew)
	params.delete(STATIC_FILTER_KEYS.onSale)
	params.delete(STATIC_FILTER_KEYS.freeShipping)

	for (const key of [...params.keys()]) {
		if (key.startsWith(PROPERTY_PARAM_PREFIX)) {
			params.delete(key)
		}
	}
}

function dbProductToFrontend(p: Record<string, unknown>): Product {
	const price = p.price ? Number(p.price) : 0
	const compareAtPrice = p.compareAtPrice ? Number(p.compareAtPrice) : undefined
	return {
		id: p.id as string,
		slug: p.slug as string,
		name: p.name as string,
		description: (p.description as string) ?? '',
		price,
		oldPrice: compareAtPrice,
		discountPercent:
			price && compareAtPrice
				? Math.round((1 - price / compareAtPrice) * 100)
				: undefined,
		bonusAmount: price ? Math.round(price * 0.06) : undefined,
		category: (p.category as { name: string })?.name ?? '',
		brand: (p.brand as string) ?? undefined,
		brandCountry: (p.brandCountry as string) ?? undefined,
		images: Array.isArray(p.images) ? (p.images as string[]) : [],
		imagePath: (p.imagePath as string) ?? null,
		rating: p.rating ? Number(p.rating) : undefined,
		reviewsCount: (p.reviewsCount as number) ?? 0,
		inStock: (p.stock as number) > 0,
		stockQuantity: p.stock as number,
		badges: Array.isArray(p.badges) ? (p.badges as string[]) : [],
		createdAt: String(p.createdAt ?? new Date().toISOString()),
	}
}

function toCatalogCard(p: Product) {
	return {
		productId: String(p.id),
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.imagePath ?? p.images[0] ?? '/bulb.svg',
		price: p.price,
		oldPrice: p.oldPrice,
		discountPercent: p.discountPercent,
		bonusAmount: p.bonusAmount,
		rating: p.rating,
		reviewsCount: p.reviewsCount,
		availability: p.inStock
			? p.stockQuantity
				? `В наличии ${p.stockQuantity} шт.`
				: 'В наличии'
			: 'Нет в наличии',
		badges: p.badges,
	}
}

export default function CategoryContent({ slug }: { slug: string }) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const searchParamsSnapshot = new URLSearchParams(searchParams.toString())

	const currentPage = Number(searchParams.get('page') ?? '1')
	const search = searchParams.get('search') ?? ''
	const sortBy = (searchParams.get('sort') ?? 'newest') as
		| 'price-asc'
		| 'price-desc'
		| 'name'
		| 'newest'
		| 'rating'
	const minPrice = searchParams.get('minPrice')
		? Number(searchParams.get('minPrice'))
		: undefined
	const maxPrice = searchParams.get('maxPrice')
		? Number(searchParams.get('maxPrice'))
		: undefined
	const isNew = searchParams.get(STATIC_FILTER_KEYS.isNew) === '1'
	const onSale = searchParams.get(STATIC_FILTER_KEYS.onSale) === '1'
	const freeShipping =
		searchParams.get(STATIC_FILTER_KEYS.freeShipping) === '1'
	const selectedPropertyFilters =
		parsePropertyFiltersFromParams(searchParamsSnapshot)

	const [searchInput, setSearchInput] = useState(search)

	const { data: category } = trpc.categories.getBySlug.useQuery(slug, {
		staleTime: 5 * 60 * 1000,
	})
	const { data: categoriesTree } = trpc.categories.getTree.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})
	const { data: availableFilters } = trpc.products.getAvailableFilters.useQuery({
		categorySlug: slug,
		includeChildren: true,
	}, {
		staleTime: 3 * 60 * 1000,
	})

	const { data: productsData, isLoading } = trpc.products.getMany.useQuery({
		categorySlug: slug,
		includeChildren: true,
		page: currentPage,
		limit: 12,
		search: search || undefined,
		sortBy,
		minPrice,
		maxPrice,
		isNew: isNew || undefined,
		onSale: onSale || undefined,
		freeShipping: freeShipping || undefined,
		properties:
			Object.keys(selectedPropertyFilters).length > 0
				? selectedPropertyFilters
				: undefined,
	}, {
		placeholderData: keepPreviousData,
	})

	const categoryName = category?.name ?? slug
	const parentCategory = category?.parent
	const subcategories = category?.children ?? []

	// Build breadcrumbs
	const breadcrumbItems: { label: string; href?: string }[] = [
		{ label: 'Главная', href: '/' },
		{ label: 'Каталог', href: '/catalog' },
	]
	if (parentCategory) {
		breadcrumbItems.push({
			label: parentCategory.name,
			href: `/catalog/${parentCategory.slug}`,
		})
	}
	breadcrumbItems.push({ label: categoryName })

	const categoryTree = (categoriesTree ?? []).map(cat => ({
		name: cat.name,
		href: `/catalog/${cat.slug}`,
		children: cat.children?.map((child: { name: string; slug: string }) => ({
			name: child.name,
			href: `/catalog/${child.slug}`,
		})),
	}))

	const products = (productsData?.items ?? []).map(
		(p: Record<string, unknown>) => dbProductToFrontend(p),
	)
	const totalProducts = productsData?.total ?? 0
	const totalPages = productsData?.totalPages ?? 1
	const selectedStaticFilters: Partial<
		Record<'isNew' | 'onSale' | 'freeShipping', boolean>
	> = {
		isNew,
		onSale,
		freeShipping,
	}

	const dynamicFilterSelectionsCount = Object.values(
		selectedPropertyFilters,
	).reduce((acc, values) => acc + values.length, 0)

	const activeFilterCount =
		(search ? 1 : 0) +
		(minPrice !== undefined || maxPrice !== undefined ? 1 : 0) +
		(sortBy !== 'newest' ? 1 : 0) +
		(isNew ? 1 : 0) +
		(onSale ? 1 : 0) +
		(freeShipping ? 1 : 0) +
		dynamicFilterSelectionsCount

	function updateParams(updates: Record<string, string | undefined>) {
		const params = new URLSearchParams(searchParams.toString())
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined && value !== '') {
				params.set(key, value)
			} else {
				params.delete(key)
			}
		}
		router.push(`${pathname}?${params.toString()}`)
	}

	function resetFilters() {
		const params = new URLSearchParams(searchParams.toString())
		clearFilterParams(params)
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`)
	}

	function toggleStaticFilter(
		key: 'isNew' | 'onSale' | 'freeShipping',
		checked: boolean,
	) {
		updateParams({
			[key]: checked ? '1' : undefined,
			page: '1',
		})
	}

	function togglePropertyFilter(
		propertyKey: string,
		value: string,
		checked: boolean,
	) {
		const params = new URLSearchParams(searchParams.toString())
		const paramKey = `${PROPERTY_PARAM_PREFIX}${propertyKey}`
		const currentValues = (params.get(paramKey) ?? '')
			.split(',')
			.map(v => v.trim())
			.filter(Boolean)

		const nextValues = checked
			? Array.from(new Set([...currentValues, value]))
			: currentValues.filter(v => v !== value)

		if (nextValues.length > 0) {
			params.set(paramKey, nextValues.join(','))
		} else {
			params.delete(paramKey)
		}
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`)
	}

	const hasActiveFilters =
		!!search ||
		!!minPrice ||
		!!maxPrice ||
		isNew ||
		onSale ||
		freeShipping ||
		dynamicFilterSelectionsCount > 0 ||
		sortBy !== 'newest' ||
		currentPage !== 1

	const sortLabel: Record<typeof sortBy, string> = {
		'price-asc': 'Цена ↑',
		'price-desc': 'Цена ↓',
		name: 'По названию',
		newest: 'Новинки',
		rating: 'По рейтингу',
	}

	return (
		<>
			<Breadcrumbs items={breadcrumbItems} />

			<MobileFilterWrapper
				categoryTree={categoryTree}
				activeCategoryPath={`/catalog/${slug}`}
				staticFilters={availableFilters?.staticFilters ?? []}
				propertyFilters={availableFilters?.propertyFilters ?? []}
				selectedStaticFilters={selectedStaticFilters}
				selectedPropertyFilters={selectedPropertyFilters}
				onStaticFilterChange={toggleStaticFilter}
				onPropertyFilterChange={togglePropertyFilter}
				onResetFilters={resetFilters}
				filterCount={activeFilterCount}
			>
				<div className='flex gap-4 md:gap-8'>
					<div className='hidden w-64 shrink-0 lg:block'>
						<CatalogSidebar
							categoryTree={categoryTree}
							activeCategoryPath={`/catalog/${slug}`}
							staticFilters={availableFilters?.staticFilters ?? []}
							propertyFilters={availableFilters?.propertyFilters ?? []}
							selectedStaticFilters={selectedStaticFilters}
							selectedPropertyFilters={selectedPropertyFilters}
							onStaticFilterChange={toggleStaticFilter}
							onPropertyFilterChange={togglePropertyFilter}
							minPrice={minPrice}
							maxPrice={maxPrice}
							onPriceChange={(min, max) =>
								updateParams({
									minPrice: min !== undefined ? String(min) : undefined,
									maxPrice: max !== undefined ? String(max) : undefined,
									page: '1',
								})
							}
							sortBy={sortBy}
							onSortChange={sort => updateParams({ sort, page: '1' })}
						/>
					</div>

					<div className='min-w-0 flex-1'>
						<div className='mb-4 flex items-start justify-between'>
							<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
								{categoryName}
							</h1>
							<ViewToggle />
						</div>

						{/* Subcategory chips */}
						{subcategories.length > 0 && (
							<div className='mb-4 flex flex-wrap gap-2'>
								{subcategories.map(
									(sub: { id: string; name: string; slug: string }) => (
										<Link
											key={sub.id}
											href={`/catalog/${sub.slug}`}
											className='rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground'
										>
											{sub.name}
										</Link>
									),
								)}
							</div>
						)}

						{/* Search */}
						<div className='mb-4 flex gap-2'>
							<input
								type='search'
								placeholder='Поиск в категории...'
								value={searchInput}
								onChange={e => setSearchInput(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										updateParams({
											search: searchInput || undefined,
											page: '1',
										})
									}
								}}
								className='flex h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
							/>
							<Button
								variant='primary'
								size='sm'
								onClick={() =>
									updateParams({ search: searchInput || undefined, page: '1' })
								}
							>
								Найти
							</Button>
							{hasActiveFilters && (
								<Button
									variant='ghost'
									size='sm'
									onClick={resetFilters}
								>
									Сбросить
								</Button>
							)}
						</div>

						<ResultsBar total={totalProducts} />

						{/* Active filter chips */}
						{hasActiveFilters && (
							<div className='mb-4 flex flex-wrap gap-2'>
								{search && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() => {
											setSearchInput('')
											updateParams({ search: undefined, page: '1' })
										}}
									>
										<span className='max-w-[220px] truncate'>
											Поиск: {search}
										</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{(minPrice !== undefined || maxPrice !== undefined) && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() =>
											updateParams({
												minPrice: undefined,
												maxPrice: undefined,
												page: '1',
											})
										}
									>
										<span>
											Цена:{' '}
											{minPrice !== undefined ? minPrice : '—'}–{maxPrice !== undefined ? maxPrice : '—'}
										</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{sortBy !== 'newest' && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() => updateParams({ sort: undefined, page: '1' })}
									>
										<span>Сортировка: {sortLabel[sortBy]}</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{isNew && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() =>
											toggleStaticFilter('isNew', false)
										}
									>
										<span>Новинки</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{onSale && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() =>
											toggleStaticFilter('onSale', false)
										}
									>
										<span>Товары со скидкой</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{freeShipping && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() =>
											toggleStaticFilter('freeShipping', false)
										}
									>
										<span>Бесплатная доставка</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}

								{Object.entries(selectedPropertyFilters).flatMap(
									([propertyKey, values]) =>
										values.map(value => {
											const propertyMeta = availableFilters?.propertyFilters.find(
												f => f.key === propertyKey,
											)
											const optionMeta = propertyMeta?.options.find(
												o => o.value === value,
											)

											return (
												<Button
													key={`${propertyKey}:${value}`}
													variant='subtle'
													size='compact'
													onClick={() =>
														togglePropertyFilter(propertyKey, value, false)
													}
												>
													<span>
														{propertyMeta?.label ?? propertyKey}:{' '}
														{optionMeta?.label ?? value}
													</span>
													<X className='h-3.5 w-3.5' strokeWidth={1.5} />
												</Button>
											)
										}),
								)}

								{currentPage !== 1 && (
									<Button
										variant='subtle'
										size='compact'
										onClick={() => updateParams({ page: '1' })}
									>
										<span>Страница: {currentPage}</span>
										<X className='h-3.5 w-3.5' strokeWidth={1.5} />
									</Button>
								)}
							</div>
						)}

						{isLoading ? (
							<div className='py-12 text-center text-sm text-muted-foreground'>
								Загрузка товаров...
							</div>
						) : products.length === 0 ? (
							<div className='py-12 text-center text-sm text-muted-foreground'>
								Товары не найдены
							</div>
						) : (
							<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
								{products.map(product => (
									<InteractiveCatalogCard
										key={product.slug}
										{...toCatalogCard(product)}
									/>
								))}
							</div>
						)}

						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={page => updateParams({ page: String(page) })}
						/>
					</div>
				</div>
			</MobileFilterWrapper>
		</>
	)
}
