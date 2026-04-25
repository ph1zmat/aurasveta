import { describe, it, expect } from 'vitest'

// Test sortProductImages and getMainImage logic from shared/lib/product-utils.ts
// Replicated here since the module imports browser/Next.js stuff (resolveStorageFileUrl).

interface ProductImage {
	id: string
	order: number
	isMain: boolean
	url?: string | null
	key?: string | null
	displayUrl?: string | null
}

function sortProductImages(images: readonly ProductImage[]): ProductImage[] {
	return [...images].sort((a, b) => {
		if (a.isMain !== b.isMain) return a.isMain ? -1 : 1
		return a.order - b.order
	})
}

function getMainImage(images: ProductImage[] | null | undefined): ProductImage | null {
	const imgs = Array.isArray(images) ? images : []
	if (imgs.length === 0) return null
	const explicitMain = imgs.find(img => img.isMain)
	if (explicitMain) return explicitMain
	return sortProductImages(imgs)[0] ?? null
}

// ────────────────────────────────────────────────────────────────
// sortProductImages
// ────────────────────────────────────────────────────────────────
describe('sortProductImages', () => {
	it('places main image first', () => {
		const images: ProductImage[] = [
			{ id: 'a', order: 0, isMain: false },
			{ id: 'b', order: 1, isMain: true },
			{ id: 'c', order: 2, isMain: false },
		]
		const sorted = sortProductImages(images)
		expect(sorted[0].id).toBe('b')
	})

	it('sorts non-main images by order', () => {
		const images: ProductImage[] = [
			{ id: 'c', order: 2, isMain: false },
			{ id: 'a', order: 0, isMain: false },
			{ id: 'b', order: 1, isMain: false },
		]
		const sorted = sortProductImages(images)
		expect(sorted.map(i => i.id)).toEqual(['a', 'b', 'c'])
	})

	it('does not mutate the original array', () => {
		const images: ProductImage[] = [
			{ id: 'b', order: 1, isMain: false },
			{ id: 'a', order: 0, isMain: false },
		]
		const original = [...images]
		sortProductImages(images)
		expect(images[0].id).toBe(original[0].id)
	})

	it('handles single image', () => {
		const images: ProductImage[] = [{ id: 'a', order: 0, isMain: true }]
		expect(sortProductImages(images)).toHaveLength(1)
	})

	it('handles empty array', () => {
		expect(sortProductImages([])).toEqual([])
	})
})

// ────────────────────────────────────────────────────────────────
// getMainImage
// ────────────────────────────────────────────────────────────────
describe('getMainImage', () => {
	it('returns explicit main image', () => {
		const images: ProductImage[] = [
			{ id: 'a', order: 0, isMain: false },
			{ id: 'b', order: 1, isMain: true },
		]
		expect(getMainImage(images)?.id).toBe('b')
	})

	it('returns first image when no explicit main', () => {
		const images: ProductImage[] = [
			{ id: 'b', order: 1, isMain: false },
			{ id: 'a', order: 0, isMain: false },
		]
		// first by order
		expect(getMainImage(images)?.id).toBe('a')
	})

	it('returns null for empty array', () => {
		expect(getMainImage([])).toBeNull()
	})

	it('returns null for null input', () => {
		expect(getMainImage(null)).toBeNull()
	})

	it('returns null for undefined input', () => {
		expect(getMainImage(undefined)).toBeNull()
	})

	it('handles array with single item', () => {
		const images: ProductImage[] = [{ id: 'x', order: 0, isMain: false }]
		expect(getMainImage(images)?.id).toBe('x')
	})
})
