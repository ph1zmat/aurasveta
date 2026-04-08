'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import CatalogSidebar from '@/features/catalog-filter/ui/CatalogSidebar'
import MobileFilterWrapper from '@/features/catalog-filter/ui/MobileFilterWrapper'
import ViewToggle from '@/features/catalog-filter/ui/ViewToggle'
import ResultsBar from '@/features/catalog-filter/ui/ResultsBar'
import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'
import Pagination from '@/features/catalog-filter/ui/Pagination'
import { Button } from '@/shared/ui/Button'
import type { Product } from '@/shared/types/product'

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

	const [searchInput, setSearchInput] = useState(search)

	const { data: category } = trpc.categories.getBySlug.useQuery(slug)
	const { data: categoriesTree } = trpc.categories.getTree.useQuery()

	const { data: productsData, isLoading } = trpc.products.getMany.useQuery({
		categorySlug: slug,
		page: currentPage,
		limit: 12,
		search: search || undefined,
		sortBy,
		minPrice,
		maxPrice,
	})

	const categoryName = category?.name ?? slug

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

	return (
		<MobileFilterWrapper
			categoryTree={categoryTree}
			activeCategoryPath={`/catalog/${slug}`}
		>
			<div className='flex gap-4 md:gap-8'>
				<div className='hidden w-64 shrink-0 lg:block'>
					<CatalogSidebar
						categoryTree={categoryTree}
						activeCategoryPath={`/catalog/${slug}`}
					/>

					{/* Price filter */}
					<div className='mt-6 space-y-3'>
						<p className='text-sm font-semibold uppercase tracking-widest text-foreground'>
							Цена
						</p>
						<div className='flex gap-2'>
							<input
								type='number'
								placeholder='От'
								defaultValue={minPrice}
								onBlur={e =>
									updateParams({
										minPrice: e.target.value || undefined,
										page: '1',
									})
								}
								className='h-9 w-full rounded-lg border border-border bg-background px-2 text-sm'
							/>
							<input
								type='number'
								placeholder='До'
								defaultValue={maxPrice}
								onBlur={e =>
									updateParams({
										maxPrice: e.target.value || undefined,
										page: '1',
									})
								}
								className='h-9 w-full rounded-lg border border-border bg-background px-2 text-sm'
							/>
						</div>
					</div>

					{/* Sort */}
					<div className='mt-6 space-y-3'>
						<p className='text-sm font-semibold uppercase tracking-widest text-foreground'>
							Сортировка
						</p>
						<select
							value={sortBy}
							onChange={e => updateParams({ sort: e.target.value, page: '1' })}
							className='h-9 w-full rounded-lg border border-border bg-background px-2 text-sm'
						>
							<option value='newest'>Новинки</option>
							<option value='price-asc'>Цена ↑</option>
							<option value='price-desc'>Цена ↓</option>
							<option value='name'>По названию</option>
							<option value='rating'>По рейтингу</option>
						</select>
					</div>
				</div>

				<div className='min-w-0 flex-1'>
					<div className='mb-4 flex items-start justify-between'>
						<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							{categoryName}
						</h1>
						<ViewToggle />
					</div>

					{/* Search */}
					<div className='mb-4 flex gap-2'>
						<input
							type='search'
							placeholder='Поиск в категории...'
							value={searchInput}
							onChange={e => setSearchInput(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									updateParams({ search: searchInput || undefined, page: '1' })
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
					</div>

					<ResultsBar total={totalProducts} />

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
	)
}
