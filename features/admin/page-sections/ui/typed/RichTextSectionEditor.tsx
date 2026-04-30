'use client'

import { FormSelect, FormTextarea } from '@aurasveta/shared-admin'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'

export default function RichTextSectionEditor({
	value,
	onChange,
}: PageSectionConfigEditorProps<'rich-text'>) {
	return (
		<div className='space-y-4'>
			<FormTextarea
				label='Текст'
				value={value.body}
				onChange={event => onChange({ ...value, body: event.target.value })}
				rows={10}
			/>
			<FormSelect
				label='Max width'
				value={value.maxWidth}
				onChange={event => onChange({ ...value, maxWidth: event.target.value as typeof value.maxWidth })}
			>
				<option value='sm'>SM</option>
				<option value='md'>MD</option>
				<option value='lg'>LG</option>
				<option value='xl'>XL</option>
				<option value='full'>FULL</option>
			</FormSelect>
		</div>
	)
}
