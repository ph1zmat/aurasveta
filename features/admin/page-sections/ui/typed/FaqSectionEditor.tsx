'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormInput, FormTextarea } from '@aurasveta/shared-admin'
import { Button } from '@/shared/ui/Button'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'

export default function FaqSectionEditor({
	value,
	onChange,
}: PageSectionConfigEditorProps<'faq'>) {
	return (
		<div className='space-y-3'>
			{value.items.map((item, index) => (
				<div key={`${item.question}:${index}`} className='space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4'>
					<FormInput label='Вопрос' value={item.question} onChange={event => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, question: event.target.value } : entry) })} />
					<FormTextarea label='Ответ' value={item.answer} onChange={event => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, answer: event.target.value } : entry) })} rows={4} />
					<Button type='button' variant='ghost' size='sm' onClick={() => onChange({ ...value, items: value.items.filter((_, entryIndex) => entryIndex !== index) })}>
						<Trash2 className='mr-1 h-4 w-4' /> Удалить пару
					</Button>
				</div>
			))}
			<Button type='button' variant='ghost' size='sm' onClick={() => onChange({ ...value, items: [...value.items, { question: 'Новый вопрос', answer: 'Новый ответ' }] })}>
				<Plus className='mr-1 h-4 w-4' /> Добавить FAQ
			</Button>
		</div>
	)
}
