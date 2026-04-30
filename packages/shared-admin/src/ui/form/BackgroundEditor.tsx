'use client'

import { FormInput } from './FormInput'
import { FormSelect } from './FormSelect'

export type BackgroundEditorValue =
	| { type: 'none' }
	| { type: 'color'; value: string }
	| { type: 'gradient'; value: string }

interface BackgroundEditorProps {
	value: BackgroundEditorValue
	onChange: (value: BackgroundEditorValue) => void
	label?: string
	description?: string
}

export function BackgroundEditor({
	value,
	onChange,
	label = 'Тип фона',
	description,
}: BackgroundEditorProps) {
	return (
		<div className='grid gap-4 md:grid-cols-3'>
			<FormSelect
				label={label}
				hint={description}
				value={value.type}
				onChange={event => {
					const nextType = event.target.value as BackgroundEditorValue['type']
					onChange(
						nextType === 'color'
							? { type: 'color', value: '#ffffff' }
							: nextType === 'gradient'
								? {
									type: 'gradient',
									value:
										'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
								}
								: { type: 'none' },
					)
				}}
			>
				<option value='none'>Без фона</option>
				<option value='color'>Цвет</option>
				<option value='gradient'>Градиент</option>
			</FormSelect>
			{value.type === 'color' ? (
				<FormInput
					label='Цвет'
					value={value.value}
					onChange={event =>
						onChange({ type: 'color', value: event.target.value })
					}
					placeholder='#ffffff'
				/>
			) : null}
			{value.type === 'gradient' ? (
				<div className='md:col-span-2'>
					<FormInput
						label='CSS gradient'
						value={value.value}
						onChange={event =>
							onChange({ type: 'gradient', value: event.target.value })
						}
						placeholder='linear-gradient(135deg, #fff 0%, #f3f4f6 100%)'
					/>
				</div>
			) : null}
		</div>
	)
}
