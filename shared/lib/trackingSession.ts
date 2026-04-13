const STORAGE_KEY = 'aura-tracking-session'

/**
 * Returns a persistent session ID for anonymous tracking (views, search queries).
 * Stored in localStorage. Does NOT use jotai to avoid provider dependency.
 */
export function getTrackingSessionId(): string {
	if (typeof window === 'undefined') return ''

	try {
		let id = localStorage.getItem(STORAGE_KEY)
		if (!id) {
			id = crypto.randomUUID()
			localStorage.setItem(STORAGE_KEY, id)
		}
		return id
	} catch {
		return crypto.randomUUID()
	}
}
