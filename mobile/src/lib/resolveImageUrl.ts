function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function normalizeImageCandidate(value: string): string {
	let normalized = value.trim()

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

		if (/^https?:\/\//i.test(normalized)) {
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
				// keep as-is
			}
		}

		break
	}

	return normalized
}

export function resolveImageUrl(
	imageUrl: string | null | undefined,
	apiUrl: string,
) {
	if (!imageUrl) return null
	const normalized = normalizeImageCandidate(imageUrl)
	if (normalized.startsWith('http')) return normalized
	if (normalized.startsWith('/')) return `${apiUrl}${normalized}`
	return `${apiUrl}/api/storage/file?key=${encodeURIComponent(normalized)}`
}