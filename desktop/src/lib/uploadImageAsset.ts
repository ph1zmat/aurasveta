import { getApiUrl, getToken } from './store'

export interface UploadedImageAsset {
	key: string
	originalName: string | null
}

export async function uploadImageAsset(file: File): Promise<UploadedImageAsset> {
	const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
	const token = await getToken()

	if (!token) {
		throw new Error('Нет токена сессии')
	}

	const formData = new FormData()
	formData.append('file', file)

	const response = await fetch(`${apiUrl}/api/upload`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	})

	if (!response.ok) {
		const body = await response.json().catch(() => null)
		throw new Error(body?.error ?? `Upload failed: ${response.status}`)
	}

	const payload = await response.json()
	const key =
		(payload.key as string | undefined) ?? (payload.path as string | undefined)

	if (!key) {
		throw new Error('Upload: path missing')
	}

	return {
		key,
		originalName: (payload.originalName as string | undefined) ?? null,
	}
}