'use client'

import { trpc } from '@/lib/trpc/client'
import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'
import { toFrontendProduct, toCatalogCardProps } from '@/entities/product/model/adapters'
import type { DbProduct } from '@/entities/product/model/adapters'
import { Slider } from '@/shared/ui/Slider'

export default function PopularProducts() {
	const { data: products } = trpc.recommendations.getPopularProducts.useQuery(
		{ limit: 10 },
		{ staleTime: 10 * 60 * 1000 },
	)

	if (!products || products.length === 0) return null

	const cards = products.map(p =>
		toCatalogCardProps(toFrontendProduct(p as unknown as DbProduct)),
	)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				Популярные товары
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
				{cards.map(card => (
					<InteractiveCatalogCard key={card.productId} {...card} />
				))}
			</Slider>
		</section>
	)
}
