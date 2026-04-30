'use client'

import { FormFieldShell } from '../form'

export interface EntityReferenceOption {
	value: string
	label: string
	description?: string
}

export interface EntityReferencePickerProps {
	label: string
	value?: string
	onChange: (value: string | undefined) => void
	options: EntityReferenceOption[]
	placeholder?: string
	disabled?: boolean
	required?: boolean
	error?: string | null
	hint?: string
}

export function EntityReferencePicker({
	label,
	value,
	onChange,
	options,
	placeholder = 'Выберите…',
	disabled,
	required,
	error,
	hint,
}: EntityReferencePickerProps) {
	return (
		<FormFieldShell label={label} required={required} error={error} hint={hint}>
			<select
				value={value ?? ''}
				onChange={e => onChange(e.target.value || undefined)}
				disabled={disabled}
				className='flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50'
			>
				<option value=''>{placeholder}</option>
				{options.map(opt => (
					<option key={opt.value} value={opt.value}>
						{opt.description ? `${opt.label} — ${opt.description}` : opt.label}
					</option>
				))}
			</select>
		</FormFieldShell>
	)
}
