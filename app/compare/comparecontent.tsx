'use client'

import { useState, useMemo, Fragment } from 'react'
import { cn } from '@/shared/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { useCompare } from '@/features/compare/usecompare'
import CompareProductCard from '@/features/compare/ui/compareproductcard'
import { useFavorites } from '@/features/favorites/usefavorites'
import { useCart } from '@/features/cart/usecart'
import { Button } from '@/shared/ui/button'
import EmptyState from '@/shared/ui/emptystate'
import { getProductImageUrl } from '@/shared/lib/productutils'
import { CompareContentSkeleton } from '@/shared/ui/storefrontskeletons'
import { PriceBYN } from '@/shared/ui/pricebyn'
import type { ProductImage } from '@/shared/types/product'

/* ─────── types ─────── */

interface CompareProduct {
	id: string
	name: string
	slug: string
	image: string
	price: number
	oldPrice?: number
	brand: string | null
	brandCountry: string | null
	description: string | null
	rating: number | null
	stock: number
	categoryId: string | null
	categoryName: string
	/** key → value map from ProductPropertyValue rows */
	properties: Record<string, string>
	/** all property keys with labels */
	propertyLabels: Record<string, string>
}

interface SpecRow {
	key: string
	label: string
	group: string
	values: (string | null)[]
}

interface CompareSourceProduct {
	id: string
	name: string
	slug: string
	images?: ProductImage[] | null
	price?: number | null
	compareAtPrice?: number | null
	brand: string | null
	brandCountry: string | null
	description: string | null
	rating: number | null
	stock: number
	category?: { id: string; name: string } | null
	properties?: Array<{
		propertyValue: { slug: string; value: string } | null
		property: {
			slug: string
			name: string
		}
	}> | null
}

/* ─────── constants ─────── */

const FIXED_SPECS: {
	key: string
	label: string
	group: string
	getter: (p: CompareProduct) => string | null
}[] = [
	{ key: '_name', label: 'Название', group: 'Основные', getter: p => p.name },
	{
		key: '_price',
		label: 'Цена',
		group: 'Основные',
		getter: p => (p.price ? String(p.price) : null),
	},
	{ key: '_brand', label: 'Бренд', group: 'Основные', getter: p => p.brand },
	{
		key: '_brandCountry',
		label: 'Страна бренда',
		group: 'Основные',
		getter: p => p.brandCountry,
	},
	{
		key: '_rating',
		label: 'Рейтинг',
		group: 'Основные',
		getter: p => (p.rating != null ? String(p.rating) : null),
	},
	{
		key: '_stock',
		label: 'В наличии',
		group: 'Основные',
		getter: p => (p.stock > 0 ? `${p.stock} шт.` : 'Нет'),
	},
	{
		key: '_description',
		label: 'Описание',
		group: 'Основные',
		getter: p => p.description,
	},
]

const DYNAMIC_GROUP = 'Характеристики'

/* ─────── component ─────── */

export default function CompareContent() {
	const { productIds, remove, clear } = useCompare()
	const favorites = useFavorites()
	const cart = useCart()

	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [filterMode, setFilterMode] = useState<'all' | 'diff'>('all')

	/* ── fetch products with properties ── */
	const { data: productsRaw, isLoading: isProductsLoading } =
		trpc.products.getByIds.useQuery(productIds, {
			enabled: productIds.length > 0,
		})

	/* ── map to CompareProduct ── */
	const allProducts = useMemo<CompareProduct[]>(() => {
		if (!productsRaw) return []
		const safeProducts = (productsRaw ?? []) as unknown as CompareSourceProduct[]
		return safeProducts.map(p => {
			const props: Record<string, string> = {}
			const labels: Record<string, string> = {}
			for (const pv of p.properties ?? []) {
				if (!pv.propertyValue) continue
				props[pv.property.slug] = pv.propertyValue.value
				labels[pv.property.slug] = pv.property.name
			}
			return {
				id: p.id,
				name: p.name,
				slug: p.slug,
				image: getProductImageUrl(p),
				price: p.price ? Number(p.price) : 0,
				oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
				brand: p.brand,
				brandCountry: p.brandCountry,
				description: p.description,
				rating: p.rating,
				stock: p.stock,
				categoryId: p.category?.id ?? null,
				categoryName: p.category?.name ?? 'Без категории',
				properties: props,
				propertyLabels: labels,
			}
		})
	}, [productsRaw])

	/* ── categories for filter ── */
	const categories = useMemo(() => {
		const map = new Map<
			string,
			{ id: string | null; name: string; count: number }
		>()
		for (const p of allProducts) {
			const key = p.categoryId ?? '__none'
			const existing = map.get(key)
			if (existing) {
				existing.count++
			} else {
				map.set(key, { id: p.categoryId, name: p.categoryName, count: 1 })
			}
		}
		return Array.from(map.values())
	}, [allProducts])

	/* ── filtered products ── */
	const products = useMemo(() => {
		if (!selectedCategory) return allProducts
		return allProducts.filter(
			p => (p.categoryId ?? '__none') === selectedCategory,
		)
	}, [allProducts, selectedCategory])

	/* ── build spec rows ── */
	const specRows = useMemo<SpecRow[]>(() => {
		if (products.length === 0) return []

		const rows: SpecRow[] = []

		// Fixed specs
		for (const spec of FIXED_SPECS) {
			rows.push({
				key: spec.key,
				label: spec.label,
				group: spec.group,
				values: products.map(p => spec.getter(p)),
			})
		}

		// Collect all dynamic property keys across all compared products
		const allKeys = new Map<string, string>()
		for (const p of products) {
			for (const [key, label] of Object.entries(p.propertyLabels)) {
				if (!allKeys.has(key)) allKeys.set(key, label)
			}
		}

		// Dynamic property rows
		for (const [key, label] of allKeys) {
			rows.push({
				key,
				label,
				group: DYNAMIC_GROUP,
				values: products.map(p => p.properties[key] ?? null),
			})
		}

		// Filter: only differing
		if (filterMode === 'diff') {
			return rows.filter(row => {
				const filled = row.values.filter(v => v != null)
				if (filled.length <= 1) return true // show rows with mostly empty too
				return new Set(filled).size > 1
			})
		}

		return rows
	}, [products, filterMode])

	/* ── group rows ── */
	const groupedRows = useMemo(() => {
		const groups: { name: string; rows: SpecRow[] }[] = []
		const map = new Map<string, SpecRow[]>()
		for (const row of specRows) {
			let arr = map.get(row.group)
			if (!arr) {
				arr = []
				map.set(row.group, arr)
				groups.push({ name: row.group, rows: arr })
			}
			arr.push(row)
		}
		return groups
	}, [specRows])

	/* ─────── empty state ─────── */
	if (productIds.length === 0) {
		return (
			<EmptyState
				title='Список сравнения пуст'
				description='Добавьте товары в сравнение, чтобы увидеть отличия по характеристикам.'
				primaryAction={{ label: 'Перейти в каталог', href: '/catalog' }}
			/>
		)
	}

	if (isProductsLoading && !productsRaw) {
		return <CompareContentSkeleton />
	}

	return (
		<>
			{/* Heading */}
			<div className='flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-end sm:justify-between md:py-6'>
				<div>
					<p className='mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Сравнение товаров
					</p>
					<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
						Сравнение{' '}
						<span className='text-base font-normal text-muted-foreground'>
							{allProducts.length} {pluralizeProduct(allProducts.length)}
						</span>
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Сопоставьте цены, бренд, наличие и характеристики в одной таблице.
					</p>
				</div>
				<div className='flex flex-wrap gap-2'>
					{(selectedCategory || filterMode !== 'all') && (
						<Button
							variant='ghost'
							onClick={() => {
								setSelectedCategory(null)
								setFilterMode('all')
							}}
						>
							Сбросить фильтры
						</Button>
					)}
					<Button variant='ghost' onClick={clear}>
						Очистить сравнение
					</Button>
				</div>
			</div>

			{(selectedCategory || filterMode !== 'all') && (
				<div className='flex flex-wrap gap-2 py-4'>
					{selectedCategory && (
						<Button
							variant='subtle'
							size='compact'
							onClick={() => setSelectedCategory(null)}
						>
							Категория: {categories.find(cat => (cat.id ?? '__none') === selectedCategory)?.name ?? 'Выбрана'}
						</Button>
					)}
					{filterMode === 'diff' && (
						<Button
							variant='subtle'
							size='compact'
							onClick={() => setFilterMode('all')}
						>
							Только различия
						</Button>
					)}
				</div>
			)}

			{/* Category filter */}
			{categories.length > 1 && (
				<div className='flex gap-3 overflow-x-auto border-b border-border pb-0 scrollbar-hide'>
					<button
						onClick={() => setSelectedCategory(null)}
						className={cn(
							'shrink-0 pb-2 text-sm transition-colors',
							!selectedCategory
								? 'border-b-2 border-foreground font-medium text-foreground'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						Все товары{' '}
						<span className='text-muted-foreground'>{allProducts.length}</span>
					</button>
					{categories.map(cat => (
						<button
							key={cat.id ?? '__none'}
							onClick={() => setSelectedCategory(cat.id ?? '__none')}
							className={cn(
								'shrink-0 pb-2 text-sm transition-colors',
								selectedCategory === (cat.id ?? '__none')
									? 'border-b-2 border-foreground font-medium text-foreground'
									: 'text-muted-foreground hover:text-foreground',
							)}
						>
							{cat.name}{' '}
							<span className='text-muted-foreground'>{cat.count}</span>
						</button>
					))}
				</div>
			)}

			{/* No products in selected category */}
			{products.length === 0 && selectedCategory && (
				<div className='py-12 text-center'>
					<p className='text-muted-foreground'>
						Нет товаров этой категории для сравнения
					</p>
				</div>
			)}

			{products.length > 0 && (
				<div className='overflow-x-auto pb-4 scrollbar-hide'>
					<table className='mt-4 w-full min-w-[700px] border-collapse'>
						{/* ── Product cards header row ── */}
						<thead>
							<tr>
								{/* Filter column */}
								<th className='sticky left-0 z-10 min-w-[160px] bg-background p-2 text-left align-top'>
									<div className='flex flex-col gap-3'>
										{(['all', 'diff'] as const).map(v => (
											<label
												key={v}
												className='flex cursor-pointer items-center gap-2 text-sm text-foreground'
												onClick={() => setFilterMode(v)}
											>
												<span
													className={cn(
														'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
														filterMode === v
															? 'border-foreground'
															: 'border-muted-foreground',
													)}
												>
													{filterMode === v && (
														<span className='h-2.5 w-2.5 rounded-full bg-foreground' />
													)}
												</span>
												{v === 'all' ? 'Все характеристики' : 'Только различия'}
											</label>
										))}
									</div>
								</th>

								{/* Product cards */}
								{products.map(product => {
									return (
										<th
											key={product.id}
											className='min-w-[180px] p-2 align-top font-normal'
										>
											<CompareProductCard
												name={product.name}
												href={`/product/${product.slug}`}
												image={product.image}
												price={product.price}
												oldPrice={product.oldPrice}
												isFavorite={favorites.has(product.id)}
												onToggleFavorite={() => favorites.toggle(product.id)}
												onRemove={() => remove(product.id)}
												isInCart={cart.has(product.id)}
												onAddToCart={() => cart.add(product.id)}
											/>
										</th>
									)
								})}
							</tr>
						</thead>

						{/* ── Spec rows ── */}
						<tbody>
							{groupedRows.map(group => (
								<Fragment key={`group-${group.name}`}>
									{/* Group header */}
									<tr>
										<td
											colSpan={products.length + 1}
											className='border-t border-border bg-muted/30 px-2 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
										>
											{group.name}
										</td>
									</tr>

									{/* Spec rows */}
									{group.rows.map(row => (
										<tr key={row.key} className='border-t border-border'>
											<td className='sticky left-0 z-10 bg-background px-2 py-2 text-sm text-muted-foreground'>
												{row.label}
											</td>
											{row.values.map((val, i) => (
												<td
													key={i}
													className='px-2 py-2 text-sm text-foreground'
												>
													{val != null ? (
														row.key === '_price' ? (
															<PriceBYN value={Number(val)} />
														) : (
															val
														)
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</td>
											))}
										</tr>
									))}
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
		</>
	)
}

function pluralizeProduct(n: number): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 14) return 'товаров'
	if (mod10 === 1) return 'товар'
	if (mod10 >= 2 && mod10 <= 4) return 'товара'
	return 'товаров'
}
