'use client'

import { FormCheckbox, FormInput, FormSection, FormTextarea } from '../form'
import type { SeoFormValues } from '@/shared/types/seo'

export interface SeoInlineEditorProps {
	value: SeoFormValues
	onChange: (value: SeoFormValues) => void
	disabled?: boolean
	title?: string
	description?: string
}

export function SeoInlineEditor({
	value,
	onChange,
	disabled,
	title,
	description,
}: SeoInlineEditorProps) {
	function update(patch: Partial<SeoFormValues>) {
		onChange({ ...value, ...patch })
	}

	return (
		<FormSection title={title ?? 'SEO'} description={description}>
			<div className='space-y-3'>
				<FormInput
					label='Meta title'
					value={value.title}
					onChange={e => update({ title: e.target.value })}
					disabled={disabled}
					placeholder='Заголовок страницы для поисковых систем'
				/>
				<FormTextarea
					label='Meta description'
					value={value.description}
					onChange={e => update({ description: e.target.value })}
					disabled={disabled}
					placeholder='Краткое описание страницы'
					rows={2}
				/>
				<FormInput
					label='Keywords'
					value={value.keywords}
					onChange={e => update({ keywords: e.target.value })}
					disabled={disabled}
					placeholder='Через запятую'
				/>
				<FormInput
					label='OG title'
					value={value.ogTitle}
					onChange={e => update({ ogTitle: e.target.value })}
					disabled={disabled}
					placeholder='Заголовок для соцсетей'
				/>
				<FormTextarea
					label='OG description'
					value={value.ogDescription}
					onChange={e => update({ ogDescription: e.target.value })}
					disabled={disabled}
					rows={2}
				/>
				<FormInput
					label='OG image URL'
					value={value.ogImage}
					onChange={e => update({ ogImage: e.target.value })}
					disabled={disabled}
					placeholder='https://...'
				/>
				<FormInput
					label='Canonical URL'
					value={value.canonicalUrl}
					onChange={e => update({ canonicalUrl: e.target.value })}
					disabled={disabled}
					placeholder='https://...'
				/>
				<FormCheckbox
					label='noIndex'
					description='Запретить индексацию этой страницы'
					checked={value.noIndex}
					onChange={checked => update({ noIndex: checked })}
					disabled={disabled}
				/>
			</div>
		</FormSection>
	)
}
