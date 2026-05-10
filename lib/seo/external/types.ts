import type { SeoTargetType } from '@/shared/types/seo'

export type ExternalProvider = 'google-search-console' | 'yandex-webmaster'

export type ExternalRawSignal = {
	targetType: SeoTargetType
	targetId: string
	url: string
	impressions: number
	clicks: number
	/**
	 * CTR может приходить как доля (0.034) или процент (3.4)
	 */
	ctr: number
	position: number
	coverageErrors: number
	indexingStatus: 'indexed' | 'excluded' | 'error' | 'unknown'
}

export type ExternalFetchInput = {
	dateFrom?: string
	dateTo?: string
	limit: number
}

export type ExternalFetchResult = {
	provider: ExternalProvider
	source: 'stub'
	signals: ExternalRawSignal[]
}
