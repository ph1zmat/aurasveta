'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

interface HeaderVisibility {
	showAddress?: boolean
}

interface MobileCatalogMenuProps {
	onClose: () => void
	navLinks?: Array<{ label: string; href: string }>
	city?: string | null
	address?: string | null
	headerVisibility?: HeaderVisibility | null
}

export default function MobileCatalogMenu({
	onClose,
	navLinks = [],
	city,
	address,
	headerVisibility,
}: MobileCatalogMenuProps) {
	const { data: dbCategories } = trpc.categories.getNav.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})

	const categories = dbCategories
		? dbCategories.map(c => ({
				name: c.name,
				href: `/catalog/${c.slug}`,
			}))
		: []

	const addressLabel = [city, address].filter(Boolean).join(', ')
	return (
		<div className='fixed inset-x-0 bottom-0 top-[calc(var(--mobile-header-height)+env(safe-area-inset-top))] z-40 overflow-y-auto bg-background pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] md:hidden'>
			{navLinks.length > 0 && (
				<div className='mobile-edge-padding border-b border-border py-3'>
					<ul className='space-y-2'>
						{navLinks.map(link => (
							<li key={link.href}>
								<Link
									href={link.href}
									onClick={onClose}
									className='block rounded-md px-1 py-2 text-sm text-foreground transition-colors hover:bg-accent/60 active:bg-accent'
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}

			<ul className='mobile-edge-padding'>
				{categories.map(cat => (
					<li key={cat.href} className='border-b border-border'>
						<Link
							href={cat.href}
							onClick={onClose}
							className='flex items-center justify-between py-4 text-base font-normal text-foreground transition-colors hover:bg-accent/60 active:bg-accent'
						>
							{cat.name}
							<ChevronRight
								className='h-5 w-5 text-muted-foreground'
								strokeWidth={1.5}
							/>
						</Link>
					</li>
				))}
			</ul>

			{headerVisibility?.showAddress === true && addressLabel && (
				<div className='mobile-edge-padding pt-4 pb-8'>
					<div className='rounded-md border border-border px-3 py-2 text-sm text-muted-foreground'>
						{addressLabel}
					</div>
				</div>
			)}
		</div>
	)
}
