'use client'

import { Button } from '@/shared/ui/Button'
import { EntityReferencePicker } from '@/shared/ui'
import { FormInput, FormSelect } from '@aurasveta/shared-admin'
import type { LinkTarget } from '@/shared/types/sections'
import type { SectionEditorOptions } from '../../model/sectionEditorTypes'

interface SectionLinkEditorProps {
	label: string
	value?: LinkTarget
	onChange: (value: LinkTarget | undefined) => void
	options: SectionEditorOptions
	required?: boolean
}

export default function SectionLinkEditor({
	label,
	value,
	onChange,
	options,
	required,
}: SectionLinkEditorProps) {
	const kind = value?.kind ?? 'external'

	return (
		<div className='rounded-2xl border border-border/70 bg-muted/10 p-4'>
			<div className='mb-3 flex items-center justify-between gap-3'>
				<div className='text-sm font-medium text-foreground'>
					{label}
					{required ? <span className='text-destructive'> *</span> : null}
				</div>
				{!required ? (
					<Button type='button' variant='ghost' size='sm' onClick={() => onChange(undefined)}>
						Очистить
					</Button>
				) : null}
			</div>
			<div className='space-y-3'>
				<FormSelect
					label='Тип ссылки'
					value={kind}
					onChange={event => {
						const nextKind = event.target.value as LinkTarget['kind']
						switch (nextKind) {
							case 'page':
								onChange(
									options.pages[0]
										? { kind: 'page', pageId: options.pages[0].id }
										: undefined,
								)
								break
							case 'category':
								onChange(
									options.categories[0]
										? { kind: 'category', categoryId: options.categories[0].id }
										: undefined,
								)
								break
							case 'product':
								onChange(
									options.products[0]
										? { kind: 'product', productId: options.products[0].id }
										: undefined,
								)
								break
							default:
								onChange({ kind: 'external', url: 'https://example.com' })
						}
					}}
				>
					<option value='external'>Внешняя ссылка</option>
					<option value='page'>Страница</option>
					<option value='category'>Категория</option>
					<option value='product'>Товар</option>
				</FormSelect>

				{kind === 'page' ? (
					<EntityReferencePicker
						label='Страница'
						value={value?.kind === 'page' ? value.pageId : undefined}
						onChange={next => onChange(next ? { kind: 'page', pageId: next } : undefined)}
						options={options.pages.map(item => ({ value: item.id, label: item.label, description: item.description }))}
						placeholder='Выберите страницу'
					/>
				) : null}

				{kind === 'category' ? (
					<EntityReferencePicker
						label='Категория'
						value={value?.kind === 'category' ? value.categoryId : undefined}
						onChange={next => onChange(next ? { kind: 'category', categoryId: next } : undefined)}
						options={options.categories.map(item => ({ value: item.id, label: item.label, description: item.description }))}
						placeholder='Выберите категорию'
					/>
				) : null}

				{kind === 'product' ? (
					<EntityReferencePicker
						label='Товар'
						value={value?.kind === 'product' ? value.productId : undefined}
						onChange={next => onChange(next ? { kind: 'product', productId: next } : undefined)}
						options={options.products.map(item => ({ value: item.id, label: item.label, description: item.description }))}
						placeholder='Выберите товар'
					/>
				) : null}

				{kind === 'external' ? (
					<FormInput
						label='URL'
						value={value?.kind === 'external' ? value.url : ''}
						onChange={event => onChange({ kind: 'external', url: event.target.value })}
						placeholder='https://example.com'
					/>
				) : null}
			</div>
		</div>
	)
}
