'use client'

import { useState, useMemo, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { useCompare } from '@/features/compare/useCompare'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCart } from '@/features/cart/useCart'
import { Button } from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'

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

/* ─────── constants ─────── */

const FIXED_SPECS: { key: string; label: string; group: string; getter: (p: CompareProduct) => string | null }[] = [
	{ key: '_name', label: 'Название', group: 'Основные', getter: p => p.name },
	{ key: '_price', label: 'Цена', group: 'Основные', getter: p => p.price ? `${p.price.toLocaleString('ru-RU')} руб.` : null },
	{ key: '_brand', label: 'Бренд', group: 'Основные', getter: p => p.brand },
	{ key: '_brandCountry', label: 'Страна бренда', group: 'Основные', getter: p => p.brandCountry },
	{ key: '_rating', label: 'Рейтинг', group: 'Основные', getter: p => p.rating != null ? String(p.rating) : null },
	{ key: '_stock', label: 'В наличии', group: 'Основные', getter: p => p.stock > 0 ? `${p.stock} шт.` : 'Нет' },
	{ key: '_description', label: 'Описание', group: 'Основные', getter: p => p.description },
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
	const { data: productsRaw } = trpc.products.getByIds.useQuery(productIds, {
		enabled: productIds.length > 0,
	})

	/* ── map to CompareProduct ── */
	const allProducts = useMemo<CompareProduct[]>(() => {
		if (!productsRaw) return []
		return productsRaw.map(p => {
			const props: Record<string, string> = {}
			const labels: Record<string, string> = {}
			for (const pv of p.properties ?? []) {
				props[pv.property.key] = pv.value
				labels[pv.property.key] = pv.property.name
			}
			return {
				id: p.id,
				name: p.name,
				slug: p.slug,
				image: (p as { imagePath?: string | null }).imagePath ?? (Array.isArray(p.images) ? (p.images as string[])[0] : null) ?? '/bulb.svg',
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
		const map = new Map<string, { id: string | null; name: string; count: number }>()
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
		return allProducts.filter(p => (p.categoryId ?? '__none') === selectedCategory)
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

	return (
		<>
			{/* Heading */}
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
					Сравнение{' '}
					<span className='text-muted-foreground font-normal text-base'>
						{allProducts.length} {pluralizeProduct(allProducts.length)}
					</span>
				</h1>
				<Button variant='ghost' onClick={clear}>
					Очистить сравнение
				</Button>
			</div>

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
						Все товары <span className='text-muted-foreground'>{allProducts.length}</span>
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
							{cat.name} <span className='text-muted-foreground'>{cat.count}</span>
						</button>
					))}
				</div>
			)}

			{/* No products in selected category */}
			{products.length === 0 && selectedCategory && (
				<div className='py-12 text-center'>
					<p className='text-muted-foreground'>Нет товаров этой категории для сравнения</p>
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
														filterMode === v ? 'border-foreground' : 'border-muted-foreground',
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
									const hasDiscount = product.oldPrice != null && product.oldPrice > product.price
									return (
										<th key={product.id} className='min-w-[180px] p-2 align-top font-normal'>
											<div className='flex flex-col'>
												{/* Actions */}
												<div className='mb-2 flex items-center justify-end gap-1'>
													<Button
														variant='icon'
														aria-label='В избранное'
														onClick={() => favorites.toggle(product.id)}
													>
														<Heart
															className={cn(
																'h-4 w-4',
																favorites.has(product.id) && 'fill-foreground text-foreground',
															)}
														/>
													</Button>
													<Button
														variant='icon'
														aria-label='Удалить из сравнения'
														onClick={() => remove(product.id)}
													>
														<X className='h-4 w-4' />
													</Button>
												</div>

												{/* Image */}
												<Link href={`/product/${product.slug}`} className='relative mb-3 block h-40 w-full'>
													<Image src={product.image} alt={product.name} fill className='object-contain' />
												</Link>

												{/* Name */}
												<Link href={`/product/${product.slug}`} className='mb-2'>
													<h3 className='line-clamp-2 text-sm tracking-wide text-foreground transition-colors hover:text-primary'>
														{product.name}
													</h3>
												</Link>

												{/* Price */}
												<div className='mb-4 flex flex-wrap items-center gap-2'>
													<span className={cn('text-base font-semibold', hasDiscount ? 'text-primary' : 'text-foreground')}>
														{product.price.toLocaleString('ru-RU')} руб.
													</span>
													{hasDiscount && (
														<span className='text-sm text-muted-foreground line-through'>
															{product.oldPrice!.toLocaleString('ru-RU')} руб.
														</span>
													)}
												</div>

												{/* CTA */}
												<Button
													variant='primary'
													size='xs'
													fullWidth
													className='mt-auto py-3'
													onClick={() => cart.add(product.id)}
												>
													В корзину
												</Button>
											</div>
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
												<td key={i} className='px-2 py-2 text-sm text-foreground'>
													{val ?? <span className='text-muted-foreground'>—</span>}
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
