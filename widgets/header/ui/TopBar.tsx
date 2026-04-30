'use client'

import { MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

function formatWorkingHours(value: unknown): string | null {
	if (!value) return null
	if (typeof value === 'string') return value
	if (Array.isArray(value)) {
		return (
			value
				.map(v => (typeof v === 'string' ? v : ''))
				.filter(Boolean)
				.join(' · ') || null
		)
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.map(([day, v]) => {
				if (typeof v !== 'string' || !v.trim()) return null
				return `${day}: ${v}`
			})
			.filter((v): v is string => Boolean(v))
		return entries.length > 0 ? entries.join(' · ') : null
	}
	return null
}

export default function TopBar() {
	const { data: layout } = trpc.siteNavigation.getPublicLayoutConfig.useQuery(
		undefined,
		{
			staleTime: 5 * 60 * 1000,
		},
	)

	const headerLinks =
		layout?.navItems.filter(
			i => i.zone === 'HEADER_TOP_LEFT' || i.zone === 'HEADER_TOP_RIGHT',
		) ?? []
	const leftZoneLinks = headerLinks.filter(i => i.zone === 'HEADER_TOP_LEFT')
	const rightZoneLinks = headerLinks.filter(i => i.zone === 'HEADER_TOP_RIGHT')

	const leftLinks =
		leftZoneLinks.length > 0
			? leftZoneLinks
			: rightZoneLinks.length > 0
				? rightZoneLinks
				: []
	const rightLinks = rightZoneLinks
	const vis = layout?.headerVisibility
	const store = layout?.store

	const phone = store?.phone ?? null
	const showPhone = vis?.showPhone !== false && Boolean(phone)

	const hoursRaw = formatWorkingHours(store?.workingHours)
	const hoursLabel = hoursRaw
	const showAddress = vis?.showAddress === true
	const addressLabel =
		[store?.city, store?.address].filter(Boolean).join(', ') ||
		store?.city ||
		''

	return (
		<div className='hidden md:block text-sm'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-2'>
				{/* Левая часть */}
				<div className='flex items-center gap-6'>
					{(showAddress || store?.city) && (
						<button
							className='flex items-center gap-1 text-foreground hover:text-primary transition-colors'
							title={showAddress ? addressLabel : (store?.city ?? '')}
						>
							<MapPin className='h-4 w-4' />
							<span>{showAddress ? addressLabel : (store?.city ?? '')}</span>
						</button>
					)}
					{leftLinks.length > 0 && (
						<nav className='hidden md:flex items-center gap-4'>
							{leftLinks.map(link => (
								<Link
									key={link.href}
									href={link.href}
									className='text-muted-foreground hover:text-foreground transition-colors'
								>
									{link.label}
								</Link>
							))}
						</nav>
					)}
				</div>

				{/* Правая часть */}
				<div className='flex items-center gap-8'>
					{rightLinks.length > 0 && (
						<nav className='hidden md:flex items-center gap-4'>
							{rightLinks.map(link => (
								<Link
									key={link.href}
									href={link.href}
									className='text-muted-foreground hover:text-foreground transition-colors'
								>
									{link.label}
								</Link>
							))}
						</nav>
					)}
					{showPhone && phone && (
						<a
							href={`tel:${phone.replace(/[\s().-]/g, '')}`}
							className='flex items-center gap-1 text-foreground hover:text-primary transition-colors'
						>
							<Phone className='h-4 w-4' />
							<span className='font-normal'>{phone}</span>
							{vis?.showWorkingHours !== false && hoursLabel && (
								<span
									className='text-muted-foreground text-xs ml-1'
									title={hoursLabel}
								>
									{hoursLabel}
								</span>
							)}
						</a>
					)}
				</div>
			</div>
		</div>
	)
}
