import type { ExternalProvider } from './types'
import type { SeoTargetType } from '@/shared/types/seo'

export type ExternalStaleSignal = {
	targetType: SeoTargetType
	targetId: string
	url: string
	currentImpressions: number
	previousImpressions: number
	currentCtr: number
	previousCtr: number
	currentPosition: number
}

export async function fetchExternalStaleSignals(args: {
	provider: ExternalProvider
	limit: number
	dateFrom?: string
	dateTo?: string
}) {
	const googleSample: ExternalStaleSignal[] = [
		{
			targetType: 'product',
			targetId: 'p1',
			url: 'https://aurasveta.by/product/lustra-aurora',
			currentImpressions: 980,
			previousImpressions: 560,
			currentCtr: 0.012,
			previousCtr: 0.026,
			currentPosition: 14.2,
		},
		{
			targetType: 'category',
			targetId: 'c1',
			url: 'https://aurasveta.by/catalog/potolochnye-svetilniki',
			currentImpressions: 870,
			previousImpressions: 520,
			currentCtr: 0.009,
			previousCtr: 0.019,
			currentPosition: 16.7,
		},
		{
			targetType: 'page',
			targetId: 'pg1',
			url: 'https://aurasveta.by/pages/delivery',
			currentImpressions: 260,
			previousImpressions: 180,
			currentCtr: 0.062,
			previousCtr: 0.071,
			currentPosition: 5.1,
		},
	]

	const yandexSample: ExternalStaleSignal[] = [
		{
			targetType: 'product',
			targetId: 'p1',
			url: 'https://aurasveta.by/product/lustra-aurora',
			currentImpressions: 720,
			previousImpressions: 410,
			currentCtr: 0.010,
			previousCtr: 0.021,
			currentPosition: 15.8,
		},
		{
			targetType: 'category',
			targetId: 'c1',
			url: 'https://aurasveta.by/catalog/bra',
			currentImpressions: 690,
			previousImpressions: 430,
			currentCtr: 0.011,
			previousCtr: 0.020,
			currentPosition: 14.9,
		},
		{
			targetType: 'page',
			targetId: 'pg1',
			url: 'https://aurasveta.by/pages/guarantee',
			currentImpressions: 190,
			previousImpressions: 160,
			currentCtr: 0.047,
			previousCtr: 0.052,
			currentPosition: 7.3,
		},
	]

	const signals = args.provider === 'google-search-console' ? googleSample : yandexSample

	return {
		provider: args.provider,
		source: 'stub' as const,
		signals: signals.slice(0, args.limit),
	}
}
