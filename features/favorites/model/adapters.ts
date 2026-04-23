import type { Product } from '@/entities/product/model/types'
import type { FavoriteProductCardProps } from '@/features/favorites/ui/FavoriteProductCard'
import { getProductImageUrl } from '@/shared/lib/product-utils'

/**
 * Product → FavoriteProductCard
 */
export function toFavoriteCardProps(p: Product): FavoriteProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: getProductImageUrl(p),
		brand: p.brandCountry ? `${p.brand} (${p.brandCountry})` : p.brand,
		price: p.price,
		oldPrice: p.oldPrice,
		discountPercent: p.discountPercent,
		bonusAmount: p.bonusAmount,
		rating: p.rating,
		reviewsCount: p.reviewsCount,
		inStock: p.inStock
			? p.stockQuantity
				? `В наличии ${p.stockQuantity} шт.`
				: 'В наличии'
			: undefined,
	}
}
