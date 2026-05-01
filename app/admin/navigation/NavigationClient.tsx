'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from 'lucide-react'
import { SortableList } from '@aurasveta/shared-admin'

type NavZone = 'HEADER' | 'FOOTER'

type DraftNavItem = {
	id: string
	pageId: string
	labelOverride: string | null
	isActive: boolean
	order: number
	isNew?: boolean
}

type PublishedPageOption = {
	id: string
	title: string
	slug: string
}

const zoneLabels: Record<NavZone, string> = {
	HEADER: 'Хедер',
	FOOTER: 'Футер',
}

function normalizeOrder(items: DraftNavItem[]): DraftNavItem[] {
	return items.map((item, index) => ({
		...item,
		order: index,
	}))
}

function normalizeSnapshot(items: DraftNavItem[]): Array<{
	pageId: string
	labelOverride: string | null
	isActive: boolean
}> {
	return normalizeOrder(items).map(item => ({
		pageId: item.pageId,
		labelOverride: item.labelOverride?.trim() || null,
		isActive: item.isActive,
	}))
}

function createDraft(pageId: string, order: number): DraftNavItem {
	return {
		id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		pageId,
		labelOverride: null,
		isActive: true,
		order,
		isNew: true,
	}
}

function ZoneEditor({ zone }: { zone: NavZone }) {
	const [draftItemsState, setDraftItemsState] = useState<DraftNavItem[] | null>(null)
	const [selectedPageId, setSelectedPageId] = useState<string>('')

	const {
		data,
		isLoading,
		refetch,
		isFetching,
	} = trpc.siteNav.getEditorState.useQuery({ zone })

	const { mutate: saveZone, isPending: isSaving } = trpc.siteNav.replaceZone.useMutation({
		onSuccess: async () => {
			toast.success(`${zoneLabels[zone]}: изменения сохранены`)
			setDraftItemsState(null)
			await refetch()
		},
		onError: error => {
			toast.error(error.message)
		},
	})

	const sourceItems = useMemo<DraftNavItem[]>(() => {
		const sortedItems = [...(data?.items ?? [])].sort((a, b) => a.order - b.order)
		return sortedItems.map(item => ({
			id: item.id,
			pageId: item.pageId,
			labelOverride: item.labelOverride,
			isActive: item.isActive,
			order: item.order,
		}))
	}, [data?.items])

	const draftItems = draftItemsState ?? sourceItems
	const pages: PublishedPageOption[] = data?.pages ?? []
	const pageById = useMemo(
		() => new Map(pages.map(page => [page.id, page])),
		[pages],
	)

	const usedPageIds = useMemo(() => new Set(draftItems.map(item => item.pageId)), [draftItems])
	const hasChanges = useMemo(() => {
		if (!data) return false
		const normalizedDraft = JSON.stringify(normalizeSnapshot(draftItems))
		const normalizedData = JSON.stringify(normalizeSnapshot(sourceItems))
		return normalizedDraft !== normalizedData
	}, [data, draftItems, sourceItems])

	const addItem = () => {
		if (!selectedPageId) return
		if (usedPageIds.has(selectedPageId)) {
			toast.error('Эта страница уже добавлена в текущую зону')
			return
		}
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			return [...base, createDraft(selectedPageId, base.length)]
		})
		setSelectedPageId('')
	}

	const removeItem = (id: string) => {
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			return normalizeOrder(base.filter(item => item.id !== id))
		})
	}

	const reorderItems = (items: DraftNavItem[]) => {
		setDraftItemsState(normalizeOrder(items))
	}

	const save = () => {
		saveZone({
			zone,
			items: normalizeOrder(draftItems).map(item => ({
				pageId: item.pageId,
				labelOverride: item.labelOverride,
				isActive: item.isActive,
			})),
		})
	}

	if (isLoading) {
		return (
			<Card className='border-border'>
				<CardContent className='py-10 text-center text-sm text-muted-foreground'>
					Загрузка навигации...
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='space-y-4'>
			<Card className='border-border'>
				<CardHeader className='pb-3'>
					<CardTitle className='text-base font-semibold'>
						Структура зоны {zoneLabels[zone]}
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-3'>
					<div className='flex flex-wrap items-center gap-2'>
						<Select value={selectedPageId} onValueChange={setSelectedPageId}>
							<SelectTrigger className='min-w-[280px]' aria-label='Выбор страницы для добавления'>
								<SelectValue placeholder='Выберите опубликованную страницу' />
							</SelectTrigger>
							<SelectContent>
								{pages.map(page => (
									<SelectItem
										key={page.id}
										value={page.id}
										disabled={usedPageIds.has(page.id)}
									>
										{page.title} (/{page.slug})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button type='button' size='sm' onClick={addItem} disabled={!selectedPageId}>
							<Plus className='mr-1 h-4 w-4' />
							Добавить
						</Button>
						<div className='ml-auto flex items-center gap-2'>
							{hasChanges ? <Badge variant='secondary'>Есть несохранённые изменения</Badge> : null}
							<Button
								type='button'
								size='sm'
								onClick={save}
								disabled={!hasChanges || isSaving}
							>
								<Save className='mr-1 h-4 w-4' />
								{isSaving ? 'Сохранение...' : 'Сохранить'}
							</Button>
						</div>
					</div>

					<SortableList
						items={draftItems}
						getId={item => item.id}
						onReorder={reorderItems}
						emptyState={
							<div className='rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground'>
								Навигационные ссылки не настроены. Добавьте первую опубликованную страницу.
							</div>
						}
						renderItem={(item) => {
							const page = pageById.get(item.pageId)
							return (
								<div className='space-y-3'>
									<div className='flex flex-wrap items-center gap-2'>
										<Select
											value={item.pageId}
											onValueChange={nextPageId => {
												if (draftItems.some(d => d.id !== item.id && d.pageId === nextPageId)) {
													toast.error('Эта страница уже есть в зоне')
													return
												}
												setDraftItemsState(prev =>
													(prev ?? sourceItems).map(d =>
														d.id === item.id ? { ...d, pageId: nextPageId } : d,
													),
												)
											}}
										>
											<SelectTrigger className='min-w-[280px]' aria-label='Страница ссылки'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{pages.map(pageOption => (
													<SelectItem
														key={pageOption.id}
														value={pageOption.id}
														disabled={
															pageOption.id !== item.pageId && usedPageIds.has(pageOption.id)
														}
													>
														{pageOption.title} (/{pageOption.slug})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<div className='flex items-center gap-2'>
											<Switch
												checked={item.isActive}
												onCheckedChange={checked => {
													setDraftItemsState(prev =>
														(prev ?? sourceItems).map(d =>
															d.id === item.id ? { ...d, isActive: checked } : d,
														),
													)
												}}
												aria-label='Активность ссылки'
											/>
											<Button
												type='button'
												variant='ghost'
												size='icon'
												onClick={() => removeItem(item.id)}
												aria-label='Удалить ссылку'
											>
												<Trash2 className='h-4 w-4 text-destructive' />
											</Button>
										</div>
									</div>
									<Input
										value={item.labelOverride ?? ''}
										onChange={event => {
											const nextValue = event.target.value
											setDraftItemsState(prev =>
												(prev ?? sourceItems).map(d =>
													d.id === item.id
														? { ...d, labelOverride: nextValue.length > 0 ? nextValue : null }
														: d,
												),
											)
										}}
										placeholder={page?.title ?? 'Переопределить подпись ссылки'}
										maxLength={120}
									/>
								</div>
							)
						}}
					/>
				</CardContent>
			</Card>
			{isFetching ? (
				<p className='text-xs text-muted-foreground'>Обновление данных...</p>
			) : null}
		</div>
	)
}

export default function NavigationClient() {
	const [tab, setTab] = useState<NavZone>('HEADER')

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<h1 className='text-xl font-bold'>Навигация сайта</h1>
				<p className='text-sm text-muted-foreground'>
					Управляйте ссылками хедера и футера, сортируйте их перетаскиванием и публикуйте без деплоя.
				</p>
			</div>

			<Tabs value={tab} onValueChange={value => setTab(value as NavZone)}>
				<TabsList className='mb-2'>
					<TabsTrigger value='HEADER'>Хедер</TabsTrigger>
					<TabsTrigger value='FOOTER'>Футер</TabsTrigger>
				</TabsList>
				<TabsContent value='HEADER'>
					<ZoneEditor zone='HEADER' />
				</TabsContent>
				<TabsContent value='FOOTER'>
					<ZoneEditor zone='FOOTER' />
				</TabsContent>
			</Tabs>
		</div>
	)
}
