import type { SeoTargetType } from '@/shared/types/seo'

export type StaleContentSignal = {
	targetType: SeoTargetType
	targetId: string
	entityName: string
	url: string
	currentImpressions: number
	previousImpressions: number
	currentCtr: number
	previousCtr: number
	currentPosition: number
	daysSinceContentUpdate: number
}

export type StaleContentQueueItem = {
	targetType: SeoTargetType
	targetId: string
	entityName: string
	url: string
	priority: 'P1' | 'P2'
	daysSinceContentUpdate: number
	impressionsGrowthPct: number
	ctrDropPct: number
	currentImpressions: number
	currentPosition: number
	reasons: string[]
}

function round(value: number, digits = 2) {
	const factor = 10 ** digits
	return Math.round(value * factor) / factor
}

function calcGrowthPct(current: number, previous: number) {
	if (previous <= 0) return current > 0 ? 100 : 0
	return ((current - previous) / previous) * 100
}

function calcCtrDropPct(current: number, previous: number) {
	if (previous <= 0) return 0
	return ((previous - current) / previous) * 100
}

export function buildStaleContentQueue(args: {
	signals: StaleContentSignal[]
	minAgeDays: number
	minImpressions: number
	minImpressionsGrowthPct: number
	minCtrDropPct: number
	minWeakPosition: number
	limit: number
}) {
	const items: StaleContentQueueItem[] = []

	for (const signal of args.signals) {
		const impressionsGrowthPct = calcGrowthPct(
			signal.currentImpressions,
			signal.previousImpressions,
		)
		const ctrDropPct = calcCtrDropPct(signal.currentCtr, signal.previousCtr)

		const staleByAge = signal.daysSinceContentUpdate >= args.minAgeDays
		const enoughImpressions = signal.currentImpressions >= args.minImpressions
		const hasGrowth = impressionsGrowthPct >= args.minImpressionsGrowthPct
		const hasCtrDrop = ctrDropPct >= args.minCtrDropPct
		const weakPosition = signal.currentPosition >= args.minWeakPosition

		if (!staleByAge || !enoughImpressions || !hasGrowth || !hasCtrDrop || !weakPosition) {
			continue
		}

		const reasons = [
			`Контент не обновлялся ${signal.daysSinceContentUpdate} дн.`,
			`Показы растут (+${round(impressionsGrowthPct)}%)`,
			`CTR падает (${round(ctrDropPct)}%)`,
			`Позиция остаётся слабой (${round(signal.currentPosition, 1)})`,
		]

		const priority: 'P1' | 'P2' =
			impressionsGrowthPct >= args.minImpressionsGrowthPct * 2 &&
			ctrDropPct >= args.minCtrDropPct * 1.5
				? 'P1'
				: 'P2'

		items.push({
			targetType: signal.targetType,
			targetId: signal.targetId,
			entityName: signal.entityName,
			url: signal.url,
			priority,
			daysSinceContentUpdate: signal.daysSinceContentUpdate,
			impressionsGrowthPct: round(impressionsGrowthPct),
			ctrDropPct: round(ctrDropPct),
			currentImpressions: signal.currentImpressions,
			currentPosition: round(signal.currentPosition, 1),
			reasons,
		})
	}

	return items
		.sort((a, b) => {
			if (a.priority !== b.priority) return a.priority === 'P1' ? -1 : 1
			return b.currentImpressions - a.currentImpressions
		})
		.slice(0, args.limit)
}
