'use client'

import CatalogProductCard from '@/components/ui/CatalogProductCard'
import type { CatalogProductCardProps } from '@/components/ui/CatalogProductCard'
import { Slider } from '@/components/ui/Slider'

interface ProductCarouselProps {
	title: string
	products: CatalogProductCardProps[]
}

export default function ProductCarousel({
	title,
	products,
}: ProductCarouselProps) {
	return (
		<section className='py-8'>
			<h2 className='mb-6 text-lg font-bold text-foreground'>{title}</h2>
			<Slider
				visibleItems={5}
				gap={16}
				arrows
				arrowsPosition='inside'
				loop={false}
				breakpoints={{
					0: { visibleItems: 2, gap: 8 },
					480: { visibleItems: 2, gap: 12 },
					768: { visibleItems: 3, gap: 16 },
					1024: { visibleItems: 5, gap: 16 },
				}}
			>
				{products.map(product => (
					<CatalogProductCard key={product.href} {...product} />
				))}
			</Slider>
		</section>
	)
}
