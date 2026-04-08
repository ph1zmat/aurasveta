'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import UnderlineAnimation from '@/shared/ui/UnderlineAnimation'
import { trpc } from '@/lib/trpc/client'

interface Category {
	id: string
	name: string
	href: string
	highlight?: boolean
}

export default function CategoryNav() {
	const { data: dbCategories } = trpc.categories.getNav.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})

	const categories: Category[] = dbCategories
		? dbCategories.map(c => ({
				id: c.slug,
				name: c.name.toUpperCase(),
				href: `/catalog/${c.slug}`,
			}))
		: []

	const [activeId, setActiveId] = useState<string | null>(null)
	const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const openDropdown = useCallback((id: string) => {
		if (closeTimeout.current) clearTimeout(closeTimeout.current)
		setActiveId(id)
	}, [])

	const closeDropdown = useCallback(() => {
		closeTimeout.current = setTimeout(() => setActiveId(null), 150)
	}, [])

	return (
		<nav className='hidden md:block relative border-t border-b border-foreground'>
			<div className='mx-auto max-w-7xl px-4'>
				<ul className='flex items-stretch overflow-x-auto scrollbar-hide'>
					{categories.map(cat => (
						<li
							key={cat.id}
							className='flex flex-1 min-w-0'
							onMouseEnter={() => openDropdown(cat.id)}
							onMouseLeave={closeDropdown}
						>
							<UnderlineAnimation
								className='flex w-full'
								lineClassName={
									cat.highlight ? 'bg-destructive' : 'bg-foreground'
								}
							>
								<Link
									href={cat.href}
									className={cn(
										'flex w-full items-center justify-center px-3 py-2 text-xs font-normal tracking-wider transition-colors',
										cat.highlight ? 'text-destructive' : 'text-foreground',
										activeId === cat.id && !cat.highlight && 'text-primary',
									)}
								>
									{cat.name}
								</Link>
							</UnderlineAnimation>
						</li>
					))}
				</ul>
			</div>
		</nav>
	)
}
