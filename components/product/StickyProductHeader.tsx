'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface StickyProductHeaderProps {
	name: string
	image: string
	price: number
	discountPercent?: number
	bonusAmount?: number
	actionLabel?: string
	actionHref?: string
}

export default function StickyProductHeader({
	name,
	image,
	price,
	discountPercent,
	bonusAmount,
	actionLabel = 'УТОЧНИТЬ НАЛИЧИЕ',
	actionHref = '#',
}: StickyProductHeaderProps) {
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 400)
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	if (!visible) return null

	return (
		<div className='fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm'>
			<div className='container mx-auto flex max-w-7xl items-center gap-4 py-2'>
				{/* Product thumbnail */}
				<div className='relative h-10 w-10 shrink-0'>
					<Image src={image} alt={name} fill className='object-contain' />
				</div>

				{/* Product name */}
				<p className='min-w-0 flex-1 truncate text-sm font-medium text-foreground'>
					{name}
				</p>

				{/* Price + bonus */}
				<div className='flex items-center gap-2'>
					<span className='text-lg font-bold text-foreground'>
						{price.toLocaleString('ru-RU')} ₽
					</span>
					{discountPercent && bonusAmount ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground'>
							{discountPercent}%
							<span className='font-bold'>
								{bonusAmount.toLocaleString('ru-RU')}
							</span>
							<span className='text-primary'>₽</span>
						</span>
					) : null}
				</div>

				{/* CTA */}
				<Link
					href={actionHref}
					className='shrink-0 rounded-sm bg-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-card transition-colors hover:bg-foreground/90'
				>
					{actionLabel}
				</Link>
			</div>
		</div>
	)
}
