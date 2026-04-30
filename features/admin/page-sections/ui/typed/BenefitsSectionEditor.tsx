'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormInput, FormTextarea } from '@aurasveta/shared-admin'
import { Button } from '@/shared/ui/Button'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'
import SectionLinkEditor from '../fields/SectionLinkEditor'

export default function BenefitsSectionEditor({
	value,
	onChange,
	options,
}: PageSectionConfigEditorProps<'benefits'>) {
	return (
		<div className='space-y-3'>
			{value.items.map((item, index) => (
				<div key={`${item.title}:${index}`} className='space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4'>
					<div className='grid gap-4 md:grid-cols-2'>
						<FormInput label='Заголовок' value={item.title} onChange={event => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: event.target.value } : entry) })} />
						<FormInput label='Icon URL / token' value={item.icon ?? ''} onChange={event => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, icon: event.target.value } : entry) })} />
					</div>
					<FormTextarea label='Описание' value={item.description ?? ''} onChange={event => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry) })} rows={3} />
					<SectionLinkEditor label='Ссылка карточки' value={item.link} onChange={next => onChange({ ...value, items: value.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, link: next } : entry) })} options={options} />
					<Button type='button' variant='ghost' size='sm' onClick={() => onChange({ ...value, items: value.items.filter((_, entryIndex) => entryIndex !== index) })}>
						<Trash2 className='mr-1 h-4 w-4' /> Удалить карточку
					</Button>
				</div>
			))}
			<Button type='button' variant='ghost' size='sm' onClick={() => onChange({ ...value, items: [...value.items, { title: 'Новое преимущество', description: '', icon: '' }] })}>
				<Plus className='mr-1 h-4 w-4' /> Добавить карточку
			</Button>
		</div>
	)
}
