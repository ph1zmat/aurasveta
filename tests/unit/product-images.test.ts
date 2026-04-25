import { describe, it, expect } from 'vitest'

// Replicated from lib/products/product-images.ts (pure logic, no Prisma/Storage deps).

function isExternalOrLegacyImageKey(value: string): boolean {
	return /^https?:\/\//i.test(value) || value.startsWith('/')
}

function toProductImageUrl(key: string, currentUrl?: string | null): string {
	if (isExternalOrLegacyImageKey(key)) {
		return currentUrl?.trim() || key
	}
	return `/api/storage/file?key=${encodeURIComponent(key)}`
}

interface ProductImageInput {
	id?: string
	url: string
	key: string
	originalName?: string | null
	size?: number | null
	mimeType?: string | null
	order: number
	isMain: boolean
}

function normalizeProductImagesForWrite(images: readonly ProductImageInput[]) {
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

// ────────────────────────────────────────────────────────────────
// isExternalOrLegacyImageKey
// ────────────────────────────────────────────────────────────────
describe('isExternalOrLegacyImageKey', () => {
	it('returns true for http:// URLs', () => {
		expect(isExternalOrLegacyImageKey('http://example.com/img.jpg')).toBe(true)
	})

	it('returns true for https:// URLs', () => {
		expect(isExternalOrLegacyImageKey('https://cdn.example.com/img.jpg')).toBe(
			true,
		)
	})

	it('returns true for root-relative paths', () => {
		expect(isExternalOrLegacyImageKey('/images/photo.jpg')).toBe(true)
	})

	it('returns false for plain storage keys', () => {
		expect(isExternalOrLegacyImageKey('products/img.jpg')).toBe(false)
	})

	it('returns false for keys with no leading slash', () => {
		expect(isExternalOrLegacyImageKey('uploads/photo.webp')).toBe(false)
	})
})

// ────────────────────────────────────────────────────────────────
// toProductImageUrl
// ────────────────────────────────────────────────────────────────
describe('toProductImageUrl', () => {
	it('returns currentUrl when key is an external http URL', () => {
		expect(
			toProductImageUrl('http://external.com/img.jpg', 'http://external.com/img.jpg'),
		).toBe('http://external.com/img.jpg')
	})

	it('falls back to key when key is external and currentUrl is empty', () => {
		expect(toProductImageUrl('http://external.com/img.jpg', '')).toBe(
			'http://external.com/img.jpg',
		)
	})

	it('wraps storage key in proxy URL', () => {
		expect(toProductImageUrl('products/img.jpg')).toBe(
			'/api/storage/file?key=products%2Fimg.jpg',
		)
	})

	it('URL-encodes the key', () => {
		expect(toProductImageUrl('path/to file.jpg')).toBe(
			'/api/storage/file?key=path%2Fto%20file.jpg',
		)
	})

	it('handles legacy /images/ path as external', () => {
		expect(toProductImageUrl('/images/old.jpg', '/images/old.jpg')).toBe(
			'/images/old.jpg',
		)
	})
})

// ────────────────────────────────────────────────────────────────
// normalizeProductImagesForWrite
// ────────────────────────────────────────────────────────────────
describe('normalizeProductImagesForWrite', () => {
	it('returns empty array for empty input', () => {
		expect(normalizeProductImagesForWrite([])).toEqual([])
	})

	it('sets first image as main when none marked', () => {
		const images: ProductImageInput[] = [
			{ key: 'img1.jpg', url: '', order: 0, isMain: false },
			{ key: 'img2.jpg', url: '', order: 1, isMain: false },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result[0]!.isMain).toBe(true)
		expect(result[1]!.isMain).toBe(false)
	})

	it('respects explicit isMain flag', () => {
		const images: ProductImageInput[] = [
			{ key: 'img1.jpg', url: '', order: 0, isMain: false },
			{ key: 'img2.jpg', url: '', order: 1, isMain: true },
		]
		const result = normalizeProductImagesForWrite(images)
		const main = result.find(i => i.key === 'img2.jpg')
		expect(main?.isMain).toBe(true)
	})

	it('deduplicates images by key', () => {
		const images: ProductImageInput[] = [
			{ key: 'img1.jpg', url: '', order: 0, isMain: false },
			{ key: 'img1.jpg', url: '', order: 1, isMain: false },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result).toHaveLength(1)
	})

	it('resets order to sequential 0-based index', () => {
		const images: ProductImageInput[] = [
			{ key: 'img1.jpg', url: '', order: 5, isMain: false },
			{ key: 'img2.jpg', url: '', order: 10, isMain: false },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result[0]!.order).toBe(0)
		expect(result[1]!.order).toBe(1)
	})

	it('trims originalName', () => {
		const images: ProductImageInput[] = [
			{
				key: 'img1.jpg',
				url: '',
				order: 0,
				isMain: false,
				originalName: '  photo.jpg  ',
			},
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result[0]!.originalName).toBe('photo.jpg')
	})

	it('sets null for empty originalName', () => {
		const images: ProductImageInput[] = [
			{ key: 'img1.jpg', url: '', order: 0, isMain: false, originalName: '' },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result[0]!.originalName).toBeNull()
	})

	it('skips images with empty keys', () => {
		const images: ProductImageInput[] = [
			{ key: '', url: '', order: 0, isMain: false },
			{ key: 'img1.jpg', url: '', order: 1, isMain: false },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result).toHaveLength(1)
		expect(result[0]!.key).toBe('img1.jpg')
	})

	it('generates proxy url for storage keys', () => {
		const images: ProductImageInput[] = [
			{ key: 'products/img.jpg', url: '', order: 0, isMain: false },
		]
		const result = normalizeProductImagesForWrite(images)
		expect(result[0]!.url).toBe('/api/storage/file?key=products%2Fimg.jpg')
	})
})
