'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { generateSlug } from '@/shared/lib/generateSlug'
import ProductImagesField, {
	type EditableProductImage,
} from './ProductImagesField'

export default function ProductsGalleryClient() {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: search || undefined,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	return (
		<div className='space-y-6'>
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

			<input
				type='search'
				placeholder='Поиск по названию...'
				value={search}
				onChange={event => {
					setSearch(event.target.value)
					setPage(1)
				}}
				className='flex h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
			/>

			{showForm ? (
				<ProductFormModal
					editId={editId}
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
						refetch()
					}}
				/>
			) : null}

			<div className='overflow-x-auto rounded-xl border border-border'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border bg-muted/30 text-left text-muted-foreground'>
							<th className='px-4 py-3 font-medium'>Название</th>
							<th className='px-4 py-3 font-medium'>Цена</th>
							<th className='px-4 py-3 font-medium'>Фото</th>
							<th className='px-4 py-3 font-medium'>Остаток</th>
							<th className='px-4 py-3 font-medium'>Категория</th>
							<th className='px-4 py-3 font-medium'>Статус</th>
							<th className='px-4 py-3 font-medium'>Действия</th>
						</tr>
					</thead>
					<tbody>
						{data?.items.map(product => {
							const previewImage = product.images?.[0]?.url ?? null

							return (
								<tr key={product.id} className='border-b border-border/50'>
									<td className='px-4 py-3 font-medium text-foreground'>
										{product.name}
									</td>
									<td className='px-4 py-3'>
										{product.price?.toLocaleString('ru-RU')} ₽
									</td>
									<td className='px-4 py-3'>
										<div className='flex items-center gap-2'>
											{previewImage ? (
												/* eslint-disable-next-line @next/next/no-img-element */
												<img
													src={previewImage}
													alt=''
													className='h-10 w-10 rounded-md object-cover'
												/>
											) : (
												<div className='h-10 w-10 rounded-md bg-muted' />
											)}
											<span className='text-xs text-muted-foreground'>
												{product.images?.length ?? 0}
											</span>
										</div>
									</td>
									<td className='px-4 py-3'>{product.stock}</td>
									<td className='px-4 py-3 text-muted-foreground'>
										{product.category?.name ?? '—'}
									</td>
									<td className='px-4 py-3'>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${
												product.isActive
													? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
													: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
											}`}
										>
											{product.isActive ? 'Активный' : 'Скрытый'}
										</span>
									</td>
									<td className='px-4 py-3'>
										<div className='flex gap-2'>
											<button
												onClick={() => {
													setEditId(product.id)
													setShowForm(true)
												}}
												className='text-muted-foreground hover:text-foreground'
												aria-label='Редактировать'
											>
												<Pencil className='h-4 w-4' />
											</button>
											<button
												onClick={() => {
													if (confirm('Удалить товар?')) {
														deleteMut.mutate(product.id)
													}
												}}
												className='text-muted-foreground hover:text-destructive'
												aria-label='Удалить'
											>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{data && data.totalPages > 1 ? (
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={page <= 1}
						onClick={() => setPage(currentPage => currentPage - 1)}
					>
						Назад
					</Button>
					<span className='text-sm text-muted-foreground'>
						{page} / {data.totalPages}
					</span>
					<Button
						variant='outline'
						size='sm'
						disabled={page >= data.totalPages}
						onClick={() => setPage(currentPage => currentPage + 1)}
					>
						Вперед
					</Button>
				</div>
			) : null}
		</div>
	)
}

type ProductDetails = RouterOutputs['products']['getById']

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
			product?.images?.map(image => ({
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
								{categories?.map(category => (
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
