'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { SortableList } from '@aurasveta/shared-admin'
import { Button } from '@/shared/ui/Button'
import {
	PAGE_BLOCK_META,
	PAGE_BLOCK_TYPES,
	type PageBlockType,
	type PageBlockDraft,
} from '@/shared/types/page-builder'
import PageBlockEditorModal from './PageBlockEditorModal'

interface PageBlocksEditorProps {
	value: PageBlockDraft[]
	onChange: (next: PageBlockDraft[]) => void
}

function createDraft(type: PageBlockType): PageBlockDraft {
	const meta = PAGE_BLOCK_META[type]
	return {
		draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		type,
		isActive: true,
		config: meta.defaultConfig(),
	}
}

function getBlockSummary(draft: PageBlockDraft): string {
	const cfg = draft.config
	switch (draft.type) {
		case 'heading':
			return typeof cfg.text === 'string' && cfg.text ? cfg.text : '—'
		case 'paragraph': {
			const text = typeof cfg.text === 'string' ? cfg.text : ''
			return text.length > 60 ? text.slice(0, 60) + '…' : text || '—'
		}
		case 'table':
			return typeof cfg.caption === 'string' && cfg.caption
				? cfg.caption
				: Array.isArray(cfg.columns)
					? `${(cfg.columns as unknown[]).length} кол. / ${Array.isArray(cfg.rows) ? (cfg.rows as unknown[]).length : 0} стр.`
					: '—'
		case 'image':
			return typeof cfg.alt === 'string' && cfg.alt ? cfg.alt : typeof cfg.storageKey === 'string' && cfg.storageKey ? 'Изображение' : '—'
		case 'link':
		case 'icon-link':
			return typeof cfg.label === 'string' && cfg.label ? cfg.label : '—'
		default:
			return '—'
	}
}

export default function PageBlocksEditor({ value, onChange }: PageBlocksEditorProps) {
	const [editingDraft, setEditingDraft] = useState<PageBlockDraft | null>(null)
	const [addingType, setAddingType] = useState<PageBlockType | null>(null)

	function addBlock(type: PageBlockType) {
		const draft = createDraft(type)
		setAddingType(null)
		setEditingDraft(draft)
	}

	function handleEditorSubmit(updated: PageBlockDraft) {
		const exists = value.find(b => b.draftId === updated.draftId)
		if (exists) {
			onChange(value.map(b => (b.draftId === updated.draftId ? updated : b)))
		} else {
			onChange([...value, updated])
		}
		setEditingDraft(null)
	}

	function handleEdit(draft: PageBlockDraft) {
		setEditingDraft(draft)
	}

	function handleDelete(draftId: string) {
		onChange(value.filter(b => b.draftId !== draftId))
	}

	function handleDuplicate(draft: PageBlockDraft) {
		const copy: PageBlockDraft = {
			...JSON.parse(JSON.stringify(draft)) as PageBlockDraft,
			draftId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			id: undefined,
		}
		const idx = value.findIndex(b => b.draftId === draft.draftId)
		const next = [...value]
		next.splice(idx + 1, 0, copy)
		onChange(next)
	}

	function handleToggleActive(draft: PageBlockDraft) {
		onChange(value.map(b => b.draftId === draft.draftId ? { ...b, isActive: !b.isActive } : b))
	}

	return (
		<div className='space-y-3'>
			{value.length > 0 ? (
				<SortableList
					items={value}
					getId={b => b.draftId}
					onReorder={onChange}
					renderItem={block => {
						const meta = PAGE_BLOCK_META[block.type]
						const IconComponent = LucideIcons[meta.icon as keyof typeof LucideIcons] as React.ElementType | undefined
						const summary = getBlockSummary(block)

						return (
							<div className='flex min-w-0 flex-1 items-center gap-3'>
								<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
									<div className='flex items-center gap-2'>
										{IconComponent ? (
											<IconComponent className='h-4 w-4 shrink-0 text-muted-foreground' />
										) : null}
										<span className='truncate text-sm font-medium text-foreground'>
											{meta.label}
										</span>
										{!block.isActive ? (
											<span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
												Скрыт
											</span>
										) : null}
									</div>
									{summary !== '—' ? (
										<span className='truncate pl-6 text-xs text-muted-foreground'>
											{summary}
										</span>
									) : null}
								</div>
								<div className='flex shrink-0 items-center gap-1'>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => handleToggleActive(block)}
										aria-label={block.isActive ? 'Скрыть блок' : 'Показать блок'}
									>
										{block.isActive ? (
											<Eye className='h-4 w-4' />
										) : (
											<EyeOff className='h-4 w-4' />
										)}
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => handleDuplicate(block)}
										aria-label='Дублировать блок'
									>
										<Copy className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => handleEdit(block)}
										aria-label='Редактировать блок'
									>
										<Pencil className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className='text-destructive hover:text-destructive'
										onClick={() => handleDelete(block.draftId)}
										aria-label='Удалить блок'
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</div>
						)
					}}
				/>
			) : (
				<div className='rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground'>
					Нет блоков. Добавьте первый блок ниже.
				</div>
			)}

			{/* Кнопки добавления блоков */}
			<div className='space-y-2'>
				{addingType === null ? (
					<Button
						type='button'
						variant='outline'
						size='sm'
						className='w-full'
						onClick={() => setAddingType('heading')}
					>
						<Plus className='mr-1 h-4 w-4' />
						Добавить блок
					</Button>
				) : null}

				{addingType !== null || true ? (
					<div className='flex flex-wrap gap-2'>
						{PAGE_BLOCK_TYPES.map(type => {
							const meta = PAGE_BLOCK_META[type]
							const IconComponent = LucideIcons[meta.icon as keyof typeof LucideIcons] as React.ElementType | undefined
							return (
								<Button
									key={type}
									type='button'
									variant='outline'
									size='sm'
									onClick={() => addBlock(type)}
									className='flex items-center gap-1'
								>
									{IconComponent ? <IconComponent className='h-3.5 w-3.5' /> : null}
									{meta.label}
								</Button>
							)
						})}
					</div>
				) : null}
			</div>

			{editingDraft ? (
				<PageBlockEditorModal
					draft={editingDraft}
					open
					onOpenChange={open => { if (!open) setEditingDraft(null) }}
					onSubmit={handleEditorSubmit}
				/>
			) : null}
		</div>
	)
}
