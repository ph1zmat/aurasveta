'use client'

import { useMemo, useState } from 'react'
import {
	Pencil,
	Plus,
	Trash2,
	SlidersHorizontal,
	X,
	ImagePlus,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { generateSlug } from '@/shared/lib/generateSlug'
import ProductImagesField, {
	type EditableProductImage,
} from './ProductImagesField'

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

function FilterSelect({
	label,
	value,
	onChange,
	options,
	placeholder,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
	placeholder?: string
}) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-xs font-medium text-muted-foreground'>{label}</span>
			<select
				value={value}
				onChange={e => onChange(e.target.value)}
				className='h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
			>
				{placeholder && <option value=''>{placeholder}</option>}
				{options.map(o => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default function ProductsGalleryClient() {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [showFilters, setShowFilters] = useState(false)

	const [categorySlug, setCategorySlug] = useState('')
	const [brand, setBrand] = useState('')
	const [sortBy, setSortBy] = useState('')
	const [inStock, setInStock] = useState<boolean | undefined>(undefined)

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: search || undefined,
		categorySlug: categorySlug || undefined,
		brand: brand || undefined,
		sortBy: (sortBy as any) || undefined,
		inStock,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const brands = useMemo(() => {
		const set = new Set<string>()
		data?.items.forEach((p: any) => {
			if (p.brand) set.add(p.brand)
		})
		return Array.from(set).sort()
	}, [data])

	const activeFilterCount = [
		categorySlug,
		brand,
		sortBy,
		inStock !== undefined ? 'x' : '',
	].filter(Boolean).length

	const clearFilters = () => {
		setCategorySlug('')
		setBrand('')
		setSortBy('')
		setInStock(undefined)
		setPage(1)
	}

	const products = (data?.items ?? []) as unknown as ProductListItem[]

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

			{/* Search + filter toggle */}
			<div className='flex items-center gap-2'>
				<input
					type='search'
					placeholder='Поиск по названию...'
					value={search}
					onChange={e => {
						setSearch(e.target.value)
						setPage(1)
					}}
					className='flex h-9 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
				<button
					onClick={() => setShowFilters(f => !f)}
					className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
						showFilters || activeFilterCount > 0
							? 'border-primary/50 bg-primary/10 text-primary'
							: 'border-border bg-background text-muted-foreground hover:text-foreground'
					}`}
				>
					<SlidersHorizontal className='h-3.5 w-3.5' />
					Фильтры
					{activeFilterCount > 0 && (
						<span className='ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
							{activeFilterCount}
						</span>
					)}
				</button>
			</div>

			{/* Filter panel */}
			{showFilters && (
				<div className='rounded-xl border border-border bg-muted/30 p-4'>
					<div className='flex flex-wrap items-end gap-3'>
						<FilterSelect
							label='Категория'
							value={categorySlug}
							onChange={v => {
								setCategorySlug(v)
								setPage(1)
							}}
							options={
								categories?.map((c: any) => ({
									value: c.slug,
									label: c.name,
								})) ?? []
							}
							placeholder='Все категории'
						/>
						<FilterSelect
							label='Бренд'
							value={brand}
							onChange={v => {
								setBrand(v)
								setPage(1)
							}}
							options={brands.map(b => ({ value: b, label: b }))}
							placeholder='Все бренды'
						/>
						<FilterSelect
							label='Сортировка'
							value={sortBy}
							onChange={setSortBy}
							options={[
								{ value: 'newest', label: 'Сначала новые' },
								{ value: 'price-asc', label: 'Цена ↑' },
								{ value: 'price-desc', label: 'Цена ↓' },
								{ value: 'name', label: 'По названию' },
							]}
							placeholder='По умолчанию'
						/>
						<div className='flex flex-col gap-1'>
							<span className='text-xs font-medium text-muted-foreground'>
								Наличие
							</span>
							<div className='flex h-9 items-center gap-3 rounded-lg border border-border bg-background px-3'>
								{(
									[
										{ label: 'Все', val: undefined },
										{ label: 'В наличии', val: true },
										{ label: 'Нет', val: false },
									] as { label: string; val: boolean | undefined }[]
								).map(opt => (
									<button
										key={String(opt.val)}
										type='button'
										onClick={() => {
											setInStock(opt.val)
											setPage(1)
										}}
										className={`text-xs transition-colors ${
											inStock === opt.val
												? 'font-semibold text-foreground'
												: 'text-muted-foreground hover:text-foreground'
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>
						{activeFilterCount > 0 && (
							<button
								onClick={clearFilters}
								className='flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
							>
								<X className='h-3.5 w-3.5' />
								Сбросить
							</button>
						)}
					</div>
				</div>
			)}

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

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl'>
				<h2 className='mb-6 text-lg font-semibold text-foreground'>
					{editId ? 'Редактировать товар' : 'Новый товар'}
				</h2>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<ProductImagesField
						images={images}
						onChange={setImages}
						disabled={createMut.isPending || updateMut.isPending}
					/>

					<div className='grid grid-cols-2 gap-4'>
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
								className='input-field'
							/>
						</FormField>
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
								className='input-field'
							/>
						</FormField>
					</div>

					<FormField label='Описание'>
						<textarea
							value={form.description}
							onChange={event => updateField('description', event.target.value)}
							rows={3}
							className='input-field resize-none'
						/>
					</FormField>

					<div className='grid grid-cols-3 gap-4'>
						<FormField label='Цена'>
							<input
								type='number'
								step='0.01'
								value={form.price}
								onChange={event => updateField('price', event.target.value)}
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
								className='input-field'
							/>
						</FormField>
						<FormField label='Остаток'>
							<input
								type='number'
								value={form.stock}
								onChange={event => updateField('stock', event.target.value)}
								className='input-field'
							/>
						</FormField>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<FormField label='SKU'>
							<input
								value={form.sku}
								onChange={event => updateField('sku', event.target.value)}
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
								<option value=''>— Без категории —</option>
								{categories?.map((category: CategoryOption) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</FormField>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<FormField label='Бренд'>
							<input
								value={form.brand}
								onChange={event => updateField('brand', event.target.value)}
								className='input-field'
							/>
						</FormField>
						<FormField label='Страна бренда'>
							<input
								value={form.brandCountry}
								onChange={event =>
									updateField('brandCountry', event.target.value)
								}
								className='input-field'
							/>
						</FormField>
					</div>

					<div className='flex items-center gap-2'>
						<input
							type='checkbox'
							id='isActive'
							checked={form.isActive}
							onChange={event => updateField('isActive', event.target.checked)}
						/>
						<label htmlFor='isActive' className='text-sm text-foreground'>
							Активный (показывать в каталоге)
						</label>
					</div>

					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' type='button' onClick={onClose}>
							Отмена
						</Button>
						<Button
							variant='primary'
							type='submit'
							disabled={createMut.isPending || updateMut.isPending}
						>
							{createMut.isPending || updateMut.isPending
								? 'Сохранение...'
								: 'Сохранить'}
						</Button>
					</div>
				</form>
			</div>
		</div>
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
