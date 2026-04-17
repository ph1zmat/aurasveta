'use client'

import { cn } from '@/shared/lib/utils'

export default function Skeleton({
	className,
}: {
	className?: string
}) {
	return (
		<div
			aria-hidden='true'
			className={cn(
				'animate-pulse rounded-md bg-muted/60',
				className,
			)}
		/>
	)
}

