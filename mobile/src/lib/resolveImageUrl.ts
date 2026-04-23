export function resolveImageUrl(
	imageUrl: string | null | undefined,
	apiUrl: string,
) {
	if (!imageUrl) return null
	if (imageUrl.startsWith('http')) return imageUrl
	if (imageUrl.startsWith('/')) return `${apiUrl}${imageUrl}`
	return `${apiUrl}/api/storage/file?key=${encodeURIComponent(imageUrl)}`
}