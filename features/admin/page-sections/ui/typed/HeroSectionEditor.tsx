'use client'

import { FormInput, FormTextarea } from '@aurasveta/shared-admin'
import { MediaPicker } from '@/shared/ui'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'
import SectionLinkEditor from '../fields/SectionLinkEditor'

export default function HeroSectionEditor({
	value,
	onChange,
	onSectionChange,
	options,
	section,
}: PageSectionConfigEditorProps<'hero'>) {
	return (
		<div className='space-y-4'>
			<FormTextarea
				label='Описание'
				value={value.description ?? ''}
				onChange={event => onChange({ ...value, description: event.target.value })}
				rows={4}
			/>
			<FormInput
				label='Бейджи через запятую'
				value={value.badges.join(', ')}
				onChange={event =>
					onChange({
						...value,
						badges: event.target.value
							.split(',')
							.map(item => item.trim())
							.filter(Boolean),
					})
				}
			/>
			<div className='grid gap-4 lg:grid-cols-2'>
				<SectionLinkEditor
					label='Primary CTA'
					value={value.primaryCta}
					onChange={next => onChange({ ...value, primaryCta: next })}
					options={options}
				/>
				<SectionLinkEditor
					label='Secondary CTA'
					value={value.secondaryCta}
					onChange={next => onChange({ ...value, secondaryCta: next })}
					options={options}
				/>
			</div>
			<MediaPicker
				label='Главное изображение hero'
				value={section.mediaItems[0]?.storageKey ?? null}
				onChange={(storageKey, originalName) =>
					onSectionChange({
						mediaItems: storageKey
							? [
								{
									storageKey,
									originalName: originalName ?? null,
											alt: null,
									role: 'hero-media',
								},
							]
							: [],
					})
				}
			/>
		</div>
	)
}
