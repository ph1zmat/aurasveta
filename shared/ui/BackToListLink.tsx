'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackToListLink({
	fallbackHref = '/catalog',
	label = 'Назад',
}: {
	fallbackHref?: string
	label?: string
}) {
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const href = returnTo && returnTo.startsWith('/') ? returnTo : fallbackHref

	return (
		<Link
			href={href}
			className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
		>
			<ChevronLeft className='h-4 w-4' strokeWidth={1.5} />
			{label}
		</Link>
	)
}

