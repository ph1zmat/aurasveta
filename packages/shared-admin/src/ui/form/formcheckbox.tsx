import * as React from 'react'

interface FormCheckboxProps {
	label: React.ReactNode
	description?: React.ReactNode
	checked: boolean
	onChange: (checked: boolean) => void
	onBlur?: () => void
	id?: string
	className?: string
	variant?: 'inline' | 'card'
	disabled?: boolean
}

export function FormCheckbox({
	label,
	description,
	checked,
	onChange,
	onBlur,
	id,
	className,
	variant = 'inline',
	disabled,
}: FormCheckboxProps) {
	const containerClassName =
		variant === 'card'
			? 'flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3'
			: 'flex items-center gap-2 text-sm text-foreground'

	return (
		<label
			className={[containerClassName, className].filter(Boolean).join(' ')}
		>
			<input
				id={id}
				type='checkbox'
				checked={checked}
				onChange={event => onChange(event.target.checked)}
				onBlur={onBlur}
				disabled={disabled}
				className={[
					variant === 'card' ? 'mt-0.5' : '',
					'h-4 w-4 rounded border-border accent-primary',
				].join(' ')}
			/>
			<span className={variant === 'card' ? 'space-y-1' : ''}>
				<span
					className={
						variant === 'card'
							? 'block text-sm font-medium text-foreground'
							: undefined
					}
				>
					{label}
				</span>
				{description ? (
					<span className='block text-xs leading-5 text-muted-foreground'>
						{description}
					</span>
				) : null}
			</span>
		</label>
	)
}
