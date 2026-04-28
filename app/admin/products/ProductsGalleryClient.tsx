'use client'

import { useMemo } from 'react'
import { Pencil, Plus, Trash2, ImagePlus } from 'lucide-react'
import {
	readBooleanParam,
	readPositiveIntParam,
	readStringParam,
	useDebouncedValue,
} from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import ProductFilters, {
	type ProductFiltersState,
} from '@/shared/admin/products/ProductFilters'
import ProductFormModal from './ProductFormModal'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'

type ProductListItem = {
	id: string
	name: string
	price?: number | null
	compareAtPrice?: number | null
	stock: number
	isActive: boolean
	brand?: string | null
	category?: {
		name?: string | null
	} | null
	images?: Array<{
		url?: string | null
		displayUrl?: string | null
	}> | null
}
type CategoryOption = RouterOutputs['categories']['getAll'][number]
type ProductSortBy = 'newest' | 'price-asc' | 'price-desc' | 'name'

export default function ProductsGalleryClient() {
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const page = readPositiveIntParam(searchParams.get('page'), 1)
	const showCreate =
		readBooleanParam(searchParams.get('create'), false) === true
	const editId = readStringParam(searchParams.get('edit')) || null
	const filters: ProductFiltersState = {
		search: readStringParam(searchParams.get('search')),
		categorySlug: readStringParam(searchParams.get('category')),
		brand: readStringParam(searchParams.get('brand')),
		sortBy: readStringParam(searchParams.get('sort')),
		inStock: readBooleanParam(searchParams.get('inStock')),
	}
	const sortBy = filters.sortBy as ProductSortBy | ''
	const debouncedSearch = useDebouncedValue(filters.search, 300)

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: debouncedSearch || undefined,
		categorySlug: filters.categorySlug || undefined,
		brand: filters.brand || undefined,
		sortBy: sortBy || undefined,
		inStock: filters.inStock,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const products = useMemo(
		() => (data?.items ?? []) as ProductListItem[],
		[data?.items],
	)

	const brands = useMemo(() => {
		const set = new Set<string>()
		products.forEach(product => {
			if (product.brand) set.add(product.brand)
		})
		return Array.from(set).sort()
	}, [products])

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Товары
				</h1>
				<Button
					variant='primary'
					size='sm'
					onClick={() => {
						updateSearchParams(
							{ create: true, edit: null },
							{ history: 'push' },
						)
					}}
				>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			<ProductFilters
				initialFilters={filters}
				categories={
					categories?.map((category: CategoryOption) => ({
						value: category.slug,
						label: category.name,
					})) ?? []
				}
				brands={brands.map(brand => ({ value: brand, label: brand }))}
				onFilterChange={nextFilters => {
					updateSearchParams(
						{
							search: nextFilters.search,
							category: nextFilters.categorySlug,
							brand: nextFilters.brand,
							sort: nextFilters.sortBy,
							inStock: nextFilters.inStock,
							page: 1,
						},
						{ history: 'replace' },
					)
				}}
			/>

			{(showCreate || Boolean(editId)) && (
				<ProductFormModal
					editId={editId}
					onClose={() =>
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
					}
					onSuccess={() => {
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
						refetch()
					}}
				/>
			)}

			{/* Card grid */}
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
				{products.map(product => {
					const previewImage =
						product.images?.[0]?.displayUrl ?? product.images?.[0]?.url ?? null
					return (
						<div
							key={product.id}
							className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50'
						>
							{/* Status dot */}
							<div
								className={`absolute left-2.5 top-2.5 z-10 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
									product.isActive ? 'bg-emerald-400' : 'bg-red-400'
								}`}
								title={product.isActive ? 'Активный' : 'Скрытый'}
							/>

							{/* Actions */}
							<div className='absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
								<button
									onClick={() => {
										updateSearchParams(
											{ edit: product.id, create: null },
											{ history: 'push' },
										)
									}}
									className='rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60'
									aria-label='Редактировать'
								>
									<Pencil className='h-3.5 w-3.5' />
								</button>
								<button
									onClick={() => {
										if (confirm('Удалить товар?')) deleteMut.mutate(product.id)
									}}
									className='rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/70'
									aria-label='Удалить'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</div>

							{/* Image */}
							<div className='aspect-square w-full bg-muted/50'>
								{previewImage ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={previewImage}
										alt={product.name}
										className='h-full w-full object-cover'
									/>
								) : (
									<div className='flex h-full w-full items-center justify-center'>
										<ImagePlus className='h-8 w-8 text-muted-foreground/30' />
									</div>
								)}
							</div>

							{/* Info */}
							<div className='flex flex-1 flex-col gap-1 px-3 py-2.5'>
								<span className='line-clamp-2 text-sm font-medium leading-tight text-foreground'>
									{product.name}
								</span>
								<div className='mt-auto flex items-baseline gap-2'>
									<span className='text-sm font-semibold text-foreground'>
										{product.price?.toLocaleString('ru-RU')} ₽
									</span>
									{product.compareAtPrice != null &&
										product.compareAtPrice > 0 && (
											<span className='text-xs text-muted-foreground line-through'>
												{product.compareAtPrice.toLocaleString('ru-RU')} ₽
											</span>
										)}
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{products.length === 0 && (
				<div className='rounded-2xl border border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground'>
					Товары не найдены
				</div>
			)}

			{/* Pagination */}
			{data && data.totalPages > 1 && (
				<div className='flex items-center justify-center gap-2'>
					<button
						onClick={() =>
							updateSearchParams(
								{ page: Math.max(1, page - 1) },
								{ history: 'replace' },
							)
						}
						disabled={page === 1}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Назад
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {data.totalPages}
					</span>
					<button
						onClick={() =>
							updateSearchParams(
								{ page: Math.min(data.totalPages, page + 1) },
								{ history: 'replace' },
							)
						}
						disabled={page === data.totalPages}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Далее
					</button>
				</div>
			)}
		</div>
	)
}
