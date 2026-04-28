import * as React from 'react'
import { FormFieldShell } from './FormFieldShell'
import {
	FORM_INPUT_BASE_CLS,
	FORM_INPUT_ERROR_CLS,
	FORM_INPUT_SM_CLS,
} from './formStyles'

export interface FormSelectProps extends Omit<
	React.SelectHTMLAttributes<HTMLSelectElement>,
	'size'
> {
	label: string
	error?: string | null
	hint?: string
	containerClassName?: string
	selectClassName?: string
	size?: 'sm' | 'md'
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
	function FormSelect(
		{
			label,
			error,
			hint,
			containerClassName,
			selectClassName,
			size = 'md',
			required,
			id,
			children,
			...props
		},
		ref,
	) {
		const className = [
			size === 'sm' ? FORM_INPUT_SM_CLS : FORM_INPUT_BASE_CLS,
			error ? FORM_INPUT_ERROR_CLS : '',
			selectClassName,
		]
			.filter(Boolean)
			.join(' ')

		return (
			<FormFieldShell
				label={label}
				htmlFor={id}
				required={required}
				error={error}
				hint={hint}
				className={containerClassName}
			>
				<select
					ref={ref}
					id={id}
					required={required}
					aria-invalid={Boolean(error)}
					className={className}
					{...props}
				>
					{children}
				</select>
			</FormFieldShell>
		)
	},
)
