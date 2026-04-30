'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Save } from 'lucide-react'

const SEO_FILTERS = [
	'all',
	'missing-title',
	'missing-desc',
	'noindex',
] as const

type SeoFilter = (typeof SEO_FILTERS)[number]

type SeoTargetType = 'product' | 'category' | 'page'

type SeoEditFields = {
	title?: string | null
	description?: string | null
	keywords?: string | null
	ogTitle?: string | null
	ogDescription?: string | null
	ogImage?: string | null
	canonicalUrl?: string | null
	noIndex?: boolean
}

type SeoEditState = Record<string, SeoEditFields>

type SeoListItem = {
	id: string
	targetType: SeoTargetType
	targetId: string
	title?: string | null
	description?: string | null
	keywords?: string | null
	ogTitle?: string | null
	ogDescription?: string | null
	ogImage?: string | null
	canonicalUrl?: string | null
	noIndex?: boolean
}

export default function SeoClient() {
	const [filter, setFilter] = useState<SeoFilter>('all')
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [editing, setEditing] = useState<SeoEditState>({})

	const { data: seoList, refetch } = trpc.seo.listAll.useQuery()
	const { mutate: updateSeo } = trpc.seo.update.useMutation({
		onSuccess: () => {
			toast.success('SEO сохранено')
			refetch()
		},
	})

	const filtered = ((seoList ?? []) as SeoListItem[]).filter((item) => {
		if (filter === 'missing-title') return !item.title
		if (filter === 'missing-desc') return !item.description
		if (filter === 'noindex') return item.noIndex
		return true
	})

	const handleEdit = <K extends keyof SeoEditFields>(
		id: string,
		field: K,
		value: SeoEditFields[K],
	) => {
		setEditing((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? {}), [field]: value },
		}))
	}

	const handleSave = (item: SeoListItem) => {
		const changes: SeoEditFields = editing[item.id] ?? {}
		updateSeo({
			targetType: item.targetType,
			targetId: item.targetId,
			title: changes.title !== undefined ? changes.title : item.title,
			description: changes.description !== undefined ? changes.description : item.description,
			keywords: changes.keywords !== undefined ? changes.keywords : item.keywords,
			ogTitle: changes.ogTitle !== undefined ? changes.ogTitle : item.ogTitle,
			ogDescription: changes.ogDescription !== undefined ? changes.ogDescription : item.ogDescription,
			ogImage: changes.ogImage !== undefined ? changes.ogImage : item.ogImage,
			canonicalUrl: changes.canonicalUrl !== undefined ? changes.canonicalUrl : item.canonicalUrl,
			noIndex: changes.noIndex !== undefined ? changes.noIndex : item.noIndex,
		})
		setExpandedId(null)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>SEO Массовый редактор</h1>
					<p className='text-sm text-muted-foreground'>Редактирование мета-тегов</p>
				</div>
			</div>

			<div className='flex gap-2 flex-wrap'>
				{SEO_FILTERS.map((f) => (
					<Button
						key={f}
						variant={filter === f ? 'default' : 'outline'}
						size='sm'
						onClick={() => setFilter(f)}
					>
						{f === 'all' && 'Все'}
						{f === 'missing-title' && 'Пропущен title'}
						{f === 'missing-desc' && 'Пропущено description'}
						{f === 'noindex' && 'Noindex'}
					</Button>
				))}
			</div>

			<Card className='border-border'>
				<CardContent className='p-0'>
					<table className='w-full text-sm'>
						<thead>
							<tr className='border-b border-border bg-secondary/50'>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Тип</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>ID</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Title</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Description</th>
								<th className='text-center p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Noindex</th>
								<th className='text-right p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'></th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((item) => {
								const isOpen = expandedId === item.id
								const edit = editing[item.id] ?? {}
								return (
									<>
										<tr key={item.id} className='border-b border-border hover:bg-secondary/30'>
											<td className='p-3'>
												<Badge variant='secondary' className='text-[10px]'>
													{item.targetType}
												</Badge>
											</td>
											<td className='p-3 font-mono text-xs text-muted-foreground'>
												{item.targetId}
											</td>
											<td className='p-3'>
												<div className={`text-xs ${!item.title ? 'text-destructive' : ''}`}>
													{item.title || '—'}
												</div>
											</td>
											<td className='p-3'>
												<div className={`text-xs ${!item.description ? 'text-destructive' : ''}`}>
													{item.description || '—'}
												</div>
											</td>
											<td className='p-3 text-center'>
												{item.noIndex ? (
													<Badge className='bg-warning/15 text-warning text-[10px]'>No</Badge>
												) : (
													<Badge className='bg-success/15 text-success text-[10px]'>Yes</Badge>
												)}
											</td>
											<td className='p-3 text-right'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => {
														setExpandedId(isOpen ? null : item.id)
														setEditing((prev) => ({
															...prev,
															[item.id]: {
																	title: item.title,
																	description: item.description,
																	keywords: item.keywords,
																	ogTitle: item.ogTitle,
																	ogDescription: item.ogDescription,
																	canonicalUrl: item.canonicalUrl,
																	noIndex: item.noIndex,
															},
														}))
													}}
												>
													{isOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
												</Button>
											</td>
										</tr>
										{isOpen && (
											<tr className='border-b border-border bg-secondary/20'>
												<td colSpan={6} className='p-4 space-y-3'>
													<div className='grid grid-cols-2 gap-3'>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>Meta Title</label>
															<Input
																value={edit.title ?? ''}
																onChange={(e) => handleEdit(item.id, 'title', e.target.value)}
																className='text-xs'
															/>
														</div>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>Keywords</label>
															<Input
																value={edit.keywords ?? ''}
																onChange={(e) => handleEdit(item.id, 'keywords', e.target.value)}
																className='text-xs'
															/>
														</div>
													</div>
													<div className='space-y-2'>
														<label className='text-xs font-medium'>Meta Description</label>
														<textarea
															className='w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-xs min-h-[60px]'
															value={edit.description ?? ''}
																onChange={(e) => handleEdit(item.id, 'description', e.target.value)}
														/>
													</div>
													<div className='grid grid-cols-2 gap-3'>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>OG Title</label>
															<Input
																value={edit.ogTitle ?? ''}
																onChange={(e) => handleEdit(item.id, 'ogTitle', e.target.value)}
																className='text-xs'
															/>
														</div>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>OG Description</label>
															<Input
																value={edit.ogDescription ?? ''}
																onChange={(e) => handleEdit(item.id, 'ogDescription', e.target.value)}
																className='text-xs'
															/>
														</div>
													</div>
													<div className='space-y-2'>
														<label className='text-xs font-medium'>Canonical URL</label>
														<Input
															value={edit.canonicalUrl ?? ''}
																onChange={(e) => handleEdit(item.id, 'canonicalUrl', e.target.value)}
																className='text-xs'
															/>
													</div>
													<div className='flex items-center justify-between py-1'>
														<span className='text-xs font-medium'>Noindex</span>
														<Switch
															checked={!!edit.noIndex}
															onCheckedChange={(v) => handleEdit(item.id, 'noIndex', v)}
														/>
													</div>
													<Button size='sm' onClick={() => handleSave(item)}>
														<Save className='h-3 w-3 mr-1' />
														Сохранить
													</Button>
													{/* Google Preview */}
													<div className='rounded-lg border border-border bg-card p-4 space-y-1 mt-2'>
														<div className='text-xs text-muted-foreground mb-2 font-medium'>Google Preview</div>
														<div className='text-blue-600 text-sm font-medium truncate'>
															{edit.title || item.title || 'Заголовок страницы'}
														</div>
														<div className='text-green-700 text-xs truncate'>
															https://ваш-сайт.ru/{item.targetType?.toLowerCase()}/{item.targetId?.slice(0, 12)}
														</div>
														<div className='text-xs text-muted-foreground line-clamp-2'>
															{edit.description || item.description || 'Описание страницы будет отображено в результатах поиска Google.'}
														</div>
													</div>
												</td>
											</tr>
										)}
									</>
								)
							})}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={6} className='text-center py-12 text-muted-foreground text-sm'>
										Нет записей
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	)
}
