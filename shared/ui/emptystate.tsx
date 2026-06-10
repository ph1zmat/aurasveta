'use client'

import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

export default function EmptyState({
	title,
	description,
	primaryAction,
	secondaryAction,
	className,
}: {
	title: string
	description?: string
	primaryAction?: { label: string; href: string }
	secondaryAction?: { label: string; href: string }
	className?: string
}) {
	return (
		<div className={cn('py-12', className)}>
			<div className='mx-auto max-w-2xl rounded-3xl border border-border bg-card/40 px-6 py-10 text-center shadow-sm sm:px-8'>
				<div className='mx-auto mb-4 inline-flex rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					Навигация по каталогу
				</div>
				<h2 className='text-xl font-semibold tracking-[0.02em] text-foreground sm:text-2xl'>
					{title}
				</h2>
				{description && (
					<p className='mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground'>
						{description}
					</p>
				)}

				{(primaryAction || secondaryAction) && (
					<div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
						{primaryAction && (
							<Button asChild variant='primary'>
								<Link href={primaryAction.href}>{primaryAction.label}</Link>
							</Button>
						)}
						{secondaryAction && (
							<Button asChild variant='outline'>
								<Link href={secondaryAction.href}>{secondaryAction.label}</Link>
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
