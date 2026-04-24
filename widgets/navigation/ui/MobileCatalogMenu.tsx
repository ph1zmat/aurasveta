'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

const extraLinks = [
	{ name: 'Блог', href: '/blog' },
	{ name: 'О нас', href: '/about' },
]

interface MobileCatalogMenuProps {
	onClose: () => void
}

export default function MobileCatalogMenu({ onClose }: MobileCatalogMenuProps) {
	const { data: dbCategories } = trpc.categories.getNav.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})

	const categories = dbCategories
		? dbCategories.map(c => ({
				name: c.name,
				href: `/catalog/${c.slug}`,
			}))
		: []
	return (
		<div className='fixed inset-x-0 bottom-0 top-[calc(var(--mobile-header-height)+env(safe-area-inset-top))] z-40 overflow-y-auto bg-background pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] md:hidden'>
			<ul className='mobile-edge-padding'>
				{categories.map(cat => (
					<li key={cat.href} className='border-b border-border'>
						<Link
							href={cat.href}
							onClick={onClose}
							className='flex items-center justify-between py-4 text-base font-normal text-foreground transition-colors hover:bg-accent/60 active:bg-accent'
						>
							{cat.name}
							<ChevronRight className='h-5 w-5 text-muted-foreground' strokeWidth={1.5} />
						</Link>
					</li>
				))}
			</ul>

			<div className='mobile-edge-padding pt-4 pb-8'>
				{extraLinks.map(link => (
					<Link
						key={link.href}
						href={link.href}
						onClick={onClose}
						className='block rounded-md py-2 text-base text-foreground transition-colors hover:text-primary'
					>
						{link.name}
					</Link>
				))}
			</div>
		</div>
	)
}
