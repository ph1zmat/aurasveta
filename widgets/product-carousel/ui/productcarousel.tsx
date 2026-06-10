'use client'

import InteractiveCatalogCard from '@/entities/product/ui/interactivecatalogcard'
import type { CatalogProductCardProps } from '@/entities/product/ui/catalogproductcard'
import { Slider } from '@/shared/ui/slider'

interface ProductCarouselProps {
	title: string
	eyebrow?: string
	viewAllHref?: string
	viewAllLabel?: string
	products: (CatalogProductCardProps & { productId: string })[]
}

export default function ProductCarousel({
	title,
	eyebrow,
	viewAllHref,
	viewAllLabel = 'Смотреть все',
	products,
}: ProductCarouselProps) {
	return (
		<section className='py-6 md:py-8'>
			<div className='mb-5 flex items-end justify-between gap-4 md:mb-6'>
				<div>
					{eyebrow ? (
						<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
							{eyebrow}
						</p>
					) : null}
					<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
						{title}
					</h2>
				</div>
				{viewAllHref ? (
					<a
						href={viewAllHref}
						className='shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'
					>
						{viewAllLabel}
					</a>
				) : null}
			</div>
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
