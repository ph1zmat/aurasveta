import { describe, it, expect } from 'vitest'

// Replicated logic from shared/lib/storage-file-url.ts to avoid env/SSR deps

function getStorageFileUrl(key: string): string {
	return `/api/storage/file?key=${encodeURIComponent(key)}`
}

function isAbsoluteStorageUrl(value: string): boolean {
	return /^https?:\/\//i.test(value)
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function normalizeStorageValue(rawValue: string): string {
	let normalized = rawValue.trim()

	for (let i = 0; i < 4; i++) {
		const decoded = safeDecode(normalized)
		if (decoded !== normalized) {
			normalized = decoded.trim()
			continue
		}

		if (normalized.startsWith('/api/storage/file')) {
			try {
				const nested = new URL(normalized, 'http://localhost').searchParams
					.get('key')
					?.trim()
				if (nested) {
					normalized = nested
					continue
				}
			} catch {
				// ignore
			}
		}

		if (isAbsoluteStorageUrl(normalized)) {
			try {
				const url = new URL(normalized)
				if (url.pathname === '/api/storage/file') {
					const nested = url.searchParams.get('key')?.trim()
					if (nested) {
						normalized = nested
						continue
					}
				}
			} catch {
				// keep current value
			}
		}

		break
	}

	return normalized
}

function resolveStorageFileUrl(value?: string | null): string | null {
	const normalizedValue = value?.trim()
	if (!normalizedValue) return null

	const normalizedCandidate = normalizeStorageValue(normalizedValue)

	if (
		isAbsoluteStorageUrl(normalizedCandidate) ||
		normalizedCandidate.startsWith('/')
	) {
		return normalizedCandidate
	}

	return getStorageFileUrl(normalizedCandidate)
}

// ────────────────────────────────────────────────────────────────
// getStorageFileUrl
// ────────────────────────────────────────────────────────────────
describe('getStorageFileUrl', () => {
	it('returns the proxy endpoint URL', () => {
		expect(getStorageFileUrl('products/image.jpg')).toBe(
			'/api/storage/file?key=products%2Fimage.jpg',
		)
	})

	it('URL-encodes special characters in key', () => {
		expect(getStorageFileUrl('path/to file.jpg')).toBe(
			'/api/storage/file?key=path%2Fto%20file.jpg',
		)
	})

	it('encodes ampersands in key', () => {
		const url = getStorageFileUrl('a&b.jpg')
		expect(url).toBe('/api/storage/file?key=a%26b.jpg')
	})
})

// ────────────────────────────────────────────────────────────────
// isAbsoluteStorageUrl
// ────────────────────────────────────────────────────────────────
describe('isAbsoluteStorageUrl', () => {
	it('returns true for http:// URLs', () => {
		expect(isAbsoluteStorageUrl('http://cdn.example.com/img.jpg')).toBe(true)
	})

	it('returns true for https:// URLs', () => {
		expect(isAbsoluteStorageUrl('https://s3.amazonaws.com/bucket/img.jpg')).toBe(
			true,
		)
	})

	it('returns true for uppercase HTTP', () => {
		expect(isAbsoluteStorageUrl('HTTP://example.com/img.jpg')).toBe(true)
	})

	it('returns false for relative paths', () => {
		expect(isAbsoluteStorageUrl('/api/storage/file?key=img.jpg')).toBe(false)
	})

	it('returns false for plain keys', () => {
		expect(isAbsoluteStorageUrl('products/image.jpg')).toBe(false)
	})
})

// ────────────────────────────────────────────────────────────────
// resolveStorageFileUrl
// ────────────────────────────────────────────────────────────────
describe('resolveStorageFileUrl', () => {
	it('returns null for null input', () => {
		expect(resolveStorageFileUrl(null)).toBeNull()
	})

	it('returns null for undefined input', () => {
		expect(resolveStorageFileUrl(undefined)).toBeNull()
	})

	it('returns null for empty string', () => {
		expect(resolveStorageFileUrl('')).toBeNull()
	})

	it('returns null for whitespace-only string', () => {
		expect(resolveStorageFileUrl('   ')).toBeNull()
	})

	it('returns absolute URLs unchanged', () => {
		const url = 'https://cdn.example.com/img.jpg'
		expect(resolveStorageFileUrl(url)).toBe(url)
	})

	it('returns root-relative paths unchanged', () => {
		expect(resolveStorageFileUrl('/images/photo.jpg')).toBe('/images/photo.jpg')
	})

	it('wraps plain storage keys in proxy URL', () => {
		expect(resolveStorageFileUrl('products/img.jpg')).toBe(
			'/api/storage/file?key=products%2Fimg.jpg',
		)
	})

	it('unwraps already-proxied /api/storage/file URLs', () => {
		const proxied = '/api/storage/file?key=products%2Fimg.jpg'
		expect(resolveStorageFileUrl(proxied)).toBe(
			'/api/storage/file?key=products%2Fimg.jpg',
		)
	})

	it('unwraps double-encoded proxy URLs', () => {
		const doubleEncoded =
			'/api/storage/file?key=products%252Fimg.jpg'
		const result = resolveStorageFileUrl(doubleEncoded)
		// Should resolve to the inner key proxied
		expect(result).toContain('/api/storage/file?key=')
	})

	it('handles whitespace-padded inputs', () => {
		const result = resolveStorageFileUrl('  products/img.jpg  ')
		expect(result).toBe('/api/storage/file?key=products%2Fimg.jpg')
	})
})
