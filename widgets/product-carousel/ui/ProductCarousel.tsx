'use client'

import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'
import type { CatalogProductCardProps } from '@/entities/product/ui/CatalogProductCard'
import { Slider } from '@/shared/ui/Slider'

interface ProductCarouselProps {
	title: string
	products: (CatalogProductCardProps & { productId: string })[]
}

export default function ProductCarousel({
	title,
	products,
}: ProductCarouselProps) {
	return (
		<section className='py-8'>
			<h2 className='mb-6 text-lg font-semibold tracking-widest text-foreground'>
				{title}
			</h2>
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
					<InteractiveCatalogCard key={product.href} {...product} />
				))}
			</Slider>
		</section>
	)
}
