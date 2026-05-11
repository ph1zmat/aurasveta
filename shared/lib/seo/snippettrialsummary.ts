export type SnippetTrialSummaryItem = {
	mode: string | null
	outcome: 'promote' | 'keep-testing' | 'reject' | string | null
	deltaCtrPct: number | null
}

export type SnippetTrialSummary = {
	total: number
	promote: number
	keepTesting: number
	reject: number
	avgDeltaCtrPct: number | null
	bestMode: string | null
	bestModeAvgDeltaCtr: number | null
}

export function buildSnippetTrialSummary(items: SnippetTrialSummaryItem[]): SnippetTrialSummary {
	const total = items.length
	const promote = items.filter(item => item.outcome === 'promote').length
	const keepTesting = items.filter(item => item.outcome === 'keep-testing').length
	const reject = items.filter(item => item.outcome === 'reject').length

	const deltas = items
		.map(item => item.deltaCtrPct)
		.filter((value): value is number => typeof value === 'number')

	const avgDeltaCtrPct =
		deltas.length > 0 ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : null

	const promotedByMode = new Map<string, number[]>()
	for (const item of items) {
		if (item.outcome !== 'promote') continue
		if (typeof item.deltaCtrPct !== 'number') continue
		if (!item.mode) continue
		const bucket = promotedByMode.get(item.mode) ?? []
		bucket.push(item.deltaCtrPct)
		promotedByMode.set(item.mode, bucket)
	}

	let bestMode: string | null = null
	let bestModeAvgDeltaCtr: number | null = null
	for (const [mode, values] of promotedByMode.entries()) {
		if (values.length === 0) continue
		const avg = values.reduce((sum, value) => sum + value, 0) / values.length
		if (bestModeAvgDeltaCtr === null || avg > bestModeAvgDeltaCtr) {
			bestMode = mode
			bestModeAvgDeltaCtr = avg
		}
	}

	return {
		total,
		promote,
		keepTesting,
		reject,
		avgDeltaCtrPct,
		bestMode,
		bestModeAvgDeltaCtr,
	}
}
