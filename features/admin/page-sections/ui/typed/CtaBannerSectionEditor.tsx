'use client'

import { FormSelect, FormTextarea } from '@aurasveta/shared-admin'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'
import SectionLinkEditor from '../fields/SectionLinkEditor'

export default function CtaBannerSectionEditor({
	value,
	onChange,
	options,
}: PageSectionConfigEditorProps<'cta-banner'>) {
	return (
		<div className='space-y-4'>
			<FormTextarea
				label='Описание'
				value={value.description ?? ''}
				onChange={event => onChange({ ...value, description: event.target.value })}
				rows={3}
			/>
			<FormSelect
				label='Выравнивание'
				value={value.align}
				onChange={event => onChange({ ...value, align: event.target.value as typeof value.align })}
			>
				<option value='left'>Left</option>
				<option value='center'>Center</option>
			</FormSelect>
			<div className='grid gap-4 lg:grid-cols-2'>
				<SectionLinkEditor
					label='Основная ссылка'
					value={value.primaryCta}
					onChange={next => onChange({ ...value, primaryCta: next ?? { kind: 'external', url: 'https://example.com' } })}
					options={options}
					required
				/>
				<SectionLinkEditor
					label='Дополнительная ссылка'
					value={value.secondaryCta}
					onChange={next => onChange({ ...value, secondaryCta: next })}
					options={options}
				/>
			</div>
		</div>
	)
}
