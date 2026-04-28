import * as React from 'react'

interface FormFieldShellProps {
	label: string
	htmlFor?: string
	required?: boolean
	error?: string | null
	hint?: string
	children: React.ReactNode
	className?: string
}

export function FormFieldShell({
	label,
	htmlFor,
	required,
	error,
	hint,
	children,
	className,
}: FormFieldShellProps) {
	return (
		<div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
			<label htmlFor={htmlFor} className='text-sm font-medium text-foreground'>
				{label}
				{required ? <span className='text-destructive'> *</span> : null}
			</label>
			{children}
			{error ? (
				<p className='text-xs text-destructive'>{error}</p>
			) : hint ? (
				<p className='text-xs text-muted-foreground'>{hint}</p>
			) : null}
		</div>
	)
}
