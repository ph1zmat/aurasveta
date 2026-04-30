'use client'

import { useSyncExternalStore } from 'react'
import ProductCarousel from '@/widgets/product-carousel/ui/ProductCarousel'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
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

interface RecentlyViewedCarouselProps {
	currentProductId: string
}

export default function RecentlyViewedCarousel({
	currentProductId,
}: RecentlyViewedCarouselProps) {
	const allIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
	const ids = allIds.filter(id => id !== currentProductId)

	const { data: products } = trpc.products.getByIds.useQuery(ids, {
		enabled: ids.length > 0,
	})

	if (!products || products.length === 0) return null

	const carouselProducts = (products as unknown as DbProduct[]).map(product =>
		toCatalogCardProps(toFrontendProduct(product)),
	)

	return <ProductCarousel title='Вы смотрели' products={carouselProducts} />
}
