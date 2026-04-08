import type { Product } from '@/entities/product/model/types'
import type { FavoriteProductCardProps } from '@/features/favorites/ui/FavoriteProductCard'

/**
 * Product → FavoriteProductCard
 */
export function toFavoriteCardProps(p: Product): FavoriteProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.imagePath ?? p.images[0] ?? '/bulb.svg',
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
