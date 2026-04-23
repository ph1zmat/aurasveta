'use client'

import { useState } from 'react'
import Link from 'next/link'
import UnderlineAnimation from '@/shared/ui/UnderlineAnimation'
import { Slider } from '@/shared/ui/Slider'
import type { Category } from '@/entities/category/model/types'
import DeferredImage from '@/shared/ui/DeferredImage'

export type { Category as CatalogCategory }

interface CatalogCategoryCarouselProps {
	categories: Category[]
}

export default function CatalogCategoryCarousel({
	categories,
}: CatalogCategoryCarouselProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null)

	return (
		<Slider
			visibleItems={6}
			gap={8}
			arrows
			arrowsPosition='inside'
			loop={false}
			breakpoints={{
				0: { visibleItems: 3, gap: 4 },
				480: { visibleItems: 4, gap: 8 },
				768: { visibleItems: 5, gap: 8 },
				1024: { visibleItems: 6, gap: 8 },
			}}
		>
			{categories.map(cat => (
				<div
					key={cat.id}
					className='relative'
					onMouseEnter={() => setHoveredId(cat.id)}
					onMouseLeave={() => setHoveredId(null)}
				>
					<Link
						href={cat.href}
						className='group flex flex-col items-center gap-2 p-3'
					>
						<div className='relative h-28 w-28'>
							<DeferredImage
								src={cat.image}
								alt={cat.name}
								fill
								imageClassName='object-contain'
								fallbackClassName='rounded-full'
								showSpinner={false}
							/>
						</div>
						<UnderlineAnimation>
							<span className='text-center text-xs font-normal uppercase tracking-widest text-foreground py-1'>
								{cat.name}
							</span>
						</UnderlineAnimation>
					</Link>

					{/* Subcategory dropdown */}
					{cat.subcategories &&
						cat.subcategories.length > 0 &&
						hoveredId === cat.id && (
							<div className='absolute left-1/2 top-full z-30 -translate-x-1/2 rounded-md border border-border bg-card p-4 shadow-lg min-w-[220px]'>
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
		</Slider>
	)
}
