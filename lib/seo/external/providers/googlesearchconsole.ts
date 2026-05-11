import type { ExternalFetchInput, ExternalFetchResult } from '../types'

export async function fetchGoogleSearchConsoleSignals(
	input: ExternalFetchInput,
): Promise<ExternalFetchResult> {
	const sample = [
		{
			targetType: 'product' as const,
			targetId: 'gsc-p-1',
			url: 'https://aurasveta.by/product/lustra-aurora',
			impressions: 1200,
			clicks: 14,
			ctr: 1.16,
			position: 19.4,
			coverageErrors: 0,
			indexingStatus: 'indexed' as const,
		},
		{
			targetType: 'category' as const,
			targetId: 'gsc-c-1',
			url: 'https://aurasveta.by/catalog/potolochnye-svetilniki',
			impressions: 840,
			clicks: 4,
			ctr: 0.48,
			position: 24.8,
			coverageErrors: 0,
			indexingStatus: 'excluded' as const,
		},
		{
			targetType: 'page' as const,
			targetId: 'gsc-page-1',
			url: 'https://aurasveta.by/pages/delivery',
			impressions: 130,
			clicks: 1,
			ctr: 0.77,
			position: 33.2,
			coverageErrors: 1,
			indexingStatus: 'error' as const,
		},
	]

	return {
		provider: 'google-search-console',
		source: 'stub',
		signals: sample.slice(0, input.limit),
	}
}
