import type { Product } from '@/entities/product/model/types'
import type { CartItemData } from '@/entities/cart/model/types'
import type { ProductCardProps } from '@/entities/product/ui/ProductCard'
import type { CatalogProductCardProps } from '@/entities/product/ui/CatalogProductCard'

/** Shape of a Prisma product row used by `toFrontendProduct`. */
export interface DbProduct {
	id: string
	slug: string
	name: string
	description?: string | null
	price?: number | null
	compareAtPrice?: number | null
	stock: number
	images: unknown
	imagePath?: string | null
	brand?: string | null
	brandCountry?: string | null
	rating?: number | null
	reviewsCount?: number
	badges: unknown
	createdAt: Date | string
	category?: { name: string; slug?: string } | null
}

/**
 * Prisma DB row → frontend Product type.
 * Single source of truth — replace local `toFrontendProduct` copies.
 */
export function toFrontendProduct(p: DbProduct): Product {
	return {
		id: p.id,
		slug: p.slug,
		name: p.name,
		description: p.description ?? '',
		price: p.price ? Number(p.price) : 0,
		oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
		discountPercent:
			p.price && p.compareAtPrice
				? Math.round((1 - Number(p.price) / Number(p.compareAtPrice)) * 100)
				: undefined,
		bonusAmount: p.price ? Math.round(Number(p.price) * 0.06) : undefined,
		category: p.category?.name ?? '',
		brand: p.brand ?? undefined,
		brandCountry: p.brandCountry ?? undefined,
		images: Array.isArray(p.images) ? (p.images as string[]) : [],
		imagePath: p.imagePath ?? null,
		rating: p.rating ? Number(p.rating) : undefined,
		reviewsCount: p.reviewsCount,
		inStock: p.stock > 0,
		stockQuantity: p.stock,
		badges: Array.isArray(p.badges) ? (p.badges as string[]) : [],
		createdAt:
			typeof p.createdAt === 'string'
				? p.createdAt
				: (p.createdAt?.toISOString?.() ?? new Date().toISOString()),
	}
}

/**
 * Product → simple ProductCard (homepage sections)
 */
export function toProductCardProps(p: Product): ProductCardProps {
	return {
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.imagePath ?? p.images[0] ?? '/bulb.svg',
		price: p.price,
		oldPrice: p.oldPrice,
	}
}

/**
 * Product → CatalogProductCard (catalog/category grids)
 */
export function toCatalogCardProps(
	p: Product,
): CatalogProductCardProps & { productId: string } {
	return {
		productId: String(p.id),
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.imagePath ?? p.images[0] ?? '/bulb.svg',
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
		image: p.imagePath ?? p.images[0],
		price: p.price,
		oldPrice: p.oldPrice,
		quantity: opts?.quantity ?? 1,
		assemblyOption: opts?.assemblyOption,
		assemblyChecked: opts?.assemblyChecked,
	}
}
