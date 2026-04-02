'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CatalogProductCard from '@/components/ui/CatalogProductCard'
import type { CatalogProductCardProps } from '@/components/ui/CatalogProductCard'

interface ProductCarouselProps {
	title: string
	products: CatalogProductCardProps[]
}

export default function ProductCarousel({
	title,
	products,
}: ProductCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null)

	const scroll = (dir: 'left' | 'right') => {
		if (!scrollRef.current) return
		scrollRef.current.scrollBy({
			left: dir === 'left' ? -320 : 320,
			behavior: 'smooth',
		})
	}

	return (
		<section className='py-8'>
			<h2 className='mb-6 text-lg font-bold text-foreground'>{title}</h2>

			<div className='relative'>
				{/* Left arrow */}
				<button
					onClick={() => scroll('left')}
					className='absolute -left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-2 shadow-md text-foreground transition-colors hover:text-primary'
					aria-label='Назад'
				>
					<ChevronLeft className='h-5 w-5' strokeWidth={1.5} />
				</button>

				{/* Cards container */}
				<div
					ref={scrollRef}
					className='flex gap-4 overflow-x-auto px-2 scrollbar-hide'
				>
					{products.map(product => (
						<div key={product.href} className='w-56 shrink-0'>
							<CatalogProductCard {...product} />
						</div>
					))}
				</div>

				{/* Right arrow */}
				<button
					onClick={() => scroll('right')}
					className='absolute -right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-2 shadow-md text-foreground transition-colors hover:text-primary'
					aria-label='Вперёд'
				>
					<ChevronRight className='h-5 w-5' strokeWidth={1.5} />
				</button>
			</div>
		</section>
	)
}
