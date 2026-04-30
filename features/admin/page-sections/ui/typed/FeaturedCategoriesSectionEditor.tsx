'use client'

import { FormInput, FormSelect } from '@aurasveta/shared-admin'
import { EntityReferencePicker } from '@/shared/ui'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'
import MultiReferencePicker from '../fields/MultiReferencePicker'

export default function FeaturedCategoriesSectionEditor({
	value,
	onChange,
	onSectionChange,
	options,
	section,
}: PageSectionConfigEditorProps<'featured-categories'>) {
	return (
		<div className='space-y-4'>
			<div className='grid gap-4 md:grid-cols-3'>
				<FormSelect
					label='Источник'
					value={value.source.mode}
					onChange={event => {
						const mode = event.target.value as typeof value.source.mode
						onChange({
							...value,
							source:
								mode === 'children-of-category'
									? { mode: 'children-of-category', parentCategoryId: options.categories[0]?.id ?? '' }
									: mode === 'header-root'
										? { mode: 'header-root' }
										: { mode: 'manual' },
						})
					}}
				>
					<option value='manual'>Ручной список</option>
					<option value='children-of-category'>Дети категории</option>
					<option value='header-root'>Header root</option>
				</FormSelect>
				<FormSelect
					label='Layout'
					value={value.layout}
					onChange={event => onChange({ ...value, layout: event.target.value as typeof value.layout })}
				>
					<option value='grid'>Grid</option>
					<option value='carousel'>Carousel</option>
				</FormSelect>
				<FormInput
					label='Лимит'
					type='number'
					value={String(value.limit)}
					onChange={event => onChange({ ...value, limit: Number(event.target.value) || 1 })}
				/>
			</div>

			{value.source.mode === 'manual' ? (
				<MultiReferencePicker
					label='Категории'
					selectedIds={section.manualCategoryIds}
					onChange={next => onSectionChange({ manualCategoryIds: next })}
					options={options.categories}
					placeholder='Добавьте категории, которые должны попасть в подборку.'
				/>
			) : null}

			{value.source.mode === 'children-of-category' ? (
				<EntityReferencePicker
					label='Родительская категория'
					value={value.source.parentCategoryId}
					onChange={next => onChange({ ...value, source: { mode: 'children-of-category', parentCategoryId: next ?? '' } })}
					options={options.categories.map(option => ({ value: option.id, label: option.label, description: option.description }))}
					placeholder='Выберите категорию'
				/>
			) : null}
		</div>
	)
}
