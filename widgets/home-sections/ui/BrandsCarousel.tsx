'use client'

import { Slider } from '@/shared/ui/Slider'

interface BrandItem {
	name: string
	slug: string
}

interface BrandsCarouselProps {
	brands?: BrandItem[]
}

export default function BrandsCarousel({ brands = [] }: BrandsCarouselProps) {
	if (brands.length === 0) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				Бренды
			</h2>
			<Slider
				visibleItems={6}
				gap={32}
				arrows
				arrowsPosition='outside'
				loop
				breakpoints={{
					0: { visibleItems: 2, gap: 12 },
					480: { visibleItems: 3, gap: 16 },
					768: { visibleItems: 4, gap: 24 },
					1024: { visibleItems: 6, gap: 32 },
				}}
			>
				{brands.map(brand => (
					<a
						key={brand.slug}
						href={`/brands/${brand.slug}`}
						className='flex h-16 items-center justify-center rounded-md border border-border bg-card px-6 text-lg font-semibold uppercase tracking-widest text-foreground/70 transition-colors hover:border-primary hover:text-primary'
					>
						{brand.name}
					</a>
				))}
			</Slider>
		</section>
	)
}
