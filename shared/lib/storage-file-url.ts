export function getStorageFileUrl(key: string): string {
	return `/api/storage/file?key=${encodeURIComponent(key)}`
}

export function isAbsoluteStorageUrl(value: string): boolean {
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
				const nested = new URL(normalized, 'http://localhost')
					.searchParams.get('key')
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

export function resolveStorageFileUrl(value?: string | null): string | null {
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
