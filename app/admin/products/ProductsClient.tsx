'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { generateSlug } from '@/shared/lib/generateSlug'

export default function ProductsClient() {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')

	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: search || undefined,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

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

			{/* Search */}
			<input
				type='search'
				placeholder='Поиск по названию...'
				value={search}
				onChange={e => setSearch(e.target.value)}
				className='flex h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
			/>

			{/* Product form modal */}
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

			{/* Table */}
			<div className='overflow-x-auto rounded-xl border border-border'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border bg-muted/30 text-left text-muted-foreground'>
							<th className='px-4 py-3 font-medium'>Название</th>
							<th className='px-4 py-3 font-medium'>Цена</th>
							<th className='px-4 py-3 font-medium'>Остаток</th>
							<th className='px-4 py-3 font-medium'>Категория</th>
							<th className='px-4 py-3 font-medium'>Статус</th>
							<th className='px-4 py-3 font-medium'>Действия</th>
						</tr>
					</thead>
					<tbody>
						{data?.items.map(product => (
							<tr key={product.id} className='border-b border-border/50'>
								<td className='px-4 py-3 font-medium text-foreground'>
									{product.name}
								</td>
								<td className='px-4 py-3'>
									{product.price?.toLocaleString('ru-RU')} ₽
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
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{data && data.totalPages > 1 && (
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={page <= 1}
						onClick={() => setPage(p => p - 1)}
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
						onClick={() => setPage(p => p + 1)}
					>
						Вперед
					</Button>
				</div>
			)}
		</div>
	)
}

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

	// Wait for data to load when editing
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
	product: RouterOutputs['products']['getById'] | null
	onClose: () => void
	onSuccess: () => void
}) {
	const { data: categories } = trpc.categories.getAll.useQuery()
	const updateMut = trpc.products.update.useMutation({ onSuccess })
	const updateImageMut = trpc.products.updateImagePath.useMutation({
		onSuccess,
	})
	const removeImageMut = trpc.products.removeImage.useMutation({ onSuccess })

	const [pendingImage, setPendingImage] = useState<{
		path: string
		originalName: string
	} | null>(null)

	const createMut = trpc.products.create.useMutation({
		onSuccess: (created) => {
			// If user already uploaded an image while creating, bind it to the new product
			if (pendingImage?.path) {
				updateImageMut.mutate({
					productId: created.id,
					imagePath: pendingImage.path,
					imageOriginalName: pendingImage.originalName,
				})
			}
			onSuccess()
		},
	})

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
	const [slugTouched, setSlugTouched] = useState(!!product?.slug)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		const data = {
			name: form.name,
			slug: form.slug,
			description: form.description || undefined,
			price: form.price ? parseFloat(form.price) : undefined,
			compareAtPrice: form.compareAtPrice
				? parseFloat(form.compareAtPrice)
				: undefined,
			stock: parseInt(form.stock) || 0,
			sku: form.sku || undefined,
			categoryId: form.categoryId || undefined,
			brand: form.brand || undefined,
			brandCountry: form.brandCountry || undefined,
			isActive: form.isActive,
		}

		if (editId) {
			updateMut.mutate({ id: editId, ...data })
		} else {
			createMut.mutate(data)
		}
	}

	function updateField(key: string, value: string | boolean) {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	return (
		<div className='fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-background/100 p-6 shadow-2xl'>
				<h2 className='mb-6 text-lg font-semibold text-foreground'>
					{editId ? 'Редактировать товар' : 'Новый товар'}
				</h2>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<FormField label='Название' required>
							<input
								value={form.name}
								onChange={e => {
									const name = e.target.value
									setForm(prev => ({
										...prev,
										name,
										slug: slugTouched ? prev.slug : generateSlug(name),
									}))
								}}
								required
								className='input-field'
							/>
						</FormField>
						<FormField label='Slug' required>
							<input
								value={form.slug}
								onChange={e => {
									setSlugTouched(true)
									updateField('slug', e.target.value)
								}}
								onBlur={() => {
									// normalize on blur
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
							onChange={e => updateField('description', e.target.value)}
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
								onChange={e => updateField('price', e.target.value)}
								className='input-field'
							/>
						</FormField>
						<FormField label='Старая цена'>
							<input
								type='number'
								step='0.01'
								value={form.compareAtPrice}
								onChange={e => updateField('compareAtPrice', e.target.value)}
								className='input-field'
							/>
						</FormField>
						<FormField label='Остаток'>
							<input
								type='number'
								value={form.stock}
								onChange={e => updateField('stock', e.target.value)}
								className='input-field'
							/>
						</FormField>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<FormField label='SKU'>
							<input
								value={form.sku}
								onChange={e => updateField('sku', e.target.value)}
								className='input-field'
							/>
						</FormField>
						<FormField label='Категория'>
							<select
								value={form.categoryId}
								onChange={e => updateField('categoryId', e.target.value)}
								className='input-field'
							>
								<option value=''>— Без категории —</option>
								{categories?.map(cat => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</FormField>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<FormField label='Бренд'>
							<input
								value={form.brand}
								onChange={e => updateField('brand', e.target.value)}
								className='input-field'
							/>
						</FormField>
						<FormField label='Страна бренда'>
							<input
								value={form.brandCountry}
								onChange={e => updateField('brandCountry', e.target.value)}
								className='input-field'
							/>
						</FormField>
					</div>

					<div className='flex items-center gap-2'>
						<input
							type='checkbox'
							id='isActive'
							checked={form.isActive}
							onChange={e => updateField('isActive', e.target.checked)}
						/>
						<label htmlFor='isActive' className='text-sm text-foreground'>
							Активный (показывать в каталоге)
						</label>
					</div>

					{editId && (
						<FileUploader
							currentImage={product?.imagePath}
							onUploaded={(filePath, originalName) =>
								updateImageMut.mutate({
									productId: editId,
									imagePath: filePath,
									imageOriginalName: originalName,
								})
							}
							onRemove={() => removeImageMut.mutate(editId)}
							isLoading={updateImageMut.isPending || removeImageMut.isPending}
						/>
					)}

					{!editId && (
						<FileUploader
							currentImage={pendingImage?.path ?? null}
							onUploaded={(filePath, originalName) =>
								setPendingImage({ path: filePath, originalName })
							}
							onRemove={() => setPendingImage(null)}
							isLoading={createMut.isPending || updateImageMut.isPending}
							label='Изображение (необязательно)'
						/>
					)}

					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' type='button' onClick={onClose}>
							Отмена
						</Button>
						<Button
							variant='primary'
							type='submit'
							disabled={
								createMut.isPending ||
								updateMut.isPending ||
								updateImageMut.isPending
							}
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
				{required && <span className='text-destructive'> *</span>}
			</label>
			{children}
		</div>
	)
}

