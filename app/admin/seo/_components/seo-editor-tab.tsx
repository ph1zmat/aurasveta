'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Download, Pencil } from 'lucide-react'
import { SeoEditForm } from './seo-edit-form'
import { ScoreBadge, computeScore } from './seo-score-badge'
import { useSeoList } from '../_hooks/use-seo-list'
import { useSeoExport } from '../_hooks/use-seo-export'
import type { SeoFilter, SeoTargetType } from '../_lib/constants'
import { SEO_FILTERS, TARGET_TYPE_OPTIONS } from '../_lib/constants'

export function SeoEditorTab() {
	const [filter, setFilter] = useState<SeoFilter>('all')
	const [typeFilter, setTypeFilter] = useState<SeoTargetType | 'all'>('all')
	const [searchQuery, setSearchQuery] = useState('')

	const { items, isLoading, expandedId, editing, handleEdit, handleExpand, handleSave } = useSeoList(typeFilter, filter, searchQuery)
	const { handleExportCsv, isExporting } = useSeoExport(typeFilter, filter)

	return (
		<div className='space-y-4'>
			{/* Filters */}
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex gap-1 bg-muted rounded-md p-0.5'>
					<Button
						size='sm'
						variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
						onClick={() => setTypeFilter('all')}
						className='text-xs h-7'
					>
						Все
					</Button>
					{TARGET_TYPE_OPTIONS.map((t) => (
						<Button
							key={t}
							size='sm'
							variant={typeFilter === t ? 'secondary' : 'ghost'}
							onClick={() => setTypeFilter(t)}
							className='text-xs h-7'
						>
							{t}
						</Button>
					))}
				</div>
				<div className='flex gap-1'>
					{SEO_FILTERS.slice(1).map((f) => (
						<Button
							key={f}
							size='sm'
							variant={filter === f ? 'secondary' : 'ghost'}
							onClick={() => setFilter(filter === f ? 'all' : f)}
							className='text-xs h-7'
						>
							{f === 'missing-title' && 'Без title'}
							{f === 'missing-desc' && 'Без description'}
							{f === 'noindex' && 'noindex'}
						</Button>
					))}
				</div>
				<Input
					placeholder='Поиск...'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className='h-7 text-xs w-48 ml-auto'
				/>
			</div>

			{/* Export button */}
			<div className='flex justify-end'>
				<Button variant='outline' size='sm' onClick={handleExportCsv} disabled={isExporting} className='gap-2'>
					<Download className='h-4 w-4' />
					{isExporting ? 'Экспорт…' : 'Экспорт CSV'}
				</Button>
			</div>

			{/* Card list */}
			<div className='space-y-2'>
				{isLoading ? (
					<div className='text-center py-12 text-muted-foreground text-sm'>Загрузка...</div>
				) : items.length === 0 ? (
					<div className='text-center py-12 text-muted-foreground text-sm'>Нет записей</div>
				) : (
					items.map((item) => {
						const isOpen = expandedId === item.id
						const edit = editing[item.id] ?? {}
						const score = computeScore({
							title: edit.title !== undefined ? edit.title : item.title,
							description: edit.description !== undefined ? edit.description : item.description,
							ogImage: edit.ogImage !== undefined ? edit.ogImage : item.ogImage,
						})
						const titleText = item.title || '(без title)'
						const url = `/${item.targetType}/${item.targetId}`
						return (
							<div key={item.id} className='border rounded-lg overflow-hidden bg-card'>
								<div
									className='flex items-center gap-3 p-3 hover:bg-secondary/30 cursor-pointer'
									onClick={() => handleExpand(item)}
								>
									<ScoreBadge score={score} />
									<div className='flex-1 min-w-0'>
										<div className={`text-sm font-medium truncate ${!item.title ? 'text-muted-foreground' : ''}`}>
											{titleText}
										</div>
										<div className='text-xs text-muted-foreground truncate'>{url}</div>
									</div>
									<Badge variant='secondary' className='text-[10px] shrink-0'>
										{item.targetType}
									</Badge>
									<div className='flex items-center gap-1 shrink-0'>
										<Button
											variant='ghost'
											size='sm'
											className='h-7 w-7 p-0'
											onClick={(e) => {
												e.stopPropagation()
												handleExpand(item)
											}}
										>
											<Pencil className='h-3.5 w-3.5 text-muted-foreground' />
										</Button>
										<Button
											variant='ghost'
											size='sm'
											className='h-7 w-7 p-0'
										>
											{isOpen ? <ChevronUp className='h-4 w-4 text-muted-foreground' /> : <ChevronDown className='h-4 w-4 text-muted-foreground' />}
										</Button>
									</div>
								</div>
								{isOpen && (
									<div className='border-t p-4 bg-secondary/20'>
										<SeoEditForm item={item} edit={edit} handleEdit={handleEdit} handleSave={handleSave} />
									</div>
								)}
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
