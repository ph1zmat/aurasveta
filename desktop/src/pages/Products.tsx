import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import {
	Pencil,
	Trash2,
	Plus,
	X,
	ImagePlus,
	Trash,
	GripVertical,
	SlidersHorizontal,
	ChevronDown,
	ArrowUpDown,
} from 'lucide-react'
import { getApiUrl, getToken, useApiBaseUrl, resolveImgUrl } from '../lib/store'

export function ProductsPage() {
	const apiBaseUrl = useApiBaseUrl()
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [showFilters, setShowFilters] = useState(false)

	// Filter state
	const [categorySlug, setCategorySlug] = useState('')
	const [brand, setBrand] = useState('')
	const [sortBy, setSortBy] = useState<string>('')
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

	// Extract unique brands from current data for filter options
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

			{/* Search + Filter toggle */}
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
							icon={<ArrowUpDown className='h-3.5 w-3.5' />}
						/>
						<div className='flex flex-col gap-1'>
							<span className='text-xs font-medium text-muted-foreground'>
								Наличие
							</span>
							<div className='flex h-9 items-center gap-3 rounded-lg border border-border bg-background px-3'>
								{[
									{ label: 'Все', val: undefined },
									{ label: 'В наличии', val: true },
									{ label: 'Нет', val: false },
								].map(opt => (
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
								<img
									src={resolveImgUrl(
										product.images[0].url ?? product.images[0].key,
										apiBaseUrl,
									)}
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
			categoryId: '',
			brand: '',
			brandCountry: '',
			isActive: true,
		}),
		[],
	)

	const [form, setForm] = useState(initialForm)
	const [propRows, setPropRows] = useState<
		{ propertyId: string; value: string }[]
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
				categoryId: editProduct.categoryId ?? '',
				brand: editProduct.brand ?? '',
				brandCountry: editProduct.brandCountry ?? '',
				isActive: !!editProduct.isActive,
			})
			setPropRows(
				(editProduct as any).properties?.map((pv: any) => ({
					propertyId: pv.propertyId ?? pv.property?.id ?? '',
					value: pv.value ?? '',
				})) ?? [],
			)
		}
	}, [editId, editProduct, initialForm])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const data = {
			name: form.name,
			slug:
				form.slug || form.name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-'),
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
			properties: propRows
				.filter(r => r.propertyId && r.value)
				.map(r => ({ propertyId: r.propertyId, value: r.value })),
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
		const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
		const token = await getToken()
		if (!token) throw new Error('Нет токена сессии')

		const fd = new FormData()
		fd.append('file', file)

		const res = await fetch(`${apiUrl}/api/upload`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: fd,
		})

		if (!res.ok) {
			const body = await res.json().catch(() => null)
			const msg = body?.error ?? `Upload failed: ${res.status}`
			setUploadError(msg)
			throw new Error(msg)
		}

		const out = await res.json()
		const imagePath =
			(out.key as string | undefined) ?? (out.path as string | undefined)
		const originalName = out.originalName as string | undefined
		if (!imagePath) throw new Error('Upload: не вернулся путь')

		await updateImageMut.mutateAsync({
			productId: editId,
			imagePath,
			imageOriginalName: originalName ?? null,
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
										<img
											src={resolveImgUrl(
												editProduct.images[0].url ?? editProduct.images[0].key,
												apiBaseUrl,
											)}
											alt=''
											className='h-full w-full object-cover'
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
									value={form.categoryId}
									onChange={e =>
										setForm(f => ({ ...f, categoryId: e.target.value }))
									}
									className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
								>
									<option value=''>Без категории</option>
									{categories?.map((c: any) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
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
									setPropRows(r => [...r, { propertyId: '', value: '' }])
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
													value={row.value}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															value: e.target.value,
														}
														setPropRows(next)
													}}
													className='h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												>
													<option value=''>Выберите...</option>
													{(property.options as string[]).map((opt: string) => (
														<option key={opt} value={opt}>
															{opt}
														</option>
													))}
												</select>
											) : property?.type === 'BOOLEAN' ? (
												<select
													value={row.value}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															value: e.target.value,
														}
														setPropRows(next)
													}}
													className='h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												>
													<option value=''>—</option>
													<option value='true'>Да</option>
													<option value='false'>Нет</option>
												</select>
											) : (
												<input
													type={property?.type === 'NUMBER' ? 'number' : 'text'}
													value={row.value}
													onChange={e => {
														const next = [...propRows]
														next[idx] = {
															...next[idx],
															value: e.target.value,
														}
														setPropRows(next)
													}}
													placeholder='Значение'
													className='h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
												/>
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

/* ─────────────── Filter Select ─────────────── */

function FilterSelect({
	label,
	value,
	onChange,
	options,
	placeholder,
	icon,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
	placeholder: string
	icon?: React.ReactNode
}) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-xs font-medium text-muted-foreground'>{label}</span>
			<div className='relative'>
				{icon && (
					<span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'>
						{icon}
					</span>
				)}
				<select
					value={value}
					onChange={e => onChange(e.target.value)}
					className={`h-9 appearance-none rounded-lg border border-border bg-background pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
						icon ? 'pl-8' : 'pl-3'
					} ${value ? 'text-foreground' : 'text-muted-foreground'}`}
				>
					<option value=''>{placeholder}</option>
					{options.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
				<ChevronDown className='pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
			</div>
		</div>
	)
}
