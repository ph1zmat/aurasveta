import * as React from 'react'
import { FormFieldShell } from './FormFieldShell'
import { FORM_INPUT_ERROR_CLS, FORM_TEXTAREA_BASE_CLS } from './formStyles'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string
	error?: string | null
	hint?: string
	containerClassName?: string
	textareaClassName?: string
}

export const FormTextarea = React.forwardRef<
	HTMLTextAreaElement,
	FormTextareaProps
>(function FormTextarea(
	{
		label,
		error,
		hint,
		containerClassName,
		textareaClassName,
		required,
		id,
		...props
	},
	ref,
) {
	const className = [
		FORM_TEXTAREA_BASE_CLS,
		error ? FORM_INPUT_ERROR_CLS : '',
		textareaClassName,
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
			<textarea
				ref={ref}
				id={id}
				required={required}
				aria-invalid={Boolean(error)}
				className={className}
				{...props}
			/>
		</FormFieldShell>
	)
})
