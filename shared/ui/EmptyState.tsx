'use client'

import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

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
		<div className={cn('py-12 text-center', className)}>
			<p className='text-lg text-foreground'>{title}</p>
			{description && (
				<p className='mx-auto mt-2 max-w-md text-sm text-muted-foreground'>
					{description}
				</p>
			)}

			{(primaryAction || secondaryAction) && (
				<div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
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
	)
}

