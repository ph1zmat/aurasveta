import type { Product } from '@/types/product'
import type { CartItemData } from '@/types/cart'
import type { ProductCardProps } from '@/components/ui/ProductCard'
import type { CatalogProductCardProps } from '@/components/ui/CatalogProductCard'
import type { FavoriteProductCardProps } from '@/components/favorites/FavoriteProductCard'
import type { CompareProductCardProps } from '@/components/compare/CompareProductCard'

/**
 * Product → simple ProductCard (homepage sections)
 */
export function toProductCardProps(p: Product): ProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
		price: p.price,
		oldPrice: p.oldPrice,
	}
}

/**
 * Product → CatalogProductCard (catalog/category grids)
 */
export function toCatalogCardProps(p: Product): CatalogProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
		brand: p.brandCountry ? `${p.brand} (${p.brandCountry})` : p.brand,
		price: p.price,
		oldPrice: p.oldPrice,
		discountPercent: p.discountPercent,
		bonusAmount: p.bonusAmount,
		badges: p.badges,
		inStock: p.inStock
			? p.stockQuantity
				? `В наличии ${p.stockQuantity} шт.`
				: 'В наличии'
			: undefined,
		buttonLabel: p.inStock ? 'В КОРЗИНУ' : 'УТОЧНИТЬ',
	}
}

/**
 * Product → FavoriteProductCard
 */
export function toFavoriteCardProps(p: Product): FavoriteProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
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

/**
 * Product → CompareProductCard
 */
export function toCompareCardProps(p: Product): CompareProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
		price: p.price,
		oldPrice: p.oldPrice,
	}
}

/**
 * Product → CartItemData
 */
export function toCartItemData(
	p: Product,
	opts?: {
		quantity?: number
		assemblyOption?: string
		assemblyChecked?: boolean
	},
): CartItemData {
	return {
		id: String(p.id),
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
		price: p.price,
		oldPrice: p.oldPrice,
		quantity: opts?.quantity ?? 1,
		assemblyOption: opts?.assemblyOption,
		assemblyChecked: opts?.assemblyChecked,
	}
}
