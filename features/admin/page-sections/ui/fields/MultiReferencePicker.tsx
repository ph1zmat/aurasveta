'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormFieldShell } from '@aurasveta/shared-admin'
import { Button } from '@/shared/ui/Button'
import type { SectionEditorOption } from '../../model/sectionEditorTypes'

interface MultiReferencePickerProps {
	label: string
	selectedIds: string[]
	onChange: (value: string[]) => void
	options: SectionEditorOption[]
	placeholder: string
}

export default function MultiReferencePicker({
	label,
	selectedIds,
	onChange,
	options,
	placeholder,
}: MultiReferencePickerProps) {
	const [draftId, setDraftId] = useState('')
	const selected = options.filter(option => selectedIds.includes(option.id))

	return (
		<FormFieldShell label={label} hint={placeholder}>
			<div className='space-y-3'>
				<div className='flex gap-2'>
					<select
						value={draftId}
						onChange={event => setDraftId(event.target.value)}
						className='flex h-10 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
					>
						<option value=''>Выберите элемент…</option>
						{options
							.filter(option => !selectedIds.includes(option.id))
							.map(option => (
								<option key={option.id} value={option.id}>
									{option.description ? `${option.label} — ${option.description}` : option.label}
								</option>
							))}
					</select>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={() => {
							if (!draftId) return
							onChange([...selectedIds, draftId])
							setDraftId('')
						}}
					>
						<Plus className='mr-1 h-4 w-4' /> Добавить
					</Button>
				</div>
				{selected.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{selected.map(item => (
							<span
								key={item.id}
								className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground'
							>
								<span>{item.label}</span>
								<button
									type='button'
									onClick={() => onChange(selectedIds.filter(id => id !== item.id))}
									className='text-muted-foreground hover:text-destructive'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</span>
						))}
					</div>
				) : (
					<div className='rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground'>
						Пока ничего не выбрано.
					</div>
				)}
			</div>
		</FormFieldShell>
	)
}
