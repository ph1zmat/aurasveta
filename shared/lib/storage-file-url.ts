export function getStorageFileUrl(key: string): string {
	return `/api/storage/file?key=${encodeURIComponent(key)}`
}

export function isAbsoluteStorageUrl(value: string): boolean {
	return /^https?:\/\//i.test(value)
}

export function resolveStorageFileUrl(value?: string | null): string | null {
	const normalizedValue = value?.trim()
	if (!normalizedValue) return null

	if (
		isAbsoluteStorageUrl(normalizedValue) ||
		normalizedValue.startsWith('/')
	) {
		return normalizedValue
	}

	return getStorageFileUrl(normalizedValue)
}
