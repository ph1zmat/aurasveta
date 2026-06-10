'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import UnderlineAnimation from '@/shared/ui/underlineanimation'
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
	const pathname = usePathname()

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
		<nav
			aria-label='Категории товаров'
			className='relative hidden border-y border-foreground md:block'
		>
			<div className='mx-auto max-w-7xl px-4'>
				<ul className='flex items-stretch overflow-x-auto scrollbar-hide'>
					{categories.map(cat => {
						const isCurrent = pathname === cat.href || pathname.startsWith(`${cat.href}/`)
						const isActive = activeId === cat.id || isCurrent

						return (
							<li
								key={cat.id}
								className='flex min-w-0 flex-1'
								onMouseEnter={() => openDropdown(cat.id)}
								onMouseLeave={closeDropdown}
								onFocus={() => openDropdown(cat.id)}
								onBlur={event => {
									if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
										closeDropdown()
									}
								}}
							>
							<UnderlineAnimation
								className='flex w-full'
								lineClassName={
									cat.highlight ? 'bg-destructive' : 'bg-foreground'
								}
							>
								<Link
									href={cat.href}
									aria-current={isCurrent ? 'page' : undefined}
									className={cn(
										'flex w-full items-center justify-center px-3 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:px-4 lg:text-[13px]',
										cat.highlight ? 'text-destructive' : 'text-foreground',
										isActive && !cat.highlight && 'text-primary',
										!cat.highlight && 'hover:text-primary',
									)}
								>
									{cat.name}
								</Link>
							</UnderlineAnimation>
						</li>
						)
					})}
				</ul>
			</div>
		</nav>
	)
}
