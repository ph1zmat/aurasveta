import type { Product } from '@/entities/product/model/types'
import type { CompareProductCardProps } from '@/features/compare/ui/compareproductcard'
import { getProductImageUrl } from '@/shared/lib/productutils'

/**
 * Product → CompareProductCard
 */
export function toCompareCardProps(p: Product): CompareProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: getProductImageUrl(p),
		price: p.price,
		oldPrice: p.oldPrice,
	}
}
