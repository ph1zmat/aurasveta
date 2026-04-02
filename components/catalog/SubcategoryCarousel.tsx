'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import UnderlineAnimation from '@/components/ui/UnderlineAnimation'

import type { Subcategory } from '@/types/catalog'
export type { Subcategory }

interface SubcategoryCarouselProps {
	items: Subcategory[]
}

export default function SubcategoryCarousel({
	items,
}: SubcategoryCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null)

	const scroll = (dir: 'left' | 'right') => {
		if (!scrollRef.current) return
		scrollRef.current.scrollBy({
			left: dir === 'left' ? -280 : 280,
			behavior: 'smooth',
		})
	}

	return (
		<div className='relative mb-6'>
			{/* Left arrow */}
			<button
				onClick={() => scroll('left')}
				className='absolute -left-4 top-1/2 z-20 -translate-y-1/2 p-1 text-foreground hover:text-primary transition-colors'
				aria-label='Назад'
			>
				<ChevronLeft className='h-5 w-5' strokeWidth={1.5} />
			</button>

			{/* Scrollable container */}
			<div
				ref={scrollRef}
				className='flex items-start gap-1 overflow-x-auto px-6 scrollbar-hide'
			>
				{items.map(sub => (
					<Link
						key={sub.href}
						href={sub.href}
						className='group flex w-32 shrink-0 flex-col items-center gap-2 p-2'
					>
						<div className='relative h-20 w-20'>
							{sub.image && (
								<Image
									src={sub.image}
									alt={sub.name}
									fill
									className='object-contain'
								/>
							)}
						</div>
						<UnderlineAnimation>
							<span className='text-center text-[10px] font-medium uppercase tracking-wider text-foreground leading-tight py-1'>
								{sub.name}
							</span>
						</UnderlineAnimation>
					</Link>
				))}
			</div>

			{/* Right arrow */}
			<button
				onClick={() => scroll('right')}
				className='absolute -right-4 top-1/2 z-20 -translate-y-1/2 p-1 text-foreground hover:text-primary transition-colors'
				aria-label='Вперёд'
			>
				<ChevronRight className='h-5 w-5' strokeWidth={1.5} />
			</button>
		</div>
	)
}
