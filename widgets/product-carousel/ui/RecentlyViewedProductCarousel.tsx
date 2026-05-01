'use client'

import { useSyncExternalStore } from 'react'
import { trpc } from '@/lib/trpc/client'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import {
	getRecentlyViewedIds,
	RECENTLY_VIEWED_EVENT,
} from '@/shared/lib/recentlyViewed'
import ProductCarousel from './ProductCarousel'

const emptyIds: string[] = []
let cachedSnapshot: string[] | null = null

function subscribe(callback: () => void) {
	window.addEventListener('storage', callback)
	window.addEventListener(RECENTLY_VIEWED_EVENT, callback)
	return () => {
		window.removeEventListener('storage', callback)
		window.removeEventListener(RECENTLY_VIEWED_EVENT, callback)
	}
}

function getSnapshot() {
	const next = getRecentlyViewedIds()
	if (
		cachedSnapshot &&
		cachedSnapshot.length === next.length &&
		cachedSnapshot.every((value, index) => value === next[index])
	) {
		return cachedSnapshot
	}
	cachedSnapshot = next
	return next
}

function getServerSnapshot() {
	return emptyIds
}

interface RecentlyViewedProductCarouselProps {
	excludeProductId?: string
	title?: string
	limit?: number
}

export default function RecentlyViewedProductCarousel({
	excludeProductId,
	title = 'Вы смотрели',
	limit = 5,
}: RecentlyViewedProductCarouselProps) {
	const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
	const filteredIds = ids.filter(id => id !== excludeProductId).slice(0, limit)

	const { data: products } = trpc.products.getByIds.useQuery(filteredIds, {
		enabled: filteredIds.length > 0,
		staleTime: 60 * 1000,
	})

	if (!products || products.length === 0) return null

	const orderMap = new Map(filteredIds.map((id, index) => [id, index]))
	const cards = [...(products as unknown as DbProduct[])]
		.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
		.map(product => toCatalogCardProps(toFrontendProduct(product)))

	if (cards.length === 0) return null

	return <ProductCarousel title={title} products={cards} />
}