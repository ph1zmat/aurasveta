import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { AsyncImage } from '../components/ui/AsyncImage'
import { generateSlug } from '../../../shared/lib/generateSlug'
import {
	Pencil,
	Trash2,
	Plus,
	X,
	ImagePlus,
	Trash,
	GripVertical,
} from 'lucide-react'
import { useApiBaseUrl, resolveImgUrl } from '../lib/store'
import { uploadImageAsset } from '../lib/uploadImageAsset'
import ProductFilters, {
	type ProductFiltersState,
} from '../../../shared/admin/products/ProductFilters'

export function ProductsPage() {
	const apiBaseUrl = useApiBaseUrl()
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

	const { data: categories } = trpc.categories.getAll.useQuery()

	const { data, refetch } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: filters.search || undefined,
		categorySlug: filters.categorySlug || undefined,
		brand: filters.brand || undefined,
		sortBy: (filters.sortBy as any) || undefined,
		inStock: filters.inStock,
	})
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => refetch(),
	})

	// Extract unique brands from current data for filter options
	const brands = useMemo(() => {
		const set = new Set<string>()
		data?.items.forEach((p: any) => {
			if (p.brand) set.add(p.brand)
		})
		return Array.from(set).sort()
	}, [data])

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Товары
				</h1>
				<Button
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
					categories?.map((category: any) => ({
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

			{/* Product cards grid */}
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
				{data?.items.map((product: any) => (
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
						<div className='absolute right-2 top-2 z-10 flex gap-1'>
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
							{product.images?.[0] ? (
								<AsyncImage
									src={
										product.images[0].displayUrl ??
										product.images[0].imageAsset?.url ??
										resolveImgUrl(
											product.images[0].url ?? product.images[0].key,
											apiBaseUrl,
										)
									}
									alt={product.name}
									className='h-full w-full'
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
				))}
			</div>

			{data?.items.length === 0 && (
				<div className='rounded-2xl border border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground'>
					Товары не найдены
				</div>
			)}

			{/* Pagination */}
			{data && data.totalPages > 1 && (
				<div className='flex items-center justify-center gap-2'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						←
					</Button>
					<span className='text-sm text-muted-foreground'>
						{page} / {data.totalPages}
					</span>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
						disabled={page === data.totalPages}
					>
						→
					</Button>
				</div>
			)}
		</div>
	)
}

// Product form modal
function ProductFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const apiBaseUrl = useApiBaseUrl()
	const utils = trpc.useUtils()
	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data: allProperties } = trpc.properties.getAll.useQuery()
	const { data: editProduct } = trpc.products.getById.useQuery(editId!, {
		enabled: !!editId,
	})

	const createMut = trpc.products.create.useMutation({ onSuccess })
	const updateMut = trpc.products.update.useMutation({ onSuccess })
	const updateImageMut = trpc.products.updateImagePath.useMutation({
		onSuccess: () => utils.products.getById.invalidate(editId!),
	})
	const removeImageMut = trpc.products.removeImage.useMutation({
		onSuccess: () => utils.products.getById.invalidate(editId!),
	})

	const initialForm = useMemo(
		() => ({
			name: '',
			slug: '',
			description: '',
			price: '',
			compareAtPrice: '',
			stock: '0',
			sku: '',
			rootCategoryId: '',
			subcategoryId: '',
			brand: '',
			brandCountry: '',
			isActive: true,
		}),
		[],
	)

	const [form, setForm] = useState(initialForm)
	const [propRows, setPropRows] = useState<
		{ propertyId: string; propertyValueId: string }[]
	>([])
	const [uploadError, setUploadError] = useState<string | null>(null)

	// Populate form when editing
	useEffect(() => {
		if (!editId) {
			setForm(initialForm)
			setPropRows([])
			return
		}
		if (editProduct) {
			setForm({
				name: editProduct.name ?? '',
				slug: editProduct.slug ?? '',
				description: editProduct.description ?? '',
				price: editProduct.price != null ? String(editProduct.price) : '',
				compareAtPrice:
					editProduct.compareAtPrice != null
						? String(editProduct.compareAtPrice)
						: '',
				stock: editProduct.stock != null ? String(editProduct.stock) : '0',
				sku: editProduct.sku ?? '',
				rootCategoryId: (editProduct as any).rootCategoryId ?? '',
				subcategoryId: (editProduct as any).subcategoryId ?? '',
				brand: editProduct.brand ?? '',
				brandCountry: editProduct.brandCountry ?? '',
				isActive: !!editProduct.isActive,
			})
			setPropRows(
				(editProduct as any).properties?.map((pv: any) => ({
					propertyId: pv.propertyId ?? pv.property?.id ?? '',
					propertyValueId: pv.propertyValueId ?? '',
				})) ?? [],
			)
		}
	}, [editId, editProduct, initialForm])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const data = {
			name: form.name,
			slug: form.slug || generateSlug(form.name),
			description: form.description || undefined,
			price: form.price ? parseFloat(form.price) : undefined,
			compareAtPrice: form.compareAtPrice
				? parseFloat(form.compareAtPrice)
				: undefined,
			stock: parseInt(form.stock) || 0,
			sku: form.sku || undefined,
			rootCategoryId: form.rootCategoryId || undefined,
			subcategoryId: form.subcategoryId || undefined,
			brand: form.brand || undefined,
			brandCountry: form.brandCountry || undefined,
			isActive: form.isActive,
			properties: propRows
				.filter(r => r.propertyId && r.propertyValueId)
				.map(r => ({
					propertyId: r.propertyId,
					propertyValueId: r.propertyValueId,
				})),
		}

		if (editId) {
			updateMut.mutate({ id: editId, ...data })
		} else {
			createMut.mutate(data as any)
		}
	}

	const handleUploadImage = async (file: File) => {
		if (!editId) return
		setUploadError(null)
		const { key, originalName } = await uploadImageAsset(file).catch(error => {
			const message = error instanceof Error ? error.message : 'Upload failed'
			setUploadError(message)
			throw error
		})

		await updateImageMut.mutateAsync({
			productId: editId,
			imagePath: key,
			imageOriginalName: originalName,
		})
	}

	const usedPropertyIds = new Set(propRows.map(r => r.propertyId))

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm h-screen'>
			<div className='flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>
						{editId ? 'Редактировать товар' : 'Новый товар'}
					</h2>
					<div className='flex items-center gap-3'>
						<label className='flex items-center gap-2 text-sm text-muted-foreground select-none'>
							<input
								type='checkbox'
								checked={form.isActive}
								onChange={e =>
									setForm(f => ({ ...f, isActive: e.target.checked }))
								}
								className='h-4 w-4 rounded border-border accent-primary'
							/>
							Активный
						</label>
						<button
							onClick={onClose}
							className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							<X className='h-5 w-5' />
						</button>
					</div>
				</div>

				{/* Scrollable body */}
				<form
					onSubmit={handleSubmit}
					className='flex-1 overflow-y-auto px-6 py-5 space-y-6'
				>
					{/* ── Section 1: Image + Main fields ── */}
					<div className='grid grid-cols-[280px_1fr] gap-5'>
						{/* Left: Photo */}
						<div className='flex flex-col items-center gap-3'>
							<div className='relative group w-full aspect-square rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center overflow-hidden'>
								{editId && editProduct?.images?.[0] ? (
									<>
										<AsyncImage
											src={
												editProduct.images[0].displayUrl ??
												editProduct.images[0].imageAsset?.url ??
												resolveImgUrl(
													editProduct.images[0].url ??
														editProduct.images[0].key,
													apiBaseUrl,
												)
											}
											alt={editProduct.name ?? 'Фото товара'}
											className='h-full w-full'
										/>
										<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
											<label className='cursor-pointer rounded-lg bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20'>
												<ImagePlus className='h-5 w-5' />
												<input
													type='file'
													accept='image/*'
													className='hidden'
													onChange={async e => {
														const input = e.currentTarget
														const file = input.files?.[0]
														if (!file) return
														try {
															await handleUploadImage(file)
														} finally {
															input.value = ''
														}
													}}
												/>
											</label>
											<button
												type='button'
												onClick={() => removeImageMut.mutate(editId)}
												disabled={removeImageMut.isPending}
												className='rounded-lg bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/60'
											>
												<Trash className='h-5 w-5' />
											</button>
										</div>
									</>
								) : editId ? (
									<label className='flex cursor-pointer flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'>
										<ImagePlus className='h-8 w-8' />
										<span className='text-xs'>Загрузить фото</span>
										<input
											type='file'
											accept='image/*'
											className='hidden'
											onChange={async e => {
												const input = e.currentTarget
												const file = input.files?.[0]
												if (!file) return
												try {
													await handleUploadImage(file)
												} finally {
													input.value = ''
												}
											}}
										/>
									</label>
								) : (
									<div className='flex flex-col items-center gap-2 text-muted-foreground'>
										<ImagePlus className='h-8 w-8 opacity-40' />
										<span className='text-xs'>
											Сохраните товар, чтобы загрузить фото
										</span>
									</div>
								)}
							</div>
							{uploadError && (
								<p className='text-xs text-red-500 text-center'>
									{uploadError}
								</p>
							)}
						</div>

						{/* Right: Name, Price, Compare price */}
						<div className='space-y-4'>
							<Field
								label='Название'
								value={form.name}
								onChange={v => setForm(f => ({ ...f, name: v }))}
								required
								placeholder='Введите название товара'
							/>
							<Field
								label='Цена'
								value={form.price}
								onChange={v => setForm(f => ({ ...f, price: v }))}
								type='number'
								placeholder='0'
								suffix='₽'
							/>
							<Field
								label='Старая цена'
								value={form.compareAtPrice}
								onChange={v => setForm(f => ({ ...f, compareAtPrice: v }))}
								type='number'
								placeholder='0'
								suffix='₽'
							/>
						</div>
					</div>

					{/* ── Section 2: Description + Meta ── */}
					<div className='grid grid-cols-[1fr_280px] gap-5'>
						{/* Left: Description */}
						<Field
							label='Описание'
							value={form.description}
							onChange={v => setForm(f => ({ ...f, description: v }))}
							textarea
							placeholder='Опишите товар...'
							className='h-full'
							textareaClassName='min-h-[188px] h-full'
						/>

						{/* Right: Slug, SKU, Category, Brand, Country */}
						<div className='space-y-3'>
							<Field
								label='Slug'
								value={form.slug}
								onChange={v => setForm(f => ({ ...f, slug: v }))}
								placeholder='auto-generated'
								small
							/>
							<Field
								label='SKU'
								value={form.sku}
								onChange={v => setForm(f => ({ ...f, sku: v }))}
								placeholder='Артикул'
								small
							/>
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Категория
								</label>
								<select
									value={form.rootCategoryId}
									onChange={e => {
										setForm(f => ({ ...f, rootCategoryId: e.target.value, subcategoryId: '' }))
									}}
									className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
								>
									<option value=''>Без категории</option>
									{categories?.map((c: any) => (
										!c.parentId && <option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
							{form.rootCategoryId && (
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Подкатегория
								</label>
								<select
									value={form.subcategoryId}
									onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}
									className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
								>
									<option value=''>Без подкатегории</option>
									{categories?.filter((c: any) => c.parentId === form.rootCategoryId).map((c: any) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
							)}
							<Field
								label='Бренд'
								value={form.brand}
								onChange={v => setForm(f => ({ ...f, brand: v }))}
								placeholder='Бренд'
								small
							/>
							<Field
								label='Страна'
								value={form.brandCountry}
								onChange={v => setForm(f => ({ ...f, brandCountry: v }))}
								placeholder='Страна бренда'
								small
							/>
						</div>
					</div>

					{/* ── Section 3: Properties table ── */}
					<div className='rounded-xl border border-border'>
						<div className='flex items-center justify-between border-b border-border px-4 py-3'>
							<span className='text-sm font-semibold text-foreground'>
								Характеристики
							</span>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								onClick={() =>
									setPropRows(r => [
										...r,
										{ propertyId: '', propertyValueId: '' },
									])
								}
								className='gap-1 text-xs'
							>
								<Plus className='h-3.5 w-3.5' />
								Добавить
							</Button>
						</div>

						{propRows.length === 0 ? (
							<div className='px-4 py-6 text-center text-sm text-muted-foreground'>
								Нет характеристик.{' '}
								<button
									type='button'
									onClick={() => setPropRows([{ propertyId: '', value: '' }])}
									className='text-primary hover:underline'
								>
									Добавить первую
								</button>
							</div>
						) : (
							<div className='divide-y divide-border/50'>
								{propRows.map((row, idx) => {
									const property = allProperties?.find(
										(p: any) => p.id === row.propertyId,
									) as any
									return (
										<div
											key={idx}
											className='flex items-center gap-3 px-4 py-2.5'
										>
											<GripVertical className='h-4 w-4 shrink-0 text-muted-foreground/40' />
											<select
												value={row.propertyId}
												onChange={e => {
													const next = [...propRows]
													next[idx] = {
														...next[idx],
														propertyId: e.target.value,
														value: '',
													}
													setPropRows(next)
												}}
												className='h-9 w-44 shrink-0 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
											>
												<option value=''>Выберите...</option>
												{allProperties?.map((p: any) => (
													<option
														key={p.id}
														value={p.id}
														disabled={
															usedPropertyIds.has(p.id) &&
															p.id !== row.propertyId
														}
													>
														{p.name}
													</option>
												))}
											</select>

											{property?.type === 'SELECT' && property.options ? (
												<select
													value={row.propertyValueId}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															propertyValueId: e.target.value,
														}
														setPropRows(next)
													}}
													className='h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												>
													<option value=''>Выберите значение...</option>
													{(property.values ?? []).map((v: any) => (
														<option key={v.id} value={v.id}>
															{v.value}
														</option>
													))}
												</select>
											) : property?.type === 'BOOLEAN' ? (
												<select
													value={row.propertyValueId}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															propertyValueId: e.target.value,
														}
														setPropRows(next)
													}}
													className='h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												>
													<option value=''>Выберите значение...</option>
													{(property.values ?? []).map((v: any) => (
														<option key={v.id} value={v.id}>
															{v.value}
														</option>
													))}
												</select>
											) : (
												<select
													value={row.propertyValueId}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															propertyValueId: e.target.value,
														}
														setPropRows(next)
													}}
													className='h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												>
													<option value=''>Выберите значение...</option>
													{(property?.values ?? []).map((v: any) => (
														<option key={v.id} value={v.id}>
															{v.value}
														</option>
													))}
												</select>
											)}

											<button
												type='button'
												onClick={() =>
													setPropRows(r => r.filter((_, i) => i !== idx))
												}
												className='shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
											>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</form>

				{/* Footer */}
				<div className='flex items-center justify-between border-t border-border px-6 py-4'>
					<Field
						label='Остаток'
						value={form.stock}
						onChange={v => setForm(f => ({ ...f, stock: v }))}
						type='number'
						small
						inline
					/>
					<div className='flex gap-2'>
						<Button variant='ghost' type='button' onClick={onClose}>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={createMut.isPending || updateMut.isPending}
							onClick={handleSubmit}
						>
							{editId ? 'Сохранить' : 'Создать'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

function Field({
	label,
	value,
	onChange,
	type = 'text',
	required,
	textarea,
	placeholder,
	suffix,
	small,
	inline,
	className,
	textareaClassName,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	type?: string
	required?: boolean
	textarea?: boolean
	placeholder?: string
	suffix?: string
	small?: boolean
	inline?: boolean
	className?: string
	textareaClassName?: string
}) {
	const height = small ? 'h-9' : 'h-10'
	const textSize = small ? 'text-sm' : 'text-sm'
	const labelSize = small ? 'text-xs' : 'text-sm'
	const baseCls = `flex w-full rounded-lg border border-border bg-background px-3 py-2 ${textSize} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`

	if (inline) {
		return (
			<div className='flex items-center gap-2'>
				<label
					className={`${labelSize} font-medium text-muted-foreground whitespace-nowrap`}
				>
					{label}
				</label>
				<input
					type={type}
					value={value}
					onChange={e => onChange(e.target.value)}
					className={`${baseCls} ${height} w-24`}
					required={required}
					placeholder={placeholder}
				/>
			</div>
		)
	}

	return (
		<div className={className}>
			<label
				className={`mb-1 block ${labelSize} font-medium text-muted-foreground`}
			>
				{label}
			</label>
			{textarea ? (
				<textarea
					value={value}
					onChange={e => onChange(e.target.value)}
					className={`${baseCls} resize-none ${textareaClassName ?? 'h-24'}`}
					required={required}
					placeholder={placeholder}
				/>
			) : suffix ? (
				<div className='relative'>
					<input
						type={type}
						value={value}
						onChange={e => onChange(e.target.value)}
						className={`${baseCls} ${height} pr-8`}
						required={required}
						placeholder={placeholder}
					/>
					<span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none'>
						{suffix}
					</span>
				</div>
			) : (
				<input
					type={type}
					value={value}
					onChange={e => onChange(e.target.value)}
					className={`${baseCls} ${height}`}
					required={required}
					placeholder={placeholder}
				/>
			)}
		</div>
	)
}
