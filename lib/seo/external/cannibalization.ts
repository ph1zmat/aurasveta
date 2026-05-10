import type { ExternalProvider } from './types'

export type ExternalQueryUrlSignal = {
	query: string
	url: string
	impressions: number
	clicks: number
	ctr: number
	position: number
}

export async function fetchExternalQueryUrlSignals(args: {
	provider: ExternalProvider
	limit: number
	dateFrom?: string
	dateTo?: string
}) {
	const sampleGoogle: ExternalQueryUrlSignal[] = [
		{ query: 'люстра aurora', url: 'https://aurasveta.by/product/lustra-aurora', impressions: 980, clicks: 17, ctr: 0.0173, position: 12.1 },
		{ query: 'люстра aurora', url: 'https://aurasveta.by/catalog/potolochnye-svetilniki', impressions: 760, clicks: 8, ctr: 0.0105, position: 14.7 },
		{ query: 'бра классика', url: 'https://aurasveta.by/product/bra-classic', impressions: 520, clicks: 9, ctr: 0.0173, position: 10.4 },
		{ query: 'бра классика', url: 'https://aurasveta.by/catalog/bra', impressions: 430, clicks: 5, ctr: 0.0116, position: 12.8 },
		{ query: 'доставка аура света', url: 'https://aurasveta.by/pages/delivery', impressions: 240, clicks: 19, ctr: 0.0791, position: 3.4 },
	]

	const sampleYandex: ExternalQueryUrlSignal[] = [
		{ query: 'люстра aurora', url: 'https://aurasveta.by/product/lustra-aurora', impressions: 640, clicks: 10, ctr: 0.0156, position: 13.8 },
		{ query: 'люстра aurora', url: 'https://aurasveta.by/catalog/potolochnye-svetilniki', impressions: 510, clicks: 6, ctr: 0.0118, position: 16.3 },
		{ query: 'бра купить', url: 'https://aurasveta.by/catalog/bra', impressions: 700, clicks: 9, ctr: 0.0129, position: 11.6 },
		{ query: 'бра купить', url: 'https://aurasveta.by/product/bra-classic', impressions: 480, clicks: 5, ctr: 0.0104, position: 15.2 },
		{ query: 'оплата заказа', url: 'https://aurasveta.by/pages/payment', impressions: 170, clicks: 11, ctr: 0.0647, position: 4.2 },
	]

	const signals = args.provider === 'google-search-console' ? sampleGoogle : sampleYandex

	return {
		provider: args.provider,
		source: 'stub' as const,
		signals: signals.slice(0, args.limit),
	}
}
