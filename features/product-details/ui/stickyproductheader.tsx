'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { PriceBYN } from '@/shared/ui/pricebyn'

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
		<div className='fixed left-0 right-0 top-0 z-50 hidden border-b border-border bg-background/95 backdrop-blur md:block'>
			<div className='container mx-auto flex max-w-7xl items-center gap-4 py-2.5'>
				{/* Product thumbnail */}
				<div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-card'>
					<Image src={image} alt={name} fill className='object-contain' />
				</div>

				{/* Product name */}
				<div className='min-w-0 flex-1'>
					<p className='text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Карточка товара
					</p>
					<p className='truncate text-sm tracking-wide text-foreground'>
						{name}
					</p>
				</div>

				{/* Price + bonus */}
				<div className='flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5'>
					<PriceBYN value={price} className='text-lg font-semibold text-foreground' />
					{discountPercent && bonusAmount ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-normal text-foreground'>
							-{discountPercent}%
							<PriceBYN
								value={bonusAmount}
								className='font-semibold text-primary'
								iconClassName='text-primary opacity-100'
							/>
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
