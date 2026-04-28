import * as React from 'react'
import { FormFieldShell } from './FormFieldShell'
import {
	FORM_INPUT_BASE_CLS,
	FORM_INPUT_ERROR_CLS,
	FORM_INPUT_SM_CLS,
} from './formStyles'

export interface FormInputProps extends Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	'size'
> {
	label: string
	error?: string | null
	hint?: string
	containerClassName?: string
	inputClassName?: string
	size?: 'sm' | 'md'
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
	function FormInput(
		{
			label,
			error,
			hint,
			containerClassName,
			inputClassName,
			size = 'md',
			required,
			id,
			...props
		},
		ref,
	) {
		const className = [
			size === 'sm' ? FORM_INPUT_SM_CLS : FORM_INPUT_BASE_CLS,
			error ? FORM_INPUT_ERROR_CLS : '',
			inputClassName,
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
				<input
					ref={ref}
					id={id}
					required={required}
					aria-invalid={Boolean(error)}
					className={className}
					{...props}
				/>
			</FormFieldShell>
		)
	},
)
