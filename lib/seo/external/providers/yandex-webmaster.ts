import type { ExternalFetchInput, ExternalFetchResult } from '../types'

export async function fetchYandexWebmasterSignals(
	input: ExternalFetchInput,
): Promise<ExternalFetchResult> {
	const sample = [
		{
			targetType: 'product' as const,
			targetId: 'ywm-p-1',
			url: 'https://aurasveta.by/product/bra-classic',
			impressions: 520,
			clicks: 3,
			ctr: 0.57,
			position: 27.6,
			coverageErrors: 0,
			indexingStatus: 'indexed' as const,
		},
		{
			targetType: 'category' as const,
			targetId: 'ywm-c-1',
			url: 'https://aurasveta.by/catalog/bra',
			impressions: 420,
			clicks: 2,
			ctr: 0.48,
			position: 22.9,
			coverageErrors: 0,
			indexingStatus: 'excluded' as const,
		},
		{
			targetType: 'page' as const,
			targetId: 'ywm-page-1',
			url: 'https://aurasveta.by/pages/guarantee',
			impressions: 60,
			clicks: 0,
			ctr: 0,
			position: 38.7,
			coverageErrors: 2,
			indexingStatus: 'error' as const,
		},
	]

	return {
		provider: 'yandex-webmaster',
		source: 'stub',
		signals: sample.slice(0, input.limit),
	}
}
