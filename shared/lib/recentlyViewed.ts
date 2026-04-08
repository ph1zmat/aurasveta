const STORAGE_KEY = 'recentlyViewed'
const MAX_ITEMS = 20

export function addRecentlyViewed(productId: string) {
	if (typeof window === 'undefined') return
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		const ids: string[] = raw ? JSON.parse(raw) : []
		const filtered = ids.filter(id => id !== productId)
		filtered.unshift(productId)
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)))
	} catch {
		// localStorage unavailable
	}
}

export function getRecentlyViewedIds(): string[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}
