'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/entities/product/ui/ProductCard'
import { trpc } from '@/lib/trpc/client'
import { getRecentlyViewedIds } from '@/shared/lib/recentlyViewed'

export default function RecentlyViewed() {
	const [ids, setIds] = useState<string[]>([])

	useEffect(() => {
		setIds(getRecentlyViewedIds())
	}, [])

	const { data: products } = trpc.products.getByIds.useQuery(ids, {
		enabled: ids.length > 0,
	})

	if (!products || products.length === 0) return null

	const cards = products.slice(0, 4).map(p => ({
		name: p.name,
		href: `/product/${p.slug}`,
		image: (p as { imagePath?: string | null }).imagePath ?? (Array.isArray(p.images) ? p.images[0] : undefined) as string ?? '/bulb.svg',
		price: p.price ? Number(p.price) : 0,
		oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
	}))

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				Вы смотрели
			</h2>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{cards.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
