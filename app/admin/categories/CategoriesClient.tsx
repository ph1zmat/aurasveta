'use client'

import { useMemo, useState } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
import AdminModal from '@/shared/ui/AdminModal'
import {
	Pencil,
	Trash2,
	Plus,
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
import { findNodeInTree } from '@/lib/utils/tree'

type CategoryNodeData = NonNullable<
	RouterOutputs['categories']['getTree']
>[number]

type CategoryMode = 'MANUAL' | 'FILTER'
type CategoryFilterKind = 'PROPERTY_VALUE' | 'SALE'
type CategoryFormState = {
	name: string
	slug: string
	description: string
	categoryMode: CategoryMode
	filterKind: CategoryFilterKind
	filterPropertyId: string
	filterPropertyValueId: string
	showInHeader: boolean
	slugTouched: boolean
	pendingImage: {
		key: string
		originalName: string
	} | null
}

function getCategoryFormState(editCat: CategoryNodeData | null): CategoryFormState {
	if (!editCat) {
		return {
			name: '',
			slug: '',
			description: '',
			categoryMode: 'MANUAL',
			filterKind: 'PROPERTY_VALUE',
			filterPropertyId: '',
			filterPropertyValueId: '',
			showInHeader: true,
			slugTouched: false,
			pendingImage: null,
		}
	}

	return {
		name: editCat.name ?? '',
		slug: editCat.slug ?? '',
		description: editCat.description ?? '',
		categoryMode: editCat.categoryMode ?? 'MANUAL',
		filterKind: editCat.filterKind ?? 'PROPERTY_VALUE',
		filterPropertyId: editCat.filterPropertyId ?? '',
		filterPropertyValueId: editCat.filterPropertyValueId ?? '',
		showInHeader: editCat.showInHeader ?? true,
		slugTouched: true,
		pendingImage: null,
	}
}

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

	const category = tree ? findNodeInTree(tree, categoryId) : null
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
					<div className='w-44 shrink-0'>
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
							aspectRatio='square'
							compact
							hideLabel
							helperText=''
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
	const { data: tree } = trpc.categories.getTree.useQuery()
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
		onSuccess: invalidateCategoryQueries,
	})
	const removeImageMut = trpc.categories.removeImage.useMutation({
		onSuccess: invalidateCategoryQueries,
	})

	const editCat = editId && tree ? findNodeInTree(tree, editId) : null
	const { data: properties } = trpc.properties.getAll.useQuery()

	return (
		<CategoryFormModalContent
			key={`${editId ?? 'new'}:${editCat?.id ?? 'blank'}`}
			editId={editId}
			parentId={parentId}
			onClose={onClose}
			onSuccess={onSuccess}
			createMut={createMut}
			updateMut={updateMut}
			updateImageMut={updateImageMut}
			removeImageMut={removeImageMut}
			editCat={editCat}
			properties={properties ?? []}
		/>
	)
}

function CategoryFormModalContent({
	editId,
	parentId,
	onClose,
	onSuccess,
	createMut,
	updateMut,
	updateImageMut,
	removeImageMut,
	editCat,
	properties,
}: {
	editId: string | null
	parentId: string | null
	onClose: () => void
	onSuccess: () => void
	createMut: ReturnType<typeof trpc.categories.create.useMutation>
	updateMut: ReturnType<typeof trpc.categories.update.useMutation>
	updateImageMut: ReturnType<typeof trpc.categories.updateImagePath.useMutation>
	removeImageMut: ReturnType<typeof trpc.categories.removeImage.useMutation>
	editCat: CategoryNodeData | null
	properties: RouterOutputs['properties']['getAll']
}) {
	const [form, setForm] = useState<CategoryFormState>(() =>
		getCategoryFormState(editCat),
	)
	const selectedFilterPropertyId =
		form.categoryMode === 'FILTER' && form.filterKind === 'PROPERTY_VALUE'
			? form.filterPropertyId
			: ''

	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		selectedFilterPropertyId,
		{ enabled: Boolean(selectedFilterPropertyId) },
	)

	const availableValues = useMemo(
		() => selectedProperty?.values ?? [],
		[selectedProperty],
	)

	const inputCls =
		'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
	const formId = 'category-form-modal'

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const data = {
			name: form.name,
			slug: form.slug || generateSlug(form.name),
			description: form.description || undefined,
			parentId: parentId || undefined,
			categoryMode: form.categoryMode,
			filterKind: form.categoryMode === 'FILTER' ? form.filterKind : null,
			filterPropertyId:
				form.categoryMode === 'FILTER' && form.filterKind === 'PROPERTY_VALUE'
					? form.filterPropertyId || null
					: null,
			filterPropertyValueId:
				form.categoryMode === 'FILTER' && form.filterKind === 'PROPERTY_VALUE'
					? form.filterPropertyValueId || null
					: null,
			showInHeader: form.showInHeader,
		}

		if (editId) {
			updateMut.mutate({ id: editId, ...data })
			return
		}

		createMut.mutate(data, {
			onSuccess: created => {
				if (form.pendingImage?.key) {
					updateImageMut.mutate({
						categoryId: created.id,
						imagePath: form.pendingImage.key,
						imageOriginalName: form.pendingImage.originalName,
					})
				}
				onSuccess()
			},
		})
	}

	return (
		<AdminModal
			isOpen
			onClose={onClose}
			title={editId ? 'Редактировать категорию' : 'Новая категория'}
			size='md'
			footer={[
				<button
					key='cancel'
					type='button'
					onClick={onClose}
					className='rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					Отмена
				</button>,
				<button
					key='submit'
					type='submit'
					form={formId}
					disabled={createMut.isPending || updateMut.isPending}
					className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
				>
					{createMut.isPending || updateMut.isPending
						? 'Сохранение...'
						: 'Сохранить'}
				</button>,
			]}
		>
			<form id={formId} onSubmit={handleSubmit} className='space-y-4 p-6'>
					<div>
						<label className='mb-1 block text-xs font-medium text-muted-foreground'>
							Название <span className='text-destructive'>*</span>
						</label>
						<input
							required
							value={form.name}
							onChange={e => {
								const val = e.target.value
								setForm(prev => ({
									...prev,
									name: val,
									slug: prev.slugTouched ? prev.slug : generateSlug(val),
								}))
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
							value={form.slug}
							onChange={e => {
								setForm(prev => ({
									...prev,
									slugTouched: true,
									slug: e.target.value,
								}))
							}}
							onBlur={() => {
								setForm(prev => ({
									...prev,
									slug: prev.slug ? generateSlug(prev.slug) : prev.slug,
								}))
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
							value={form.description}
							onChange={e =>
								setForm(prev => ({ ...prev, description: e.target.value }))
							}
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
								value={form.categoryMode}
								onChange={e => {
									const nextMode = e.target.value as CategoryMode
									setForm(prev => ({
										...prev,
										categoryMode: nextMode,
										filterKind:
											nextMode === 'MANUAL' ? 'PROPERTY_VALUE' : prev.filterKind,
										filterPropertyId:
											nextMode === 'MANUAL' ? '' : prev.filterPropertyId,
										filterPropertyValueId:
											nextMode === 'MANUAL' ? '' : prev.filterPropertyValueId,
									}))
								}}
								className={inputCls}
							>
								<option value='MANUAL'>Обычная категория</option>
								<option value='FILTER'>Фильтрующая категория</option>
							</select>
						</div>

						<div className='text-xs leading-5 text-muted-foreground'>
							{form.categoryMode === 'FILTER'
								? 'Такая категория не требует ручной привязки товаров — витрина сама покажет товары по сохранённому правилу.'
								: 'Обычная категория работает как раньше: товары привязываются к ней напрямую.'}
						</div>

						<label className='col-span-full flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3'>
							<input
								type='checkbox'
								checked={form.showInHeader}
								onChange={e =>
									setForm(prev => ({ ...prev, showInHeader: e.target.checked }))
								}
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

						{form.categoryMode === 'FILTER' && (
							<>
								<div>
									<label className='mb-1 block text-xs font-medium text-muted-foreground'>
										Правило фильтрации
									</label>
									<select
										value={form.filterKind}
										onChange={e => {
											const nextKind = e.target.value as CategoryFilterKind
											setForm(prev => ({
												...prev,
												filterKind: nextKind,
												filterPropertyId:
													nextKind === 'PROPERTY_VALUE' ? prev.filterPropertyId : '',
												filterPropertyValueId:
													nextKind === 'PROPERTY_VALUE'
														? prev.filterPropertyValueId
														: '',
											}))
										}}
										className={inputCls}
									>
										<option value='PROPERTY_VALUE'>По значению свойства</option>
										<option value='SALE'>Товары со скидкой</option>
									</select>
								</div>

								{form.filterKind === 'PROPERTY_VALUE' && (
									<>
										<div>
											<label className='mb-1 block text-xs font-medium text-muted-foreground'>
												Свойство
											</label>
											<select
												value={form.filterPropertyId}
												onChange={e => {
													setForm(prev => ({
														...prev,
														filterPropertyId: e.target.value,
														filterPropertyValueId: '',
													}))
												}}
												className={inputCls}
												required={
													form.categoryMode === 'FILTER' &&
													form.filterKind === 'PROPERTY_VALUE'
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
												value={form.filterPropertyValueId}
												onChange={e =>
													setForm(prev => ({
														...prev,
														filterPropertyValueId: e.target.value,
													}))
												}
												className={inputCls}
												disabled={!form.filterPropertyId}
												required={
													form.categoryMode === 'FILTER' &&
													form.filterKind === 'PROPERTY_VALUE'
												}
											>
												<option value=''>
													{!form.filterPropertyId
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
						currentImage={editCat?.imagePath ?? form.pendingImage?.key ?? null}
						onUploaded={(key, originalName) => {
							if (editId) {
								updateImageMut.mutate({
									categoryId: editId,
									imagePath: key,
									imageOriginalName: originalName,
								})
							} else {
								setForm(prev => ({
									...prev,
									pendingImage: { key, originalName },
								}))
							}
						}}
						onRemove={() => {
							if (editId) removeImageMut.mutate(editId)
							else setForm(prev => ({ ...prev, pendingImage: null }))
						}}
						isLoading={updateImageMut.isPending || removeImageMut.isPending}
						label='Изображение'
						aspectRatio='square'
					/>

			</form>
		</AdminModal>
	)
}
