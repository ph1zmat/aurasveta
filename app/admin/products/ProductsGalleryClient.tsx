'use client'

import { useMemo, useState } from 'react'
import {
	Pencil,
	Plus,
	Trash2,
	ImagePlus,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import { generateSlug } from '@/shared/lib/generateSlug'
import ProductImagesField, {
	type EditableProductImage,
} from './ProductImagesField'
import ProductFilters, {
	type ProductFiltersState,
} from '@/shared/admin/products/ProductFilters'

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
	const [page, setPage] = useState(1)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [filters, setFilters] = useState<ProductFiltersState>({
		search: '',
		categorySlug: '',
		brand: '',
		sortBy: '',
		inStock: undefined,
	})
	const sortBy = filters.sortBy as ProductSortBy | ''

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: filters.search || undefined,
		categorySlug: filters.categorySlug || undefined,
		brand: filters.brand || undefined,
		sortBy: sortBy || undefined,
		inStock: filters.inStock,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const products = useMemo(
		() => ((data?.items ?? []) as ProductListItem[]),
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
						setEditId(null)
						setShowForm(true)
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
					setFilters(nextFilters)
					setPage(1)
				}}
			/>

			{showForm && (
				<ProductFormModal
					editId={editId}
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
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
										setEditId(product.id)
										setShowForm(true)
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
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Назад
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {data.totalPages}
					</span>
					<button
						onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
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

type ProductDetails = RouterOutputs['products']['getById']
type ProductImageItem = NonNullable<
	NonNullable<ProductDetails>['images']
>[number]

function ProductFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const { data: product, isLoading } = trpc.products.getById.useQuery(editId!, {
		enabled: !!editId,
	})

	if (editId && isLoading) {
		return (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
				<div className='rounded-2xl bg-background p-6 shadow-xl'>
					<p className='text-sm text-muted-foreground'>Загрузка...</p>
				</div>
			</div>
		)
	}

	return (
		<ProductForm
			key={editId ?? 'new'}
			editId={editId}
			product={product ?? null}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function ProductForm({
	editId,
	product,
	onClose,
	onSuccess,
}: {
	editId: string | null
	product: ProductDetails | null
	onClose: () => void
	onSuccess: () => void
}) {
	const { data: categories } = trpc.categories.getAll.useQuery()
	const createMut = trpc.products.create.useMutation({ onSuccess })
	const updateMut = trpc.products.update.useMutation({ onSuccess })

	const [form, setForm] = useState({
		name: product?.name ?? '',
		slug: product?.slug ?? '',
		description: product?.description ?? '',
		price: product?.price?.toString() ?? '',
		compareAtPrice: product?.compareAtPrice?.toString() ?? '',
		stock: product?.stock?.toString() ?? '0',
		sku: product?.sku ?? '',
		categoryId: product?.categoryId ?? '',
		brand: product?.brand ?? '',
		brandCountry: product?.brandCountry ?? '',
		isActive: product?.isActive ?? true,
	})
	const [images, setImages] = useState<EditableProductImage[]>(
		() =>
			product?.images?.map((image: ProductImageItem) => ({
				id: image.id,
				url: image.url,
				key: image.key,
				originalName: image.originalName ?? undefined,
				size: image.size ?? null,
				mimeType: image.mimeType ?? null,
				order: image.order,
				isMain: image.isMain,
			})) ?? [],
	)
	const [slugTouched, setSlugTouched] = useState(!!product?.slug)

	function updateField(key: string, value: string | boolean) {
		setForm(previous => ({ ...previous, [key]: value }))
	}

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()

		const payload = {
			name: form.name,
			slug: form.slug,
			description: form.description || undefined,
			price: form.price ? parseFloat(form.price) : undefined,
			compareAtPrice: form.compareAtPrice
				? parseFloat(form.compareAtPrice)
				: undefined,
			stock: parseInt(form.stock, 10) || 0,
			sku: form.sku || undefined,
			categoryId: form.categoryId || undefined,
			brand: form.brand || undefined,
			brandCountry: form.brandCountry || undefined,
			isActive: form.isActive,
			images: images.map((image, index) => ({
				id: image.id,
				url: image.url,
				key: image.key,
				originalName: image.originalName ?? null,
				size: image.size ?? null,
				mimeType: image.mimeType ?? null,
				order: index,
				isMain: image.isMain,
			})),
		}

		if (editId) {
			updateMut.mutate({ id: editId, ...payload })
			return
		}

		createMut.mutate(payload)
	}
	const formId = 'product-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={onClose}
			title={editId ? 'Редактировать товар' : 'Новый товар'}
			size='xl'
			scrollable
			footer={[
				<Button key='cancel' variant='outline' type='button' onClick={onClose}>
					Отмена
				</Button>,
				<Button
					key='submit'
					variant='primary'
					type='submit'
					form={formId}
					disabled={createMut.isPending || updateMut.isPending}
				>
					{createMut.isPending || updateMut.isPending
						? 'Сохранение...'
						: 'Сохранить'}
				</Button>,
			]}
		>
			<div className='p-6'>
				<form id={formId} onSubmit={handleSubmit} className='space-y-6'>
					<div className='flex justify-end'>
						<label className='inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1.5 text-sm text-foreground'>
							<input
								type='checkbox'
								id='isActive'
								checked={form.isActive}
								onChange={event => updateField('isActive', event.target.checked)}
								className='h-4 w-4 rounded border-border accent-primary'
							/>
							<span>Активный</span>
						</label>
					</div>

					<div className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]'>
						<div>
							<ProductImagesField
								images={images}
								onChange={setImages}
								disabled={createMut.isPending || updateMut.isPending}
								canUpload={Boolean(editId)}
								showHeader={false}
								emptyTitle={
									editId
										? 'Загрузите фото товара'
										: 'Сохраните товар, чтобы загрузить фото'
								}
								emptyDescription={
									editId
										? 'После загрузки ниже появятся миниатюры, а главное фото можно будет выбрать в один клик.'
										: ''
								}
							/>
						</div>

						<div className='space-y-4'>
							<FormField label='Название' required>
							<input
								value={form.name}
								onChange={event => {
									const name = event.target.value
									setForm(previous => ({
										...previous,
										name,
										slug: slugTouched ? previous.slug : generateSlug(name),
									}))
								}}
								required
									placeholder='Введите название товара'
								className='input-field'
							/>
						</FormField>

							<div className='grid gap-4 sm:grid-cols-2'>
								<FormField label='Цена'>
							<input
								type='number'
								step='0.01'
								value={form.price}
								onChange={event => updateField('price', event.target.value)}
										placeholder='0'
								className='input-field'
							/>
						</FormField>
								<FormField label='Старая цена'>
							<input
								type='number'
								step='0.01'
								value={form.compareAtPrice}
								onChange={event =>
									updateField('compareAtPrice', event.target.value)
								}
										placeholder='0'
								className='input-field'
							/>
						</FormField>
							</div>
						</div>
					</div>

					<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
						<FormField label='Описание'>
							<textarea
								value={form.description}
								onChange={event => updateField('description', event.target.value)}
								rows={11}
								placeholder='Опишите товар...'
								className='input-field resize-none'
							/>
						</FormField>

						<div className='space-y-4'>
							<FormField label='Slug' required>
							<input
									value={form.slug}
									onChange={event => {
										setSlugTouched(true)
										updateField('slug', event.target.value)
									}}
									onBlur={() => {
										if (!form.slug) return
										setSlugTouched(true)
										updateField('slug', generateSlug(form.slug))
									}}
									required
									placeholder='auto-generated'
								className='input-field'
							/>
						</FormField>

							<FormField label='SKU'>
							<input
									value={form.sku}
									onChange={event => updateField('sku', event.target.value)}
									placeholder='Артикул'
								className='input-field'
							/>
						</FormField>

							<FormField label='Категория'>
								<select
									value={form.categoryId}
									onChange={event =>
										updateField('categoryId', event.target.value)
									}
									className='input-field'
								>
									<option value=''>Без категории</option>
									{categories?.map((category: CategoryOption) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
							</FormField>

							<FormField label='Бренд'>
								<input
									value={form.brand}
									onChange={event => updateField('brand', event.target.value)}
									placeholder='Бренд'
									className='input-field'
								/>
							</FormField>

							<FormField label='Страна'>
								<input
									value={form.brandCountry}
									onChange={event =>
										updateField('brandCountry', event.target.value)
									}
									placeholder='Страна бренда'
									className='input-field'
								/>
							</FormField>
						</div>
					</div>

					<div className='rounded-2xl border border-border bg-muted/10 p-4'>
						<div className='flex items-center justify-between gap-3'>
							<div>
								<h3 className='text-sm font-medium text-foreground'>
									Характеристики
								</h3>
								<p className='text-xs text-muted-foreground'>
									Здесь появятся характеристики товара после следующего шага
									редактирования.
								</p>
							</div>
							<Button type='button' variant='outline' disabled>
								Добавить
							</Button>
						</div>
						<div className='mt-4 rounded-xl border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted-foreground'>
							Нет характеристик. Добавить первую
						</div>
					</div>

					<div className='flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-end sm:justify-between'>
						<div className='w-full sm:max-w-[180px]'>
							<FormField label='Остаток'>
								<input
									type='number'
									value={form.stock}
									onChange={event => updateField('stock', event.target.value)}
									placeholder='0'
									className='input-field'
								/>
							</FormField>
						</div>
					</div>
				</form>
			</div>
		</AdminModal>
	)
}

function FormField({
	label,
	required,
	children,
}: {
	label: string
	required?: boolean
	children: React.ReactNode
}) {
	return (
		<div className='space-y-1'>
			<label className='text-sm font-medium text-foreground'>
				{label}
				{required ? <span className='text-destructive'> *</span> : null}
			</label>
			{children}
		</div>
	)
}
