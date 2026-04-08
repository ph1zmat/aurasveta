import type { Product } from '@/entities/product/model/types'
import type { CompareProductCardProps } from '@/features/compare/ui/CompareProductCard'

/**
 * Product → CompareProductCard
 */
export function toCompareCardProps(p: Product): CompareProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.imagePath ?? p.images[0] ?? '/bulb.svg',
		price: p.price,
		oldPrice: p.oldPrice,
	}
}
