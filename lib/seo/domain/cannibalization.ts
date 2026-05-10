export type QueryUrlSignal = {
	query: string
	url: string
	impressions: number
	clicks: number
	ctr: number
	position: number
}

export type CannibalizationCandidate = {
	query: string
	urls: Array<{
		url: string
		impressions: number
		clicks: number
		ctr: number
		position: number
	}>
	totalImpressions: number
	confidence: 'high' | 'medium'
	reasons: string[]
}

function normalizeQuery(query: string) {
	return query
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
}

function round(value: number, precision = 3) {
	const factor = Math.pow(10, precision)
	return Math.round(value * factor) / factor
}

export function detectCannibalizationCandidates(input: {
	signals: QueryUrlSignal[]
	minImpressions: number
	maxPosition: number
	limit: number
}) {
	const grouped = new Map<string, QueryUrlSignal[]>()

	for (const signal of input.signals) {
		const query = normalizeQuery(signal.query)
		if (!query) continue
		if (signal.impressions < input.minImpressions) continue
		if (signal.position > input.maxPosition) continue

		const list = grouped.get(query) ?? []
		list.push(signal)
		grouped.set(query, list)
	}

	const candidates: CannibalizationCandidate[] = []

	for (const [query, list] of grouped.entries()) {
		const byUrl = new Map<string, QueryUrlSignal>()

		for (const signal of list) {
			const existing = byUrl.get(signal.url)
			if (!existing) {
				byUrl.set(signal.url, { ...signal })
				continue
			}
			byUrl.set(signal.url, {
				...existing,
				impressions: existing.impressions + signal.impressions,
				clicks: existing.clicks + signal.clicks,
				ctr:
					existing.impressions + signal.impressions > 0
						? (existing.clicks + signal.clicks) / (existing.impressions + signal.impressions)
						: 0,
				position:
					existing.impressions + signal.impressions > 0
						? (existing.position * existing.impressions + signal.position * signal.impressions) /
							(existing.impressions + signal.impressions)
						: signal.position,
			})
		}

		const urls = [...byUrl.values()].sort((a, b) => b.impressions - a.impressions)
		if (urls.length < 2) continue

		const leader = urls[0]
		const runnerUp = urls[1]
		const totalImpressions = urls.reduce((sum, item) => sum + item.impressions, 0)
		const topShare = leader.impressions / totalImpressions
		const runnerUpShare = runnerUp.impressions / totalImpressions
		const shareGap = Math.abs(topShare - runnerUpShare)

		const reasons: string[] = [
			'Запрос ранжируется по нескольким URL одновременно',
		]

		if (shareGap < 0.25) {
			reasons.push('Распределение показов между топ-2 URL слишком близкое')
		}
		if (runnerUp.position <= leader.position + 4) {
			reasons.push('Позиции конкурирующих URL сопоставимы')
		}
		if (leader.ctr < 0.03 || runnerUp.ctr < 0.03) {
			reasons.push('Есть потенциал роста CTR за счёт консолидации релевантности')
		}

		const confidence: 'high' | 'medium' =
			shareGap < 0.2 && totalImpressions >= input.minImpressions * 3 ? 'high' : 'medium'

		candidates.push({
			query,
			urls: urls.map(item => ({
				url: item.url,
				impressions: item.impressions,
				clicks: item.clicks,
				ctr: round(item.ctr, 4),
				position: round(item.position, 2),
			})),
			totalImpressions,
			confidence,
			reasons,
		})
	}

	return candidates
		.sort((a, b) => {
			if (a.confidence !== b.confidence) {
				return a.confidence === 'high' ? -1 : 1
			}
			return b.totalImpressions - a.totalImpressions
		})
		.slice(0, input.limit)
}
