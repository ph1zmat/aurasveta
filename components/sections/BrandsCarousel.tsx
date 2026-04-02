'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

const brands = [
	{ name: 'Novotech', slug: 'novotech' },
	{ name: 'Elektrostandard', slug: 'elektrostandard' },
	{ name: 'Voltega', slug: 'voltega' },
	{ name: 'Werkel', slug: 'werkel' },
	{ name: 'Citilux', slug: 'citilux' },
	{ name: 'Maytoni', slug: 'maytoni' },
	{ name: 'Arte Lamp', slug: 'arte-lamp' },
	{ name: 'ST Luce', slug: 'st-luce' },
	{ name: 'Odeon Light', slug: 'odeon-light' },
	{ name: 'Favourite', slug: 'favourite' },
]

export default function BrandsCarousel() {
	const scrollRef = useRef<HTMLDivElement>(null)

	const scroll = (dir: 'left' | 'right') => {
		if (!scrollRef.current) return
		const amount = 300
		scrollRef.current.scrollBy({
			left: dir === 'left' ? -amount : amount,
			behavior: 'smooth',
		})
	}

	return (
		<section className='mx-auto max-w-7xl px-4 py-8'>
			<h2 className='mb-6 text-lg font-bold uppercase tracking-wider text-foreground'>
				Бренды
			</h2>
			<div className='relative'>
				<button
					onClick={() => scroll('left')}
					className='absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-sm transition-colors hover:bg-accent'
					aria-label='Назад'
				>
					<ChevronLeft className='h-5 w-5 text-foreground' />
				</button>

				<div
					ref={scrollRef}
					className='flex items-center gap-8 overflow-x-auto px-10 py-4 scrollbar-hide'
				>
					{brands.map(brand => (
						<a
							key={brand.slug}
							href={`/brands/${brand.slug}`}
							className='flex h-16 min-w-[160px] shrink-0 items-center justify-center rounded-lg border border-border bg-card px-6 text-lg font-bold uppercase tracking-wider text-foreground/70 transition-colors hover:border-primary hover:text-primary'
						>
							{brand.name}
						</a>
					))}
				</div>

				<button
					onClick={() => scroll('right')}
					className='absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-sm transition-colors hover:bg-accent'
					aria-label='Вперёд'
				>
					<ChevronRight className='h-5 w-5 text-foreground' />
				</button>
			</div>
		</section>
	)
}
