'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { SortableList } from '@aurasveta/shared-admin'
import { Button } from '@/shared/ui/Button'
import { getAllSectionDefinitions } from '@/entities/section'
import type { SectionType } from '@/shared/types/sections'
import {
	createNewSectionDraft,
	changePageSectionDraftType,
	type PageSectionDraft,
} from '../model/pageSectionDraft'
import PageSectionEditorModal from './PageSectionEditorModal'

interface PageSectionsEditorProps {
	value: PageSectionDraft[]
	onChange: (next: PageSectionDraft[]) => void
}

export default function PageSectionsEditor({ value, onChange }: PageSectionsEditorProps) {
	const [editingSection, setEditingSection] = useState<PageSectionDraft | null>(null)
	const definitions = getAllSectionDefinitions()
	const defaultType = definitions[0]?.type ?? 'hero'

	function addSection() {
		const draft = createNewSectionDraft(defaultType as SectionType)
		onChange([...value, draft])
		setEditingSection(draft)
	}

	function removeSection(id: string) {
		onChange(value.filter(s => s.id !== id))
	}

	function handleReorder(next: PageSectionDraft[]) {
		onChange(next)
	}

	function handleEdit(section: PageSectionDraft) {
		setEditingSection(section)
	}

	function handleEditorSubmit(updated: PageSectionDraft) {
		onChange(value.map(s => s.id === updated.id ? updated : s))
		setEditingSection(null)
	}

	function handleEditorClose() {
		// Remove the section if it was just added and not yet committed
		setEditingSection(null)
	}

	function handleChangeType(type: SectionType, section: PageSectionDraft): PageSectionDraft {
		return changePageSectionDraftType(section, type)
	}

	return (
		<div className='space-y-3'>
			{value.length > 0 ? (
				<SortableList
					items={value}
					getId={s => s.id}
					onReorder={handleReorder}
					renderItem={section => {
						const definition = definitions.find(d => d.type === section.type)
						const Icon = definition?.icon
						return (
							<div className='flex min-w-0 flex-1 items-center gap-3'>
								<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
									<div className='flex items-center gap-2'>
										{Icon ? <Icon className='h-4 w-4 shrink-0 text-muted-foreground' /> : null}
										<span className='truncate text-sm font-medium text-foreground'>
											{definition?.label ?? section.type}
										</span>
										{!section.isActive ? (
											<span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
												Скрыта
											</span>
										) : null}
									</div>
									{section.title ? (
										<span className='truncate pl-6 text-xs text-muted-foreground'>
											{section.title}
										</span>
									) : null}
								</div>
								<div className='flex shrink-0 items-center gap-1'>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => handleEdit(section)}
										aria-label='Редактировать секцию'
									>
										<Pencil className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => removeSection(section.id)}
										aria-label='Удалить секцию'
									>
										<Trash2 className='h-4 w-4 text-destructive' />
									</Button>
								</div>
							</div>
						)
					}}
				/>
			) : (
				<div className='rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground'>
					Нет секций. Добавьте первую секцию, чтобы начать.
				</div>
			)}

			<Button
				type='button'
				variant='ghost'
				size='sm'
				onClick={addSection}
			>
				<Plus className='mr-1 h-4 w-4' />
				Добавить секцию
			</Button>

			{editingSection ? (
				<PageSectionEditorModal
					isOpen
					value={editingSection}
					onClose={handleEditorClose}
					onSubmit={handleEditorSubmit}
					onChangeType={handleChangeType}
				/>
			) : null}
		</div>
	)
}
