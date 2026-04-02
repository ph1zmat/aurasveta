'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import UnderlineAnimation from '@/components/ui/UnderlineAnimation'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/catalog'

export type { Category as CatalogCategory }

interface CatalogCategoryCarouselProps {
	categories: Category[]
}

export default function CatalogCategoryCarousel({
	categories,
}: CatalogCategoryCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [hoveredId, setHoveredId] = useState<string | null>(null)

	const scroll = (dir: 'left' | 'right') => {
		if (!scrollRef.current) return
		scrollRef.current.scrollBy({
			left: dir === 'left' ? -300 : 300,
			behavior: 'smooth',
		})
	}

	return (
		<div className='relative'>
			{/* Left arrow */}
			<button
				onClick={() => scroll('left')}
				className='absolute -left-2 top-1/2 z-20 -translate-y-1/2 p-2 text-foreground hover:text-primary transition-colors'
				aria-label='Назад'
			>
				<ChevronLeft className='h-6 w-6' strokeWidth={1.5} />
			</button>

			{/* Carousel */}
			<div
				ref={scrollRef}
				className='flex items-start gap-2 overflow-x-auto px-8 scrollbar-hide'
			>
				{categories.map(cat => (
					<div
						key={cat.id}
						className='relative shrink-0'
						onMouseEnter={() => setHoveredId(cat.id)}
						onMouseLeave={() => setHoveredId(null)}
					>
						<Link
							href={cat.href}
							className='group flex w-44 flex-col items-center gap-2 p-3'
						>
							<div className='relative h-28 w-28'>
								<Image
									src={cat.image}
									alt={cat.name}
									fill
									className='object-contain'
								/>
							</div>
							<UnderlineAnimation>
								<span className='text-center text-xs font-medium uppercase tracking-wider text-foreground py-1'>
									{cat.name}
								</span>
							</UnderlineAnimation>
						</Link>

						{/* Subcategory dropdown */}
						{cat.subcategories &&
							cat.subcategories.length > 0 &&
							hoveredId === cat.id && (
								<div className='absolute left-1/2 top-full z-30 -translate-x-1/2 rounded-sm border border-border bg-card p-4 shadow-lg min-w-[220px]'>
									<ul className='space-y-2'>
										<li>
											<Link
												href={cat.href}
												className='text-sm text-foreground hover:text-primary transition-colors'
											>
												Все товары категории
											</Link>
										</li>
										{cat.subcategories.map(sub => (
											<li key={sub.href}>
												<Link
													href={sub.href}
													className='text-sm text-foreground hover:text-primary transition-colors'
												>
													{sub.name}
												</Link>
											</li>
										))}
									</ul>
								</div>
							)}
					</div>
				))}
			</div>

			{/* Right arrow */}
			<button
				onClick={() => scroll('right')}
				className='absolute -right-2 top-1/2 z-20 -translate-y-1/2 p-2 text-foreground hover:text-primary transition-colors'
				aria-label='Вперёд'
			>
				<ChevronRight className='h-6 w-6' strokeWidth={1.5} />
			</button>
		</div>
	)
}
