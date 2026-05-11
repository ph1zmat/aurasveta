const STORAGE_KEY = 'aura-tracking-session'

function createTrackingId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}

	const fallback = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
	return fallback
}

/**
 * Returns a persistent session ID for anonymous tracking (views, search queries).
 * Stored in localStorage. Does NOT use jotai to avoid provider dependency.
 */
export function getTrackingSessionId(): string {
	if (typeof window === 'undefined') return ''

	try {
		let id = localStorage.getItem(STORAGE_KEY)
		if (!id) {
			id = createTrackingId()
			localStorage.setItem(STORAGE_KEY, id)
		}
		return id
	} catch {
		return createTrackingId()
	}
}
