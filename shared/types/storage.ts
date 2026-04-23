export type StorageImageSource = 'signed' | 'public' | 'proxy' | 'legacy'

export interface StorageImageAsset {
	key: string | null
	url: string
	source: StorageImageSource
	expiresAt: string | null
}