'use client'

import { FormInput, FormSelect } from '@aurasveta/shared-admin'
import { CharacteristicFilterBuilder, EntityReferencePicker } from '@/shared/ui'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'
import MultiReferencePicker from '../fields/MultiReferencePicker'

export default function ProductGridSectionEditor({
	value,
	onChange,
	onSectionChange,
	options,
	section,
}: PageSectionConfigEditorProps<'product-grid'>) {
	return (
		<div className='space-y-4'>
			<div className='grid gap-4 md:grid-cols-2'>
				<FormSelect
					label='Источник'
					value={value.source.mode}
					onChange={event => {
						const mode = event.target.value as typeof value.source.mode
						onChange({
							...value,
							source:
								mode === 'category'
									? { mode: 'category', categoryId: options.categories[0]?.id ?? '' }
									: mode === 'characteristics'
										? { mode: 'characteristics', filters: [] }
										: mode === 'collection'
											? { mode: 'collection', collection: 'featured' }
											: { mode: 'manual' },
						})
					}}
				>
					<option value='manual'>Ручной список</option>
					<option value='category'>Категория</option>
					<option value='characteristics'>Фильтры характеристик</option>
					<option value='collection'>Коллекция</option>
				</FormSelect>
				<FormSelect
					label='Сортировка'
					value={value.sort}
					onChange={event => onChange({ ...value, sort: event.target.value as typeof value.sort })}
				>
					<option value='manual'>Manual</option>
					<option value='newest'>Newest</option>
					<option value='price-asc'>Цена по возрастанию</option>
					<option value='price-desc'>Цена по убыванию</option>
					<option value='popular'>Популярность</option>
				</FormSelect>
			</div>
			<div className='grid gap-4 md:grid-cols-4'>
				<FormInput label='Лимит' type='number' value={String(value.limit)} onChange={event => onChange({ ...value, limit: Number(event.target.value) || 1 })} />
				<FormInput label='Колонки mobile' type='number' value={String(value.columns.mobile)} onChange={event => onChange({ ...value, columns: { ...value.columns, mobile: Number(event.target.value) || 1 } })} />
				<FormInput label='Колонки tablet' type='number' value={String(value.columns.tablet)} onChange={event => onChange({ ...value, columns: { ...value.columns, tablet: Number(event.target.value) || 2 } })} />
				<FormInput label='Колонки desktop' type='number' value={String(value.columns.desktop)} onChange={event => onChange({ ...value, columns: { ...value.columns, desktop: Number(event.target.value) || 4 } })} />
			</div>

			{value.source.mode === 'manual' ? (
				<MultiReferencePicker
					label='Товары'
					selectedIds={section.manualProductIds}
					onChange={next => onSectionChange({ manualProductIds: next })}
					options={options.products}
					placeholder='Добавьте товары в ручной список.'
				/>
			) : null}

			{value.source.mode === 'category' ? (
				<EntityReferencePicker
					label='Категория-источник'
					value={value.source.categoryId}
					onChange={next => onChange({ ...value, source: { mode: 'category', categoryId: next ?? '' } })}
					options={options.categories.map(option => ({ value: option.id, label: option.label, description: option.description }))}
					placeholder='Выберите категорию'
				/>
			) : null}

			{value.source.mode === 'characteristics' ? (
				<CharacteristicFilterBuilder
					value={value.source.filters.map(item => ({ propertyId: item.propertyId, valueIds: item.valueIds }))}
					onChange={next =>
						onChange({
							...value,
							source: {
								mode: 'characteristics',
								filters: next.map(filter => ({ ...filter, operator: 'in' as const })),
							},
						})
					}
				/>
			) : null}

			{value.source.mode === 'collection' ? (
				<FormSelect
					label='Коллекция'
					value={value.source.collection}
					onChange={event =>
						onChange({
							...value,
							source: {
								mode: 'collection',
								collection: event.target.value as 'featured' | 'new' | 'sale',
							},
						})
					}
				>
					<option value='featured'>Featured</option>
					<option value='new'>New</option>
					<option value='sale'>Sale</option>
				</FormSelect>
			) : null}
		</div>
	)
}
