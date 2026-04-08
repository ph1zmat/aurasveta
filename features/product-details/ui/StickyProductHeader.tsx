'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'

interface StickyProductHeaderProps {
	name: string
	image: string
	price: number
	discountPercent?: number
	bonusAmount?: number
	actionLabel?: string
	actionHref?: string
	showAtY?: number
}

export default function StickyProductHeader({
	name,
	image,
	price,
	discountPercent,
	bonusAmount,
	actionLabel = 'УТОЧНИТЬ НАЛИЧИЕ',
	actionHref = '#',
	showAtY,
}: StickyProductHeaderProps) {
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		let raf = 0
		const onScroll = () => {
			cancelAnimationFrame(raf)
			raf = requestAnimationFrame(() => {
				const threshold = showAtY ?? 600
				setVisible(window.scrollY >= threshold)
			})
		}
		// Initial check
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			window.removeEventListener('scroll', onScroll)
			cancelAnimationFrame(raf)
		}
	}, [showAtY])

	if (!visible) return null

	return (
		<div className='fixed top-0 left-0 right-0 z-50 hidden border-b border-border bg-muted shadow-sm md:block'>
			<div className='container mx-auto flex max-w-7xl items-center gap-4 py-2'>
				{/* Product thumbnail */}
				<div className='relative h-10 w-10 shrink-0'>
					<Image src={image} alt={name} fill className='object-contain' />
				</div>

				{/* Product name */}
				<p className='min-w-0 flex-1 truncate text-sm font-normal tracking-wide text-foreground'>
					{name}
				</p>

				{/* Price + bonus */}
				<div className='flex items-center gap-2'>
					<span className='text-lg font-semibold text-foreground'>
						{price.toLocaleString('ru-RU')} ₽
					</span>
					{discountPercent && bonusAmount ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-normal text-foreground'>
							{discountPercent}%
							<span className='font-semibold'>
								{bonusAmount.toLocaleString('ru-RU')}
							</span>
							<span className='text-primary'>₽</span>
						</span>
					) : null}
				</div>

				{/* CTA */}
				<Button asChild variant='primary' size='sm' className='shrink-0'>
					<Link href={actionHref}>{actionLabel}</Link>
				</Button>
			</div>
		</div>
	)
}
