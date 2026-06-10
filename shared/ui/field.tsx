import { cn } from '@/shared/lib/utils'

interface FieldProps {
	label: string
	htmlFor?: string
	hint?: string
	error?: string
	className?: string
	children: React.ReactNode
}

export default function Field({
	label,
	htmlFor,
	hint,
	error,
	className,
	children,
}: FieldProps) {
	return (
		<div className={cn('space-y-2', className)}>
			<label htmlFor={htmlFor} className='text-sm font-medium text-foreground'>
				{label}
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
