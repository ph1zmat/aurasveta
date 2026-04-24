import 'server-only'

import { getFileUrl } from '@/lib/storage'
import { getStorageFileUrl } from '@/shared/lib/storage-file-url'
import type { StorageImageAsset } from '@/shared/types/storage'

const STORAGE_KEY_PATTERN = /^(products|uploads|public)\//
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, '') ?? ''
const STORAGE_PRESIGN_TTL = Math.max(
	60,
	parseInt(process.env.STORAGE_PRESIGN_TTL ?? '3600', 10) || 3600,
)

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function normalizeStorageCandidate(value: string): string {
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
				// keep value as-is
			}
		}

		break
	}

	return normalized
}

export function isStorageKey(value: string): boolean {
	return STORAGE_KEY_PATTERN.test(value)
}

export function isLegacyImageValue(value: string): boolean {
	return /^https?:\/\//i.test(value) || value.startsWith('/')
}

function computeExpiresAt(): string {
	return new Date(Date.now() + STORAGE_PRESIGN_TTL * 1000).toISOString()
}

export async function createStorageImageAsset(
	value?: string | null,
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<StorageImageAsset | null> {
	const normalizedValue = value?.trim()
	if (!normalizedValue) return null
	const normalizedCandidate = normalizeStorageCandidate(normalizedValue)

	const cacheKey = `${options?.preferProxy ? 'proxy' : 'display'}:${normalizedCandidate}`
	const cached = options?.cache?.get(cacheKey)
	if (cached !== undefined) {
		return cached
	}

	let result: StorageImageAsset | null = null

	if (
		isLegacyImageValue(normalizedCandidate) ||
		!isStorageKey(normalizedCandidate)
	) {
		result = {
			key: isStorageKey(normalizedCandidate) ? normalizedCandidate : null,
			url: normalizedCandidate,
			source: isStorageKey(normalizedCandidate) ? 'proxy' : 'legacy',
			expiresAt: null,
		}
	} else if (options?.preferProxy) {
		result = {
			key: normalizedCandidate,
			url: getStorageFileUrl(normalizedCandidate),
			source: 'proxy',
			expiresAt: null,
		}
	} else {
		try {
			result = {
				key: normalizedCandidate,
				url: await getFileUrl(normalizedCandidate),
				source: STORAGE_PUBLIC_URL ? 'public' : 'signed',
				expiresAt: STORAGE_PUBLIC_URL ? null : computeExpiresAt(),
			}
		} catch {
			result = {
				key: normalizedCandidate,
				url: getStorageFileUrl(normalizedCandidate),
				source: 'proxy',
				expiresAt: null,
			}
		}
	}

	options?.cache?.set(cacheKey, result)
	return result
}

export async function createStorageImageAssetFromCandidates(
	values: Array<string | null | undefined>,
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<StorageImageAsset | null> {
	for (const value of values) {
		const asset = await createStorageImageAsset(value, options)
		if (asset) return asset
	}

	return null
}

export async function withResolvedImageAsset<
	T extends {
		image?: string | null
		imagePath?: string | null
	},
>(
	item: T,
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<T & { imageUrl: string | null; imageAsset: StorageImageAsset | null }> {
	const imageAsset = await createStorageImageAssetFromCandidates(
		[item.imagePath, item.image],
		options,
	)

	return {
		...item,
		imageUrl: imageAsset?.url ?? null,
		imageAsset,
	}
}

export async function withResolvedProductImageAsset<
	T extends {
		key?: string | null
		url?: string | null
	},
>(
	image: T,
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<T & { displayUrl: string; imageAsset: StorageImageAsset | null }> {
	const imageAsset = await createStorageImageAssetFromCandidates(
		[image.key, image.url],
		options,
	)

	return {
		...image,
		displayUrl: imageAsset?.url ?? image.url?.trim() ?? image.key?.trim() ?? '',
		imageAsset,
	}
}

export async function withResolvedProductImageAssets<
	T extends {
		key?: string | null
		url?: string | null
		isMain?: boolean | null
		order?: number | null
	},
>(
	images: readonly T[],
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<Array<T & { displayUrl: string; imageAsset: StorageImageAsset | null }>> {
	return Promise.all(
		images.map(image => withResolvedProductImageAsset(image, options)),
	)
}

export async function withResolvedProductImages<
	T extends {
		images?: ReadonlyArray<{
			key?: string | null
			url?: string | null
			isMain?: boolean | null
			order?: number | null
		}> | null
	},
>(
	product: T,
	options?: {
		cache?: Map<string, StorageImageAsset | null>
		preferProxy?: boolean
	},
): Promise<
	T & {
		images: Array<
			NonNullable<T['images']>[number] & {
				displayUrl: string
				imageAsset: StorageImageAsset | null
			}
		>
		imageUrl: string | null
		imageAsset: StorageImageAsset | null
	}
> {
	const images = await withResolvedProductImageAssets(product.images ?? [], options)
	const mainImage =
		images.find(image => image.isMain) ??
		[...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] ??
		null

	return {
		...product,
		images,
		imageUrl: mainImage?.displayUrl ?? null,
		imageAsset: mainImage?.imageAsset ?? null,
	}
}