import { z } from 'zod'
import { getStorageFileUrl } from '@/shared/lib/storage-file-url'

export const productImageSelect = {
	id: true,
	productId: true,
	url: true,
	key: true,
	originalName: true,
	size: true,
	mimeType: true,
	order: true,
	isMain: true,
	createdAt: true,
	updatedAt: true,
} as const

export const productImageInputSchema = z.object({
	id: z.string().optional(),
	url: z.string().min(1),
	key: z.string().min(1),
	originalName: z.string().nullish(),
	size: z.number().int().nonnegative().nullish(),
	mimeType: z.string().nullish(),
	order: z.number().int().default(0),
	isMain: z.boolean().default(false),
})

export type ProductImageInput = z.infer<typeof productImageInputSchema>

export function isExternalOrLegacyImageKey(value: string): boolean {
	return /^https?:\/\//i.test(value) || value.startsWith('/')
}

export function toProductImageUrl(
	key: string,
	currentUrl?: string | null,
): string {
	if (isExternalOrLegacyImageKey(key)) {
		return currentUrl?.trim() || key
	}

	return getStorageFileUrl(key)
}

export function normalizeProductImagesForWrite(
	images: readonly ProductImageInput[],
): Array<{
	url: string
	key: string
	originalName: string | null
	size: number | null
	mimeType: string | null
	order: number
	isMain: boolean
}> {
	const deduplicated = new Map<string, ProductImageInput>()

	for (const image of [...images].sort((a, b) => a.order - b.order)) {
		const key = image.key.trim()
		if (!key) continue

		deduplicated.set(key, {
			...image,
			key,
			url: toProductImageUrl(key, image.url),
		})
	}

	const normalized = [...deduplicated.values()]
		.sort((a, b) => a.order - b.order)
		.map((image, index) => ({
			url: toProductImageUrl(image.key, image.url),
			key: image.key,
			originalName: image.originalName?.trim() || null,
			size: image.size ?? null,
			mimeType: image.mimeType?.trim() || null,
			order: index,
			isMain: false,
		}))

	if (normalized.length === 0) {
		return []
	}

	const requestedMain = [...images]
		.sort((a, b) => a.order - b.order)
		.find(image => image.isMain && image.key.trim().length > 0)
	const mainKey = requestedMain?.key.trim() || normalized[0]!.key

	return normalized.map(image => ({
		...image,
		isMain: image.key === mainKey,
	}))
}
