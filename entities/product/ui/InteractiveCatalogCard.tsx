'use client'

import { useMemo, useCallback } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/features/cart/useCart'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import CatalogProductCard from '@/entities/product/ui/CatalogProductCard'
import type { CatalogProductCardProps } from '@/entities/product/ui/CatalogProductCard'

interface InteractiveCatalogCardProps extends CatalogProductCardProps {
	productId: string
}

export default function InteractiveCatalogCard({
	productId,
	...props
}: InteractiveCatalogCardProps) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const cart = useCart()
	const favorites = useFavorites()
	const compare = useCompare()

	const hrefWithReturnTo = useMemo(() => {
		// Attach returnTo for list/search flows and product-to-product navigation
		const isReturnToContext =
			pathname === '/catalog' ||
			pathname.startsWith('/catalog/') ||
			pathname === '/search' ||
			pathname.startsWith('/product/')

		if (!isReturnToContext) return props.href

		const current = `${pathname}${
			searchParams.toString() ? `?${searchParams.toString()}` : ''
		}`
		const url = new URL(props.href, 'http://local')
		if (!url.searchParams.get('returnTo')) {
			url.searchParams.set('returnTo', current)
		}
		return `${url.pathname}${url.search}${url.hash}`
	}, [pathname, props.href, searchParams])

	const handleMouseEnter = useCallback(() => {
		router.prefetch(hrefWithReturnTo)
	}, [router, hrefWithReturnTo])

	return (
		<div onMouseEnter={handleMouseEnter}>
			<CatalogProductCard
				{...props}
				href={hrefWithReturnTo}
				productId={productId}
				isFavorite={favorites.has(productId)}
				isCompare={compare.has(productId)}
				isInCart={cart.has(productId)}
				onToggleFavorite={() => favorites.toggle(productId)}
				onToggleCompare={() => compare.toggle(productId)}
				onAddToCart={() => cart.add(productId)}
			/>
		</div>
	)
}
