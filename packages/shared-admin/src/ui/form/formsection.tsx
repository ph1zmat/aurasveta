import * as React from 'react'

interface FormSectionProps {
	title: string
	description?: string
	children: React.ReactNode
	className?: string
}

export function FormSection({
	title,
	description,
	children,
	className,
}: FormSectionProps) {
	return (
		<section
			className={[
				'rounded-2xl border border-border/70 bg-muted/10 p-4 sm:p-5',
				className,
			]
				.filter(Boolean)
				.join(' ')}
		>
			<div className='mb-4 space-y-1'>
				<h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-foreground'>
					{title}
				</h2>
				{description ? (
					<p className='text-sm text-muted-foreground'>{description}</p>
				) : null}
			</div>
			{children}
		</section>
	)
}
