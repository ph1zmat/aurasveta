'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
	const [density, setDensity] = useState<'normal' | 'compact' | 'tight'>(
		'normal',
	)
	const listRef = useRef<HTMLUListElement | null>(null)
	const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const openDropdown = useCallback((id: string) => {
		if (closeTimeout.current) clearTimeout(closeTimeout.current)
		setActiveId(id)
	}, [])

	const closeDropdown = useCallback(() => {
		closeTimeout.current = setTimeout(() => setActiveId(null), 150)
	}, [])

	useEffect(() => {
		const el = listRef.current
		if (!el) return

		let frame = 0

		const recalcDensity = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const current = listRef.current
				if (!current) return

				const hasOverflow = current.scrollWidth > current.clientWidth + 1
				if (!hasOverflow) {
					if (density !== 'normal') setDensity('normal')
					return
				}

				if (density === 'normal') {
					setDensity('compact')
				} else if (density === 'compact') {
					setDensity('tight')
				}
			})
		}

		const observer = new ResizeObserver(recalcDensity)
		observer.observe(el)
		window.addEventListener('resize', recalcDensity)
		recalcDensity()

		return () => {
			cancelAnimationFrame(frame)
			observer.disconnect()
			window.removeEventListener('resize', recalcDensity)
		}
	}, [categories.length, density])

	const linkDensityClass =
		density === 'normal'
			? 'px-3 py-3 text-xs tracking-[0.18em] lg:px-4 lg:text-[13px]'
			: density === 'compact'
				? 'px-2.5 py-2.5 text-[11px] tracking-[0.14em] lg:px-3 lg:text-xs'
				: 'px-2 py-2 text-[10px] tracking-[0.1em] lg:px-2.5 lg:text-[11px]'

	return (
		<nav
			aria-label='Категории товаров'
			className='relative hidden border-y border-foreground md:block'
		>
			<div className='mx-auto max-w-7xl px-4'>
				<ul
					ref={listRef}
					className='flex items-stretch overflow-x-hidden whitespace-nowrap'
				>
					{categories.map(cat => {
						const isCurrent =
							pathname === cat.href || pathname.startsWith(`${cat.href}/`)
						const isActive = activeId === cat.id || isCurrent

						return (
							<li
								key={cat.id}
								className='flex min-w-0 flex-1'
								onMouseEnter={() => openDropdown(cat.id)}
								onMouseLeave={closeDropdown}
								onFocus={() => openDropdown(cat.id)}
								onBlur={event => {
									if (
										!event.currentTarget.contains(
											event.relatedTarget as Node | null,
										)
									) {
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
											'flex w-full items-center justify-center whitespace-nowrap font-medium uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
											linkDensityClass,
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
