'use client'

import Image from 'next/image'
import Link from 'next/link'
import UnderlineAnimation from '@/components/ui/UnderlineAnimation'
import { Slider } from '@/components/ui/Slider'

import type { Subcategory } from '@/types/catalog'
export type { Subcategory }

interface SubcategoryCarouselProps {
	items: Subcategory[]
}

export default function SubcategoryCarousel({
	items,
}: SubcategoryCarouselProps) {
	return (
		<div className='mb-6'>
			<Slider
				visibleItems={8}
				gap={4}
				arrows
				arrowsPosition='inside'
				loop={false}
				breakpoints={{
					0: { visibleItems: 3, gap: 4 },
					480: { visibleItems: 4, gap: 4 },
					768: { visibleItems: 6, gap: 4 },
					1024: { visibleItems: 8, gap: 4 },
				}}
			>
				{items.map(sub => (
					<Link
						key={sub.href}
						href={sub.href}
						className='group flex flex-col items-center gap-2 p-2'
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
			</Slider>
		</div>
	)
}
