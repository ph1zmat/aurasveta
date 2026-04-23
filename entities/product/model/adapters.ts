import type { Product, ProductImage } from '@/entities/product/model/types'
import type { CartItemData } from '@/entities/cart/model/types'
import type { ProductCardProps } from '@/entities/product/ui/ProductCard'
import type { CatalogProductCardProps } from '@/entities/product/ui/CatalogProductCard'
import {
	getResolvedProductImageUrl,
	getProductImageUrl,
	normalizeProductImages,
} from '@/shared/lib/product-utils'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import type { StorageImageAsset } from '@/shared/types/storage'

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
	brand?: string | null
	brandCountry?: string | null
	rating?: number | null
	reviewsCount?: number
	badges: unknown
	createdAt: Date | string
	category?: { name: string; slug?: string } | null
}

function toProductImage(image: unknown, index: number): ProductImage | null {
	if (typeof image === 'string') {
		const value = image.trim()
		const resolvedUrl = resolveStorageFileUrl(value)
		if (!value || !resolvedUrl) return null

		return {
			id: `legacy-${index}-${value}`,
			url: resolvedUrl,
			key: value,
			displayUrl: resolvedUrl,
			imageAsset: null,
			originalName: null,
			size: null,
			mimeType: null,
			order: index,
			isMain: index === 0,
		}
	}

	if (!image || typeof image !== 'object') return null

	const value = image as Partial<ProductImage>
	const key = typeof value.key === 'string' ? value.key.trim() : ''
	const url = typeof value.url === 'string' ? value.url.trim() : ''
	const displayUrl =
		typeof value.displayUrl === 'string' ? value.displayUrl.trim() : ''
	const imageAsset = (value.imageAsset ?? null) as StorageImageAsset | null
	const resolvedValue = displayUrl || url || key
	const resolvedUrl =
		getResolvedProductImageUrl({
			displayUrl: displayUrl || null,
			imageAsset,
			url,
			key,
		}) ?? resolveStorageFileUrl(resolvedValue)

	if (!resolvedValue || !resolvedUrl) return null

	return {
		id:
			typeof value.id === 'string' && value.id.trim().length > 0
				? value.id
				: `image-${index}-${resolvedValue}`,
		productId: value.productId,
		url: resolvedUrl,
		key: key || resolvedValue,
			displayUrl: resolvedUrl,
			imageAsset,
		originalName: value.originalName ?? null,
		size: value.size ?? null,
		mimeType: value.mimeType ?? null,
		order: typeof value.order === 'number' ? value.order : index,
		isMain: Boolean(value.isMain),
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
	}
}

/**
 * Prisma DB row → frontend Product type.
 * Single source of truth — replace local `toFrontendProduct` copies.
 */
export function toFrontendProduct(p: DbProduct): Product {
	const images = normalizeProductImages(
		(Array.isArray(p.images) ? p.images : [])
			.map((image, index) => toProductImage(image, index))
			.filter((image): image is ProductImage => image !== null),
	)

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
		categorySlug: p.category?.slug ?? undefined,
		brand: p.brand ?? undefined,
		brandCountry: p.brandCountry ?? undefined,
		images,
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
		image: getProductImageUrl(p),
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
		image: getProductImageUrl(p),
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
		image: getProductImageUrl(p),
		price: p.price,
		oldPrice: p.oldPrice,
		quantity: opts?.quantity ?? 1,
		assemblyOption: opts?.assemblyOption,
		assemblyChecked: opts?.assemblyChecked,
	}
}
