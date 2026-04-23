import type { Product, ProductImage } from '@/shared/types/product'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'

export function sortProductImages<
	T extends Pick<ProductImage, 'order' | 'isMain'>,
>(images: readonly T[]): T[] {
	return [...images].sort((a, b) => {
		if (a.isMain !== b.isMain) return a.isMain ? -1 : 1
		return a.order - b.order
	})
}

export function getMainImage(
	product: Pick<Product, 'images'> | { images?: ProductImage[] | null },
): ProductImage | null {
	const images = Array.isArray(product.images) ? product.images : []
	if (images.length === 0) return null

	const explicitMain = images.find(image => image.isMain)
	if (explicitMain) return explicitMain

	return sortProductImages(images)[0] ?? null
}

export function getProductImageUrl(
	product: Pick<Product, 'images'> | { images?: ProductImage[] | null },
	fallback = '/bulb.svg',
): string {
	const mainImage = getMainImage(product)
	return (
		resolveStorageFileUrl(mainImage?.url ?? mainImage?.key ?? null) ?? fallback
	)
}

export function normalizeProductImages(
	images: ProductImage[] | null | undefined,
) {
	return sortProductImages(images ?? [])
}
