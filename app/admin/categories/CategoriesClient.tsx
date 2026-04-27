'use client'

import { useEffect, useMemo, useState } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
import {
	Pencil,
	Trash2,
	Plus,
	X,
	FolderTree,
	Package,
	ArrowRight,
	ChevronLeft,
	Filter,
	Tags,
	AlertCircle,
	Loader2,
	Monitor,
	MonitorOff,
} from 'lucide-react'
import { generateSlug } from '@/shared/lib/generateSlug'

type CategoryNodeData = NonNullable<
	RouterOutputs['categories']['getTree']
>[number]

type CategoryMode = 'MANUAL' | 'FILTER'
type CategoryFilterKind = 'PROPERTY_VALUE' | 'SALE'

function getCategoryModeLabel(category: CategoryNodeData) {
	return category.categoryMode === 'FILTER'
		? 'Фильтрующая категория'
		: 'Обычная категория'
}

/* ============ Main Entry ============ */

export default function CategoriesClient() {
	const [selectedId, setSelectedId] = useState<string | null>(null)

	if (selectedId) {
		return (
			<CategoryDetailView
				categoryId={selectedId}
				onBack={() => setSelectedId(null)}
			/>
		)
	}

	return <CategoriesGrid onSelect={setSelectedId} />
}

/* ============ Grid of root categories ============ */

function CategoriesGrid({ onSelect }: { onSelect: (id: string) => void }) {
	const treeQuery = trpc.categories.getTree.useQuery()
	const allCategoriesQuery = trpc.categories.getAll.useQuery()
	const { data: tree, refetch, error, isLoading, isFetching } = treeQuery
	const [showForm, setShowForm] = useState(false)
	const totalCategories = allCategoriesQuery.data?.length ?? 0
	const hasOnlyNestedCategories =
		!isLoading && !error && (tree?.length ?? 0) === 0 && totalCategories > 0

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Категории
				</h1>
				<Button size='sm' variant='primary' onClick={() => setShowForm(true)}>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{showForm && (
				<CategoryFormModal
					editId={null}
					parentId={null}
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
						refetch()
					}}
				/>
			)}

			{isLoading || isFetching ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<Loader2 className='mb-3 h-10 w-10 animate-spin text-muted-foreground/40' />
					<p className='text-sm text-muted-foreground'>Загружаю категории...</p>
				</div>
			) : error ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 py-16 text-center'>
					<AlertCircle className='mb-3 h-10 w-10 text-destructive/70' />
					<p className='text-sm font-medium text-foreground'>
						Не удалось загрузить категории
					</p>
					<p className='mt-1 max-w-md text-xs text-muted-foreground'>
						{error.message}
					</p>
				</div>
			) : tree && tree.length > 0 ? (
				<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
					{tree.map(cat => (
						<CategoryCard
							key={cat.id}
							category={cat}
							onClick={() => onSelect(cat.id)}
						/>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<FolderTree className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='text-sm text-muted-foreground'>Нет категорий</p>
					{hasOnlyNestedCategories && (
						<p className='mt-2 max-w-md text-center text-xs text-muted-foreground'>
							В базе есть {totalCategories} категорий, но ни одна не является
							корневой. Этот экран показывает только категории верхнего уровня
							(`parentId = null`).
						</p>
					)}
				</div>
			)}
		</div>
	)
}

/* ============ Category Card ============ */

function CategoryCard({
	category,
	onClick,
	onEdit,
	onDelete,
}: {
	category: CategoryNodeData
	onClick?: () => void
	onEdit?: () => void
	onDelete?: () => void
}) {
	const productCount = category._count?.products ?? 0
	const childrenCount = category.children?.length ?? 0

	return (
		<div className='group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/30'>
			{/* Image */}
			<div className='aspect-video w-full bg-muted/30'>
				{(category.imageUrl ?? category.imagePath) ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={
							category.imageUrl ?? `/api/storage/file?key=${category.imagePath}`
						}
						alt={category.name}
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center'>
						<FolderTree className='h-10 w-10 text-muted-foreground/20' />
					</div>
				)}
			</div>

			{/* Info */}
			<div className='flex flex-1 flex-col gap-2 p-3'>
				<div className='flex flex-wrap items-center gap-2'>
					<span className='inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
						{category.categoryMode === 'FILTER' ? (
							<Filter className='h-3 w-3' />
						) : (
							<Tags className='h-3 w-3' />
						)}
						{category.categoryMode === 'FILTER' ? 'Фильтр' : 'Обычная'}
					</span>
					<span className='inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
						{category.showInHeader === false ? (
							<MonitorOff className='h-3 w-3' />
						) : (
							<Monitor className='h-3 w-3' />
						)}
						{category.showInHeader === false ? 'Скрыта в хедере' : 'В хедере'}
					</span>
				</div>

				<span className='line-clamp-2 text-sm font-semibold leading-tight text-foreground'>
					{category.name}
				</span>

				{category.filterSummary && (
					<p className='line-clamp-2 text-xs text-muted-foreground'>
						{category.filterSummary}
					</p>
				)}

				<div className='mt-auto flex items-center gap-3 text-[11px] text-muted-foreground'>
					{productCount > 0 && (
						<span className='flex items-center gap-1'>
							<Package className='h-3 w-3' />
							{productCount}
						</span>
					)}
					{childrenCount > 0 && (
						<span className='flex items-center gap-1'>
							<FolderTree className='h-3 w-3' />
							{childrenCount}
						</span>
					)}
				</div>

				<div className='flex gap-1.5'>
					{onClick && (
						<button
							onClick={onClick}
							className='flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
						>
							Открыть
							<ArrowRight className='h-3 w-3' />
						</button>
					)}
					{onEdit && (
						<button
							onClick={onEdit}
							className='rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							<Pencil className='h-3.5 w-3.5' />
						</button>
					)}
					{onDelete && (
						<button
							onClick={onDelete}
							className='rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
						>
							<Trash2 className='h-3.5 w-3.5' />
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

/* ============ Category Detail View ============ */

function CategoryDetailView({
	categoryId,
	onBack,
}: {
	categoryId: string
	onBack: () => void
}) {
	const { data: tree, refetch: refetchTree } =
		trpc.categories.getTree.useQuery()
	const deleteMut = trpc.categories.delete.useMutation({
		onSuccess: () => refetchTree(),
	})
	const updateImageMut = trpc.categories.updateImagePath.useMutation({
		onSuccess: () => refetchTree(),
	})
	const removeImageMut = trpc.categories.removeImage.useMutation({
		onSuccess: () => refetchTree(),
	})

	const [showEditModal, setShowEditModal] = useState(false)
	const [showAddChild, setShowAddChild] = useState(false)
	const [editChildId, setEditChildId] = useState<string | null>(null)

	const findInTree = (
		nodes: CategoryNodeData[],
		id: string,
	): CategoryNodeData | null => {
		for (const n of nodes) {
			if (n.id === id) return n
			if (n.children) {
				const found = findInTree(n.children, id)
				if (found) return found
			}
		}
		return null
	}

	const category = tree ? findInTree(tree, categoryId) : null
	const children = category?.children ?? []
	const productCount = category?._count?.products ?? 0

	if (!category) {
		return (
			<div className='space-y-5'>
				<button
					onClick={onBack}
					className='flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
				>
					<ChevronLeft className='h-4 w-4' />
					Назад
				</button>
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<p className='text-sm text-muted-foreground'>Категория не найдена</p>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Breadcrumb */}
			<button
				onClick={onBack}
				className='flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ChevronLeft className='h-4 w-4' />
				Все категории
			</button>

			{/* Category info card */}
			<div className='overflow-hidden rounded-2xl border border-border bg-muted/10'>
				<div className='flex gap-6 p-6'>
					{/* Image */}
					<div className='h-40 w-40 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20'>
						<FileUploader
							currentImage={category.imagePath ?? null}
							onUploaded={(key, originalName) =>
								updateImageMut.mutate({
									categoryId,
									imagePath: key,
									imageOriginalName: originalName,
								})
							}
							onRemove={() => removeImageMut.mutate(categoryId)}
							isLoading={updateImageMut.isPending || removeImageMut.isPending}
						/>
					</div>

					{/* Info */}
					<div className='flex flex-1 flex-col gap-3'>
						<div>
							<h2 className='text-2xl font-bold text-foreground'>
								{category.name}
							</h2>
							<p className='mt-0.5 font-mono text-xs text-muted-foreground'>
								/{category.slug}
							</p>
						</div>

						<div className='flex flex-wrap items-center gap-2'>
							<span className='inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
								{category.categoryMode === 'FILTER' ? (
									<Filter className='h-3 w-3' />
								) : (
									<Tags className='h-3 w-3' />
								)}
								{getCategoryModeLabel(category)}
							</span>
							{category.filterSummary && (
								<span className='inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary'>
									{category.filterSummary}
								</span>
							)}
						</div>

						{category.description && (
							<p className='text-sm leading-relaxed text-muted-foreground'>
								{category.description}
							</p>
						)}

						<div className='mt-auto flex items-center gap-4'>
							{productCount > 0 && (
								<span className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
									<Package className='h-3 w-3' />
									{productCount} товаров
								</span>
							)}
							<span className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
								<FolderTree className='h-3 w-3' />
								{children.length} подкатегорий
							</span>
						</div>

						<div className='flex gap-2'>
							<Button
								size='sm'
								variant='ghost'
								onClick={() => setShowEditModal(true)}
							>
								<Pencil className='mr-1.5 h-3.5 w-3.5' />
								Редактировать
							</Button>
							<Button
								size='sm'
								variant='ghost'
								onClick={() => {
									if (confirm('Удалить категорию и все подкатегории?')) {
										deleteMut.mutate(categoryId)
										onBack()
									}
								}}
								className='text-destructive hover:text-destructive'
							>
								<Trash2 className='mr-1.5 h-3.5 w-3.5' />
								Удалить
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Subcategories */}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<h3 className='text-base font-semibold text-foreground'>
						Подкатегории
					</h3>
					<Button
						size='sm'
						onClick={() => {
							setEditChildId(null)
							setShowAddChild(true)
						}}
					>
						<Plus className='mr-1 h-4 w-4' /> Добавить
					</Button>
				</div>

				{children.length > 0 ? (
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
						{children.map((child: CategoryNodeData) => (
							<CategoryCard
								key={child.id}
								category={child}
								onEdit={() => {
									setEditChildId(child.id)
									setShowAddChild(true)
								}}
								onDelete={() => {
									if (confirm('Удалить подкатегорию?')) {
										deleteMut.mutate(child.id)
									}
								}}
							/>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
						<FolderTree className='mb-2 h-8 w-8 text-muted-foreground/20' />
						<p className='text-sm text-muted-foreground'>Нет подкатегорий</p>
					</div>
				)}
			</div>

			{showEditModal && (
				<CategoryFormModal
					editId={categoryId}
					parentId={null}
					onClose={() => setShowEditModal(false)}
					onSuccess={() => {
						setShowEditModal(false)
						refetchTree()
					}}
				/>
			)}

			{showAddChild && (
				<CategoryFormModal
					editId={editChildId}
					parentId={editChildId ? null : categoryId}
					onClose={() => setShowAddChild(false)}
					onSuccess={() => {
						setShowAddChild(false)
						refetchTree()
					}}
				/>
			)}
		</div>
	)
}

/* ============ Category Form Modal ============ */

function CategoryFormModal({
	editId,
	parentId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	parentId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const utils = trpc.useUtils()
	const { data: tree, refetch } = trpc.categories.getTree.useQuery()
	const invalidateCategoryQueries = async () => {
		await Promise.all([
			utils.categories.getTree.invalidate(),
			utils.categories.getAll.invalidate(),
			utils.categories.getNav.invalidate(),
			utils.categories.getHeaderTree.invalidate(),
		])
	}
	const createMut = trpc.categories.create.useMutation({
		onSuccess: async () => {
			await invalidateCategoryQueries()
			onSuccess()
		},
	})
	const updateMut = trpc.categories.update.useMutation({
		onSuccess: async () => {
			await invalidateCategoryQueries()
			onSuccess()
		},
	})
	const updateImageMut = trpc.categories.updateImagePath.useMutation({
		onSuccess: async () => {
			await invalidateCategoryQueries()
			refetch()
		},
	})
	const removeImageMut = trpc.categories.removeImage.useMutation({
		onSuccess: async () => {
			await invalidateCategoryQueries()
			refetch()
		},
	})

	const findInTree = (
		nodes: CategoryNodeData[],
		id: string,
	): CategoryNodeData | null => {
		for (const n of nodes) {
			if (n.id === id) return n
			if (n.children) {
				const found = findInTree(n.children, id)
				if (found) return found
			}
		}
		return null
	}

	const editCat = editId && tree ? findInTree(tree, editId) : null
	const { data: properties } = trpc.properties.getAll.useQuery()
	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [description, setDescription] = useState('')
	const [categoryMode, setCategoryMode] = useState<CategoryMode>('MANUAL')
	const [filterKind, setFilterKind] =
		useState<CategoryFilterKind>('PROPERTY_VALUE')
	const [filterPropertyId, setFilterPropertyId] = useState('')
	const [filterPropertyValueId, setFilterPropertyValueId] = useState('')
	const [showInHeader, setShowInHeader] = useState(true)
	const [slugTouched, setSlugTouched] = useState(false)
	const [pendingImage, setPendingImage] = useState<{
		key: string
		originalName: string
	} | null>(null)

	useEffect(() => {
		if (!editCat) {
			setName('')
			setSlug('')
			setDescription('')
			setCategoryMode('MANUAL')
			setFilterKind('PROPERTY_VALUE')
			setFilterPropertyId('')
			setFilterPropertyValueId('')
			setShowInHeader(true)
			setSlugTouched(false)
			return
		}

		setName(editCat.name ?? '')
		setSlug(editCat.slug ?? '')
		setDescription(editCat.description ?? '')
		setCategoryMode(editCat.categoryMode ?? 'MANUAL')
		setFilterKind(editCat.filterKind ?? 'PROPERTY_VALUE')
		setFilterPropertyId(editCat.filterPropertyId ?? '')
		setFilterPropertyValueId(editCat.filterPropertyValueId ?? '')
		setShowInHeader(editCat.showInHeader ?? true)
		setSlugTouched(true)
	}, [editCat])

	const selectedFilterPropertyId =
		categoryMode === 'FILTER' && filterKind === 'PROPERTY_VALUE'
			? filterPropertyId
			: ''

	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		selectedFilterPropertyId,
		{
			enabled: Boolean(selectedFilterPropertyId),
		},
	)

	const availableValues = useMemo(
		() => selectedProperty?.values ?? [],
		[selectedProperty],
	)

	const inputCls =
		'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const data = {
			name,
			slug: slug || generateSlug(name),
			description: description || undefined,
			parentId: parentId || undefined,
			categoryMode,
			filterKind: categoryMode === 'FILTER' ? filterKind : null,
			filterPropertyId:
				categoryMode === 'FILTER' && filterKind === 'PROPERTY_VALUE'
					? filterPropertyId || null
					: null,
			filterPropertyValueId:
				categoryMode === 'FILTER' && filterKind === 'PROPERTY_VALUE'
					? filterPropertyValueId || null
					: null,
			showInHeader,
		}
		if (editId) {
			updateMut.mutate({ id: editId, ...data })
		} else {
			createMut.mutate(data as any, {
				onSuccess: (created: any) => {
					if (pendingImage?.key) {
						updateImageMut.mutate({
							categoryId: created.id,
							imagePath: pendingImage.key,
							imageOriginalName: pendingImage.originalName,
						})
					}
					onSuccess()
				},
			})
		}
	}

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='flex w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>
						{editId ? 'Редактировать категорию' : 'Новая категория'}
					</h2>
					<button
						onClick={onClose}
						className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Body */}
				<form onSubmit={handleSubmit} className='space-y-4 p-6'>
					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Название <span className='text-destructive'>*</span>
						</label>
						<input
							required
							value={name}
							onChange={e => {
								const val = e.target.value
								setName(val)
								if (!slugTouched) setSlug(generateSlug(val))
							}}
							className={inputCls}
							placeholder='Название категории'
						/>
					</div>
					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Slug <span className='text-destructive'>*</span>
						</label>
						<input
							required
							value={slug}
							onChange={e => {
								setSlugTouched(true)
								setSlug(e.target.value)
							}}
							onBlur={() => {
								if (slug) setSlug(generateSlug(slug))
							}}
							className={inputCls}
							placeholder='category-slug'
						/>
					</div>
					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Описание
						</label>
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							rows={3}
							className='flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
							placeholder='Описание категории'
						/>
					</div>

					<div className='grid gap-4 rounded-xl border border-border/70 bg-muted/10 p-4 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Тип категории
							</label>
							<select
								value={categoryMode}
								onChange={e => {
									const nextMode = e.target.value as CategoryMode
									setCategoryMode(nextMode)
									if (nextMode === 'MANUAL') {
										setFilterKind('PROPERTY_VALUE')
										setFilterPropertyId('')
										setFilterPropertyValueId('')
									}
								}}
								className={inputCls}
							>
								<option value='MANUAL'>Обычная категория</option>
								<option value='FILTER'>Фильтрующая категория</option>
							</select>
						</div>

						<div className='text-xs leading-5 text-muted-foreground'>
							{categoryMode === 'FILTER'
								? 'Такая категория не требует ручной привязки товаров — витрина сама покажет товары по сохранённому правилу.'
								: 'Обычная категория работает как раньше: товары привязываются к ней напрямую.'}
						</div>

						<label className='col-span-full flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3'>
							<input
								type='checkbox'
								checked={showInHeader}
								onChange={e => setShowInHeader(e.target.checked)}
								className='mt-0.5 h-4 w-4 rounded border-border accent-primary'
							/>
							<span className='space-y-1'>
								<span className='block text-sm font-medium text-foreground'>
									Показывать категорию в хедере
								</span>
								<span className='block text-xs leading-5 text-muted-foreground'>
									Если выключить, категория останется в каталоге и админке, но
									исчезнет из меню хедера и мобильного каталога.
								</span>
							</span>
						</label>

						{categoryMode === 'FILTER' && (
							<>
								<div>
									<label className='mb-1 block text-xs font-medium text-muted-foreground'>
										Правило фильтрации
									</label>
									<select
										value={filterKind}
										onChange={e => {
											const nextKind = e.target.value as CategoryFilterKind
											setFilterKind(nextKind)
											if (nextKind !== 'PROPERTY_VALUE') {
												setFilterPropertyId('')
												setFilterPropertyValueId('')
											}
										}}
										className={inputCls}
									>
										<option value='PROPERTY_VALUE'>По значению свойства</option>
										<option value='SALE'>Товары со скидкой</option>
									</select>
								</div>

								{filterKind === 'PROPERTY_VALUE' && (
									<>
										<div>
											<label className='mb-1 block text-xs font-medium text-muted-foreground'>
												Свойство
											</label>
											<select
												value={filterPropertyId}
												onChange={e => {
													setFilterPropertyId(e.target.value)
													setFilterPropertyValueId('')
												}}
												className={inputCls}
												required={
													categoryMode === 'FILTER' &&
													filterKind === 'PROPERTY_VALUE'
												}
											>
												<option value=''>Выберите свойство</option>
												{(properties ?? []).map(property => (
													<option key={property.id} value={property.id}>
														{property.name}
													</option>
												))}
											</select>
										</div>

										<div>
											<label className='mb-1 block text-xs font-medium text-muted-foreground'>
												Значение
											</label>
											<select
												value={filterPropertyValueId}
												onChange={e => setFilterPropertyValueId(e.target.value)}
												className={inputCls}
												disabled={!filterPropertyId}
												required={
													categoryMode === 'FILTER' &&
													filterKind === 'PROPERTY_VALUE'
												}
											>
												<option value=''>
													{!filterPropertyId
														? 'Сначала выберите свойство'
														: availableValues.length > 0
															? 'Выберите значение'
															: 'У свойства пока нет значений'}
												</option>
												{availableValues.map(value => (
													<option key={value.id} value={value.id}>
														{value.value}
													</option>
												))}
											</select>
										</div>
									</>
								)}
							</>
						)}
					</div>

					<FileUploader
						currentImage={editCat?.imagePath ?? pendingImage?.key ?? null}
						onUploaded={(key, originalName) => {
							if (editId) {
								updateImageMut.mutate({
									categoryId: editId,
									imagePath: key,
									imageOriginalName: originalName,
								})
							} else {
								setPendingImage({ key, originalName })
							}
						}}
						onRemove={() => {
							if (editId) removeImageMut.mutate(editId)
							else setPendingImage(null)
						}}
						isLoading={updateImageMut.isPending || removeImageMut.isPending}
						label='Изображение'
					/>

					<div className='flex justify-end gap-2 pt-2'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							Отмена
						</button>
						<button
							type='submit'
							disabled={createMut.isPending || updateMut.isPending}
							className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
						>
							{createMut.isPending || updateMut.isPending
								? 'Сохранение...'
								: 'Сохранить'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
