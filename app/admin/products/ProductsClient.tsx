'use client'

import { useState, useMemo, useCallback } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
	Search,
	Plus,
	Download,
	Filter,
	X,
	Pencil,
	Copy,
	Trash2,
	Minus,
	Plus as PlusIcon,
} from 'lucide-react'
import { useSelection } from '../hooks/useSelection'
import dynamic from 'next/dynamic'

const ProductFormModal = dynamic(() => import('./components/ProductFormModal'))
import { TableSkeleton } from '../components/AdminSkeleton'
import AdminPagination from '../components/AdminPagination'
import ConfirmDialog from '../components/ConfirmDialog'

function ExportButton() {
	const { refetch } = trpc.admin.exportProducts.useQuery(
		'csv',
		{ enabled: false }
	)

	const handleExport = async () => {
		const result = await refetch()
		if (result.data?.data) {
			const blob = new Blob([result.data.data], { type: 'text/csv;charset=utf-8;' })
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
			link.click()
			URL.revokeObjectURL(link.href)
			toast.success('Экспорт завершён')
		}
	}

	return (
		<Button variant='outline' size='sm' onClick={handleExport}>
			<Download className='h-4 w-4 mr-1' />
			Экспорт
		</Button>
	)
}

export default function ProductsClient() {
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(20)
	const [modalOpen, setModalOpen] = useState(false)
	type ProductItem = RouterOutputs['products']['getMany']['items'][number]

	const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
	const [rootCategoryFilter, setRootCategoryFilter] = useState('')
	const [subcategoryFilter, setSubcategoryFilter] = useState('')
	const [brandFilter, setBrandFilter] = useState('')
	const [inStockFilter, setInStockFilter] = useState<boolean | undefined>(undefined)

	const { selected, toggle, selectAll, clear, isSelected } = useSelection<string>()
	const utils = trpc.useUtils()
	const { data: categories = [] } = trpc.categories.getAll.useQuery()
	const rootCategories = categories.filter(c => !c.parentId)
	const selectedRoot = rootCategories.find(c => c.slug === rootCategoryFilter)
	const subcategories = selectedRoot ? categories.filter(c => c.parentId === selectedRoot.id) : []

	const { data, isLoading, refetch } = trpc.products.getMany.useQuery({
		page,
		limit,
		search: search || undefined,
		rootCategorySlug: rootCategoryFilter || undefined,
		subcategorySlug: subcategoryFilter || undefined,
		brand: brandFilter || undefined,
		inStock: inStockFilter,
	})

	const { mutate: createProduct } = trpc.products.create.useMutation({
		onSuccess: () => {
			toast.success('Товар дублирован')
			refetch()
		},
	})

	const { mutate: deleteProduct } = trpc.products.delete.useMutation({
		onSuccess: () => {
			toast.success('Удалено')
			refetch()
			setConfirmDelete(null)
		},
	})

	const { mutate: updateProduct } = trpc.products.update.useMutation({
		onSuccess: () => {
			toast.success('Сохранено')
			refetch()
		},
	})

	const products = useMemo(() => data?.items ?? [], [data?.items])
	const totalPages = data?.totalPages ?? 1

	const allIds = useMemo(() => products.map((p) => p.id), [products])

	/** Optimistic update для остатка: меняем локально до ответа сервера */
	const adjustStock = useCallback((product: ProductItem, delta: number) => {
		const newStock = Math.max(0, (product.stock || 0) + delta)
		// Оптимистичное обновление кэша
		utils.products.getMany.setData(
			{
				page,
				limit,
				search: search || undefined,
				rootCategorySlug: rootCategoryFilter || undefined,
				subcategorySlug: subcategoryFilter || undefined,
				brand: brandFilter || undefined,
				inStock: inStockFilter,
			},
			(old) => {
				if (!old) return old
				return {
					...old,
					items: old.items.map((p) =>
						p.id === product.id ? { ...p, stock: newStock } : p
					),
				}
			}
		)
		updateProduct({
			id: product.id,
			name: product.name,
			slug: product.slug,
			description: product.description ?? '',
			price: Number(product.price ?? 0),
			compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
			stock: newStock,
			sku: product.sku ?? '',
			rootCategoryId: product.rootCategoryId ?? '',
			subcategoryId: product.subcategoryId ?? '',
			brand: product.brand ?? '',
			brandCountry: product.brandCountry ?? '',
			isActive: product.isActive ?? true,
			images: product.images ?? [],
			properties: product.properties ?? [],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			seo: (product as any).seo ?? { title: '', description: '', keywords: '' },
		})
	}, [utils, page, limit, search, rootCategoryFilter, subcategoryFilter, brandFilter, inStockFilter, updateProduct])

	const getStockBadge = (stock: number) => {
		if (stock <= 0)
			return <Badge className='bg-destructive/15 text-destructive'>Нет в наличии</Badge>
		if (stock <= 20)
			return <Badge className='bg-warning/15 text-warning'>Мало</Badge>
		return <Badge className='bg-success/15 text-success'>Активен</Badge>
	}

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Товары</h1>
					<p className='text-sm text-muted-foreground'>
						{data?.total ?? 0} товаров в каталоге
					</p>
				</div>
				<div className='flex gap-2'>
					<ExportButton />
					<Button
						size='sm'
						onClick={() => {
							setEditingProduct(null)
							setModalOpen(true)
						}}
					>
						<Plus className='h-4 w-4 mr-1' />
						Добавить
					</Button>
				</div>
			</div>

			{/* Toolbar */}
			<div className='flex flex-wrap items-center gap-2'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Поиск по товарам...'
						className='w-64 pl-9'
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
					/>
				</div>
				<select
					className='h-9 rounded-md border border-input bg-background px-3 text-sm'
					value={rootCategoryFilter}
					onChange={(e) => {
						setRootCategoryFilter(e.target.value)
						setSubcategoryFilter('')
						setPage(1)
					}}
				>
					<option value=''>Все категории</option>
					{rootCategories.map((category) => (
						<option key={category.id} value={category.slug}>
							{category.name}
						</option>
					))}
				</select>
				{rootCategoryFilter && subcategories.length > 0 && (
					<select
						className='h-9 rounded-md border border-input bg-background px-3 text-sm'
						value={subcategoryFilter}
						onChange={(e) => {
							setSubcategoryFilter(e.target.value)
							setPage(1)
						}}
					>
						<option value=''>Все подкатегории</option>
						{subcategories.map((category) => (
							<option key={category.id} value={category.slug}>
								{category.name}
							</option>
						))}
					</select>
				)}
				<Button
					variant='outline'
					size='sm'
					onClick={() => setBrandFilter((b) => (b ? '' : 'Aura'))}
					className={brandFilter ? 'border-accent text-accent' : ''}
				>
					<Filter className='h-4 w-4 mr-1' />
					{brandFilter || 'Бренд'}
				</Button>
				<Button
					variant='outline'
					size='sm'
					onClick={() => setInStockFilter((v) => (v === undefined ? true : v ? false : undefined))}
					className={inStockFilter !== undefined ? 'border-accent text-accent' : ''}
				>
					<Filter className='h-4 w-4 mr-1' />
					{inStockFilter === undefined ? 'Наличие' : inStockFilter ? 'В наличии' : 'Нет в наличии'}
				</Button>
				{(rootCategoryFilter || subcategoryFilter || brandFilter || inStockFilter !== undefined) && (
					<Button
						variant='ghost'
						size='sm'
						onClick={() => {
							setRootCategoryFilter('')
							setSubcategoryFilter('')
							setBrandFilter('')
							setInStockFilter(undefined)
							setPage(1)
						}}
					>
						<X className='h-4 w-4 mr-1' />
						Сбросить
					</Button>
				)}
				<div className='ml-auto text-xs text-muted-foreground'>
					Показано {(page - 1) * limit + 1}-{Math.min(page * limit, data?.total ?? 0)} из{' '}
					{data?.total ?? 0}
				</div>
			</div>

			{/* Bulk bar */}
			{selected.size > 0 && (
				<div className='flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2'>
					<span className='text-sm font-semibold text-accent mr-auto'>
						Выбрано {selected.size} товаров
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={() => {
							selected.forEach((id) => {
								const prod = products.find((p) => p.id === id)
								if (prod) {
									updateProduct({
										id: prod.id,
										name: prod.name,
										slug: prod.slug,
										description: prod.description ?? '',
										price: Number(prod.price ?? 0),
										compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : null,
										stock: prod.stock ?? 0,
										sku: prod.sku ?? '',
									rootCategoryId: prod.rootCategoryId ?? '',
									subcategoryId: prod.subcategoryId ?? '',
										brand: prod.brand ?? '',
										brandCountry: prod.brandCountry ?? '',
										isActive: !prod.isActive,
										images: prod.images ?? [],
										properties: prod.properties ?? [],
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										seo: (prod as any).seo ?? { title: '', description: '', keywords: '' },
									})
								}
							})
							clear()
						}}
					>
						Сменить статус
					</Button>
					<Button
						variant='destructive'
						size='sm'
						onClick={() => setConfirmBulkDelete(true)}
					>
						<Trash2 className='h-4 w-4 mr-1' />
						Удалить
					</Button>
					<Button variant='ghost' size='sm' onClick={clear}>
						<X className='h-4 w-4' />
					</Button>
				</div>
			)}

			{/* Table */}
			{isLoading ? (
				<TableSkeleton rows={limit} columns={8} />
			) : (
				<Card className='border-border overflow-hidden'>
					<div className='overflow-x-auto'>
						<Table>
						<TableHeader>
							<TableRow className='border-border hover:bg-transparent'>
								<TableHead className='w-10'>
									<Checkbox
										checked={
											allIds.length > 0 && selected.size === allIds.length
										}
										onCheckedChange={(checked) => {
											if (checked) selectAll(allIds)
											else clear()
										}}
									/>
								</TableHead>
								<TableHead>Товар</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead>Цена</TableHead>
								<TableHead>Остаток</TableHead>
								<TableHead>Статус</TableHead>
								<TableHead>Категория</TableHead>
								<TableHead className='text-right'>Действия</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{products.map((p) => (
								<TableRow
									key={p.id}
									className={`border-border cursor-pointer ${
										isSelected(p.id) ? 'bg-accent/5' : ''
									}`}
								>
									<TableCell>
										<Checkbox
											checked={isSelected(p.id)}
											onCheckedChange={() => toggle(p.id)}
										/>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-3'>
											{Array.isArray(p.images) && p.images.length > 0 ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={p.images[0].url || `/api/storage/file?key=${encodeURIComponent(p.images[0].key)}`}
													alt=''
													className='h-12 w-12 rounded-md object-cover border border-border'
												/>
											) : (
												<div className='h-12 w-12 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground text-xs'>
													—
												</div>
											)}
											<div>
												<div className='font-medium text-sm'>{p.name}</div>
												<div className='text-xs text-muted-foreground'>
													{p.brand || 'Без бренда'}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className='font-mono text-xs text-muted-foreground'>
										{p.sku || '—'}
									</TableCell>
									<TableCell className='font-bold'>
										₽ {p.price?.toLocaleString('ru-RU') ?? 0}
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-2'>
											<span
												className={`font-bold ${
													p.stock <= 0
														? 'text-destructive'
														: p.stock <= 20
															? 'text-warning'
															: ''
												}`}
											>
												{p.stock ?? 0}
											</span>
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6'
												onClick={() => adjustStock(p, -1)}
												aria-label='Уменьшить остаток'
											>
												<Minus className='h-3 w-3' />
											</Button>
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6'
												onClick={() => adjustStock(p, 1)}
												aria-label='Увеличить остаток'
											>
												<PlusIcon className='h-3 w-3' />
											</Button>
										</div>
									</TableCell>
									<TableCell>{getStockBadge(p.stock ?? 0)}</TableCell>
									<TableCell>
										<Badge variant='secondary'>
											{p.subcategory?.name ?? p.category?.name ?? '—'}
										</Badge>
									</TableCell>
									<TableCell className='text-right'>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8'
											onClick={() => {
												setEditingProduct(p)
												setModalOpen(true)
											}}
											aria-label='Редактировать товар'
										>
											<Pencil className='h-4 w-4' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8'
											onClick={() => {
												createProduct({
													name: `${p.name} (копия)`,
													slug: `${p.slug}-copy-${Date.now()}`,
													description: p.description ?? '',
													price: Number(p.price ?? 0),
													compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
													stock: Number(p.stock ?? 0),
													sku: '',
													rootCategoryId: p.rootCategoryId ?? '',
													subcategoryId: p.subcategoryId ?? '',
													brand: p.brand ?? '',
													brandCountry: p.brandCountry ?? '',
													isActive: p.isActive ?? true,
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
											images: (p.images ?? []).map((img: any) => ({
														key: img.key,
														url: img.url,
														originalName: img.originalName,
														size: img.size,
														mimeType: img.mimeType,
														order: img.order,
														isMain: img.isMain,
													})),
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											properties: (p as any).properties ?? [],
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
													seo: (p as any).seo ?? { title: '', description: '', keywords: '' },
												})
											}}
											aria-label='Дублировать товар'
										>
											<Copy className='h-4 w-4' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8 text-destructive'
											onClick={() => setConfirmDelete(p.id)}
											aria-label='Удалить товар'
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									</TableCell>
								</TableRow>
							))}
							{products.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={8}
										className='text-center py-12 text-muted-foreground'
									>
										Нет товаров
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
					</div>
				</Card>
			)}

			{/* Pagination */}
			<AdminPagination
				page={page}
				totalPages={totalPages}
				limit={limit}
				onPageChange={setPage}
				onLimitChange={setLimit}
				total={data?.total}
			/>

			{/* Product Form Modal */}
			<ProductFormModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				product={editingProduct}
				onSuccess={() => refetch()}
			/>

			{/* Confirm Delete Dialog — single */}
			<ConfirmDialog
				open={!!confirmDelete}
				onOpenChange={() => setConfirmDelete(null)}
				title='Подтвердите удаление'
				description='Товар будет безвозвратно удалён. Это действие нельзя отменить.'
				onConfirm={() => confirmDelete && deleteProduct(confirmDelete)}
			/>

			{/* Confirm Bulk Delete Dialog */}
			<ConfirmDialog
				open={confirmBulkDelete}
				onOpenChange={setConfirmBulkDelete}
				title='Подтвердите удаление'
				description={`Вы уверены, что хотите удалить ${selected.size} товаров? Это действие нельзя отменить.`}
				onConfirm={() => {
					selected.forEach((id) => deleteProduct(id))
					clear()
				}}
			/>
		</div>
	)
}

