'use client'

import { useSyncExternalStore } from 'react'
import ProductCard from '@/entities/product/ui/ProductCard'
import { trpc } from '@/lib/trpc/client'
import { getRecentlyViewedIds } from '@/shared/lib/recentlyViewed'

const emptyIds: string[] = []
let cachedSnapshot: string[] | null = null

function subscribe(callback: () => void) {
	window.addEventListener('storage', callback)
	return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
	const next = getRecentlyViewedIds()
	// useSyncExternalStore requires stable snapshots to avoid infinite loops.
	if (
		cachedSnapshot &&
		cachedSnapshot.length === next.length &&
		cachedSnapshot.every((v, i) => v === next[i])
	) {
		return cachedSnapshot
	}
	cachedSnapshot = next
	return next
}

function getServerSnapshot() {
	return emptyIds
}

export default function RecentlyViewed() {
	const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

	const { data: products } = trpc.products.getByIds.useQuery(ids, {
		enabled: ids.length > 0,
	})

	if (!products || products.length === 0) return null

	const cards = products.slice(0, 4).map(p => ({
		name: p.name,
		href: `/product/${p.slug}`,
		image:
			(p as { imagePath?: string | null }).imagePath ??
			((Array.isArray(p.images) ? p.images[0] : undefined) as string) ??
			'/bulb.svg',
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
