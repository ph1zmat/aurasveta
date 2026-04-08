'use client'

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
	const cart = useCart()
	const favorites = useFavorites()
	const compare = useCompare()

	return (
		<CatalogProductCard
			{...props}
			productId={productId}
			isFavorite={favorites.has(productId)}
			isCompare={compare.has(productId)}
			onToggleFavorite={() => favorites.toggle(productId)}
			onToggleCompare={() => compare.toggle(productId)}
			onAddToCart={() => cart.add(productId)}
		/>
	)
}
