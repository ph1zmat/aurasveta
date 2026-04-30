'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
	Plus,
	Trash2,
	Pencil,
	FolderOpen,
	Folder,
	FileText,
	ChevronRight,
	ChevronDown,
	Save,
	Image as ImageIcon,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const CategoryFormModal = dynamic(() => import('./components/CategoryFormModal'))
import { MediaPicker } from '@/packages/shared-admin/src/ui/admin/MediaPicker'

type CategoryEditorValue = {
	id: string
	name?: string | null
	slug?: string | null
	description?: string | null
	showInHeader?: boolean | null
	imagePath?: string | null
	imageOriginalName?: string | null
	parentId?: string | null
	categoryMode?: 'MANUAL' | 'FILTER' | null
	filterPropertyId?: string | null
	filterPropertyValueId?: string | null
}

export default function CategoriesClient() {
	const [modalOpen, setModalOpen] = useState(false)
	const [editingCategory, setEditingCategory] = useState<
		CategoryEditorValue | undefined
	>(undefined)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const [expanded, setExpanded] = useState<Set<string>>(new Set())

	const { data: categories, refetch } = trpc.categories.getAll.useQuery()
	const { mutate: deleteCategory } = trpc.categories.delete.useMutation({
		onSuccess: () => {
			toast.success('Категория удалена')
			refetch()
			setConfirmDelete(null)
			setSelectedId(null)
		},
	})
	const { mutate: updateCategory } = trpc.categories.update.useMutation({
		onSuccess: () => {
			toast.success('Сохранено')
			refetch()
		},
	})

	const selected = categories?.find(c => c.id === selectedId)

	const { data: seoData } = trpc.seo.getByTarget.useQuery(
		{ targetType: 'category', targetId: selected?.id ?? '' },
		{ enabled: !!selected },
	)

	const { mutate: updateSeo } = trpc.seo.update.useMutation({
		onSuccess: () => {
			toast.success('SEO сохранено')
		},
	})

	const [editName, setEditName] = useState('')
	const [editSlug, setEditSlug] = useState('')
	const [editDescription, setEditDescription] = useState('')
	const [editShowInHeader, setEditShowInHeader] = useState(true)
	const [editImagePath, setEditImagePath] = useState<string | null>(null)
	const [, setEditImageOriginalName] = useState<string | null>(null)
	const [editMetaTitle, setEditMetaTitle] = useState('')
	const [editMetaDesc, setEditMetaDesc] = useState('')

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (selected) {
			setEditName(selected.name ?? '')
			setEditSlug(selected.slug ?? '')
			setEditDescription(selected.description ?? '')
			setEditShowInHeader(selected.showInHeader ?? true)
			setEditImagePath(selected.imagePath ?? null)
			setEditImageOriginalName(selected.imageOriginalName ?? null)
		}
	}, [selected])
	/* eslint-enable react-hooks/set-state-in-effect */

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (seoData) {
			setEditMetaTitle(seoData.title ?? '')
			setEditMetaDesc(seoData.description ?? '')
		}
	}, [seoData])
	/* eslint-enable react-hooks/set-state-in-effect */

	const handleSaveDetail = () => {
		if (!selected) return
		updateCategory({
			id: selected.id,
			name: editName,
			slug: editSlug || undefined,
			description: editDescription || undefined,
			showInHeader: editShowInHeader,
			imagePath: editImagePath ?? undefined,
		})
		if (editMetaTitle || editMetaDesc) {
			updateSeo({
				targetType: 'category',
				targetId: selected.id,
				title: editMetaTitle || null,
				description: editMetaDesc || null,
				keywords: null,
				ogTitle: null,
				ogDescription: null,
				ogImage: null,
				canonicalUrl: null,
				noIndex: false,
			})
		}
	}

	const toggleExpand = (id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setExpanded(prev => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const renderTree = (parentId: string | null = null, depth = 0) => {
		const items = categories?.filter(c => c.parentId === parentId) ?? []
		return items.map(cat => {
			const hasChildren = categories?.some(c => c.parentId === cat.id) ?? false
			const isExpanded = expanded.has(cat.id)
			const isSelected = selectedId === cat.id
			return (
				<div key={cat.id}>
					<div
						className={`group flex items-center gap-1.5 py-2 pr-3 rounded-md cursor-pointer transition-colors select-none
${isSelected ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-secondary text-foreground'}
`}
						style={{ paddingLeft: `${12 + depth * 18}px` }}
						onClick={() => setSelectedId(cat.id)}
					>
						{/* Expand chevron */}
						<button
							className={`h-4 w-4 shrink-0 transition-transform ${hasChildren ? 'opacity-60 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
							onClick={e => hasChildren && toggleExpand(cat.id, e)}
						>
							{isExpanded ? (
								<ChevronDown className='h-3.5 w-3.5' />
							) : (
								<ChevronRight className='h-3.5 w-3.5' />
							)}
						</button>
						{/* Icon */}
						{hasChildren ? (
							isExpanded ? (
								<FolderOpen
									className={`h-4 w-4 shrink-0 ${isSelected ? 'text-accent' : 'text-amber-500'}`}
								/>
							) : (
								<Folder
									className={`h-4 w-4 shrink-0 ${isSelected ? 'text-accent' : 'text-amber-500'}`}
								/>
							)
						) : (
							<FileText
								className={`h-4 w-4 shrink-0 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`}
							/>
						)}
						<span className='flex-1 text-sm truncate'>{cat.name}</span>
						<Badge variant='secondary' className='text-[10px] shrink-0'>
							{cat._count?.products ?? 0}
						</Badge>
					</div>
					{hasChildren && isExpanded && renderTree(cat.id, depth + 1)}
				</div>
			)
		})
	}

	// Products in this category
	const { data: productsData } = trpc.products.getMany.useQuery(
		{ categorySlug: selected?.slug ?? '', page: 1, limit: 20 },
		{ enabled: !!selectedId && !!selected?.slug },
	)

	const seoScore = (() => {
		const t =
			editMetaTitle.length >= 10 && editMetaTitle.length <= 60
				? 50
				: editMetaTitle.length > 0
					? 25
					: 0
		const d =
			editMetaDesc.length >= 50 && editMetaDesc.length <= 160
				? 50
				: editMetaDesc.length > 0
					? 25
					: 0
		return t + d
	})()

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Категории</h1>
					<p className='text-sm text-muted-foreground'>
						{categories?.length ?? 0} категорий в иерархии
					</p>
				</div>
				<Button
					size='sm'
					onClick={() => {
						setEditingCategory(undefined)
						setModalOpen(true)
					}}
				>
					<Plus className='h-4 w-4 mr-1' />
					Новая категория
				</Button>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4'>
				{/* Tree */}
				<Card className='border-border h-fit'>
					<CardHeader className='pb-2'>
						<CardTitle className='text-base font-bold'>
							Дерево категорий
						</CardTitle>
					</CardHeader>
					<CardContent className='p-2'>
						{(categories?.length ?? 0) === 0 ? (
							<div className='text-center py-8 text-muted-foreground text-sm'>
								Нет категорий
							</div>
						) : (
							renderTree()
						)}
					</CardContent>
				</Card>

				{/* Detail panel */}
				<Card className='border-border'>
					<CardHeader className='flex flex-row items-center justify-between pb-3 border-b border-border'>
						<CardTitle className='text-base font-bold'>
							{selected?.name ?? 'Выберите категорию'}
						</CardTitle>
						{selected && (
							<div className='flex gap-1'>
								<Button size='sm' variant='default' onClick={handleSaveDetail}>
									<Save className='h-4 w-4 mr-1' />
									Сохранить
								</Button>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => {
										setEditingCategory(selected)
										setModalOpen(true)
									}}
								>
									<Pencil className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='icon'
									className='text-destructive hover:text-destructive'
									onClick={() => setConfirmDelete(selected.id)}
								>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						)}
					</CardHeader>
					<CardContent className='pt-4'>
						{selected ? (
							<Tabs defaultValue='general'>
								<TabsList className='mb-4'>
									<TabsTrigger value='general'>Основное</TabsTrigger>
									<TabsTrigger value='seo'>SEO</TabsTrigger>
									<TabsTrigger value='image'>Изображение</TabsTrigger>
									<TabsTrigger value='products'>Товары</TabsTrigger>
								</TabsList>

								{/* General tab */}
								<TabsContent value='general' className='space-y-4'>
									<div className='space-y-2'>
										<label className='text-sm font-medium'>Название</label>
										<Input
											value={editName}
											onChange={e => setEditName(e.target.value)}
										/>
									</div>
									<div className='space-y-2'>
										<label className='text-sm font-medium'>Slug</label>
										<Input
											value={editSlug}
											onChange={e => setEditSlug(e.target.value)}
											className='font-mono text-sm'
										/>
									</div>
									<div className='space-y-2'>
										<label className='text-sm font-medium'>Описание</label>
										<textarea
											className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none'
											value={editDescription}
											onChange={e => setEditDescription(e.target.value)}
										/>
									</div>
									<div className='flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/30'>
										<div>
											<div className='text-sm font-medium'>
												Показывать в шапке
											</div>
											<div className='text-xs text-muted-foreground mt-0.5'>
												Навигационное меню
											</div>
										</div>
										<Switch
											checked={editShowInHeader}
											onCheckedChange={setEditShowInHeader}
										/>
									</div>
								</TabsContent>

								{/* SEO tab */}
								<TabsContent value='seo' className='space-y-4'>
									<div className='space-y-2'>
										<label className='text-sm font-medium'>Meta Title</label>
										<Input
											value={editMetaTitle}
											onChange={e => setEditMetaTitle(e.target.value)}
										/>
										<div className='text-xs text-muted-foreground text-right'>
											{editMetaTitle.length}/60
										</div>
									</div>
									<div className='space-y-2'>
										<label className='text-sm font-medium'>
											Meta Description
										</label>
										<textarea
											className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none'
											value={editMetaDesc}
											onChange={e => setEditMetaDesc(e.target.value)}
										/>
										<div className='text-xs text-muted-foreground text-right'>
											{editMetaDesc.length}/160
										</div>
									</div>
									{/* SEO Score */}
									<div className='space-y-1.5'>
										<div className='flex items-center justify-between text-xs'>
											<span className='font-medium'>SEO Score</span>
											<span
												className={`font-bold ${seoScore >= 80 ? 'text-success' : seoScore >= 50 ? 'text-warning' : 'text-destructive'}`}
											>
												{seoScore}/100
											</span>
										</div>
										<div className='h-2 w-full rounded-full bg-secondary overflow-hidden'>
											<div
												className={`h-full rounded-full transition-all duration-300 ${seoScore >= 80 ? 'bg-success' : seoScore >= 50 ? 'bg-warning' : 'bg-destructive'}`}
												style={{ width: `${seoScore}%` }}
											/>
										</div>
									</div>
									{/* Google Preview */}
									<div className='rounded-lg border border-border bg-card p-4 space-y-1'>
										<div className='text-xs text-muted-foreground mb-2 font-medium'>
											Google Preview
										</div>
										<div className='text-blue-600 text-sm font-medium truncate'>
											{editMetaTitle || selected.name || 'Заголовок страницы'}
										</div>
										<div className='text-green-700 text-xs'>
											https://ваш-сайт.ru/catalog/{selected.slug}
										</div>
										<div className='text-xs text-muted-foreground line-clamp-2'>
											{editMetaDesc ||
												selected.description ||
												'Описание страницы будет отображено в результатах поиска.'}
										</div>
									</div>
								</TabsContent>

								{/* Image tab */}
								<TabsContent
									value='image'
									className='space-y-4 flex flex-row flex-nowrap'
								>
									<MediaPicker
										label='Изображение категории'
										value={editImagePath}
										compact
										onChange={(val, origName) => {
											setEditImagePath(val)
											setEditImageOriginalName(origName ?? null)
										}}
										aspectRatio='landscape'
									/>
								</TabsContent>

								{/* Products tab */}
								<TabsContent value='products' className='space-y-3'>
									<div className='text-sm text-muted-foreground'>
										Товаров в категории:{' '}
										<span className='font-bold text-foreground'>
											{selected._count?.products ?? 0}
										</span>
									</div>
									{(productsData?.items ?? []).length > 0 ? (
										<div className='rounded-lg border border-border overflow-hidden'>
											{(productsData?.items ?? []).map(p => (
												<div
													key={p.id}
													className='flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors'
												>
													<div className='h-10 w-10 rounded-md border border-border bg-secondary overflow-hidden shrink-0'>
														{p.images?.[0]?.url ? (
															// eslint-disable-next-line @next/next/no-img-element
															<img
																src={p.images[0].url}
																alt={p.name}
																className='h-full w-full object-cover'
															/>
														) : (
															<div
																className='max-w-xl max-h-xl
															 flex items-center justify-center'
															>
																<ImageIcon className='h-4 w-4 text-muted-foreground/40' />
															</div>
														)}
													</div>
													<div className='flex-1 min-w-0'>
														<div className='text-sm font-medium truncate'>
															{p.name}
														</div>
														<div className='text-xs text-muted-foreground'>
															{p.sku ?? '—'}
														</div>
													</div>
													<div className='text-sm font-bold shrink-0'>
														₽{(p.price ?? 0).toLocaleString('ru-RU')}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className='text-center py-8 text-muted-foreground text-sm'>
											Нет товаров в этой категории
										</div>
									)}
								</TabsContent>
							</Tabs>
						) : (
							<div className='text-center py-16 text-muted-foreground text-sm flex flex-col items-center gap-3'>
								<FolderOpen className='h-12 w-12 text-muted-foreground/30' />
								Выберите категорию из дерева
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<CategoryFormModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => refetch()}
				category={editingCategory}
			/>

			{/* Confirm delete */}
			{confirmDelete && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
					<div className='bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl'>
						<h3 className='text-lg font-bold mb-2'>Удалить категорию?</h3>
						<p className='text-sm text-muted-foreground mb-4'>
							Это действие нельзя отменить. Все дочерние категории и связи с
							товарами будут удалены.
						</p>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setConfirmDelete(null)}>
								Отмена
							</Button>
							<Button
								variant='destructive'
								onClick={() => deleteCategory(confirmDelete)}
							>
								Удалить
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
