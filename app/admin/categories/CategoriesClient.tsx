'use client'

import { readBooleanParam, readStringParam } from '@aurasveta/shared-admin'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import FileUploader from '@/shared/ui/FileUploader'
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
import { findNodeInTree } from '@/lib/utils/tree'
import CategoryFormModal from './CategoryFormModal'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'

type CategoryNodeData = NonNullable<
	RouterOutputs['categories']['getTree']
>[number]

function getCategoryModeLabel(category: CategoryNodeData) {
	return category.categoryMode === 'FILTER'
		? 'Фильтрующая категория'
		: 'Обычная категория'
}

/* ============ Main Entry ============ */

export default function CategoriesClient() {
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const selectedId = readStringParam(searchParams.get('category')) || null

	if (selectedId) {
		return (
			<CategoryDetailView
				categoryId={selectedId}
				onBack={() =>
					updateSearchParams(
						{
							category: null,
							edit: null,
							create: null,
							parent: null,
						},
						{ history: 'push' },
					)
				}
			/>
		)
	}

	return (
		<CategoriesGrid
			onSelect={id =>
				updateSearchParams(
					{
						category: id,
						edit: null,
						create: null,
						parent: null,
					},
					{ history: 'push' },
				)
			}
		/>
	)
}

/* ============ Grid of root categories ============ */

function CategoriesGrid({ onSelect }: { onSelect: (id: string) => void }) {
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const treeQuery = trpc.categories.getTree.useQuery()
	const allCategoriesQuery = trpc.categories.getAll.useQuery()
	const { data: tree, refetch, error, isLoading, isFetching } = treeQuery
	const showForm = readBooleanParam(searchParams.get('create'), false) === true
	const totalCategories = allCategoriesQuery.data?.length ?? 0
	const hasOnlyNestedCategories =
		!isLoading && !error && (tree?.length ?? 0) === 0 && totalCategories > 0

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Категории
				</h1>
				<Button
					size='sm'
					variant='primary'
					onClick={() =>
						updateSearchParams(
							{ create: true, edit: null, parent: null },
							{ history: 'push' },
						)
					}
				>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{showForm && (
				<CategoryFormModal
					editId={null}
					parentId={null}
					onClose={() =>
						updateSearchParams(
							{ create: null, edit: null, parent: null },
							{ history: 'replace' },
						)
					}
					onSuccess={() => {
						updateSearchParams(
							{ create: null, edit: null, parent: null },
							{ history: 'replace' },
						)
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
	const { searchParams, updateSearchParams } = useAdminSearchParams()
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
	const editId = readStringParam(searchParams.get('edit')) || null
	const createChild =
		readBooleanParam(searchParams.get('create'), false) === true
	const parentId = readStringParam(searchParams.get('parent')) || null

	const category = tree ? findNodeInTree(tree, categoryId) : null
	const children = category?.children ?? []
	const productCount = category?._count?.products ?? 0
	const showEditModal = editId === categoryId
	const editChildId =
		editId &&
		editId !== categoryId &&
		children.some(child => child.id === editId)
			? editId
			: null
	const showAddChild =
		(createChild && parentId === categoryId) || Boolean(editChildId)

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
								onClick={() =>
									updateSearchParams(
										{ edit: categoryId, create: null, parent: null },
										{ history: 'push' },
									)
								}
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
							updateSearchParams(
								{ create: true, parent: categoryId, edit: null },
								{ history: 'push' },
							)
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
									updateSearchParams(
										{ edit: child.id, create: null, parent: null },
										{ history: 'push' },
									)
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
					onClose={() =>
						updateSearchParams(
							{ edit: null, create: null, parent: null },
							{ history: 'replace' },
						)
					}
					onSuccess={() =>
						updateSearchParams(
							{ edit: null, create: null, parent: null },
							{ history: 'replace' },
						)
					}
				/>
			)}

			{showAddChild && (
				<CategoryFormModal
					editId={editChildId}
					parentId={editChildId ? null : categoryId}
					onClose={() =>
						updateSearchParams(
							{ edit: null, create: null, parent: null },
							{ history: 'replace' },
						)
					}
					onSuccess={() =>
						updateSearchParams(
							{ edit: null, create: null, parent: null },
							{ history: 'replace' },
						)
					}
				/>
			)}
		</div>
	)
}
