export type ExternalIndexingStatus = 'indexed' | 'excluded' | 'error' | 'unknown'

export type ExternalSignalInput = {
	targetType: 'product' | 'category' | 'page'
	targetId: string
	url: string
	impressions: number
	clicks: number
	ctr: number
	position: number
	coverageErrors: number
	indexingStatus: ExternalIndexingStatus
}

export type ExternalPriority = 'P1' | 'P2' | 'P3' | 'P4'

export type ExternalTriageResult = {
	targetType: ExternalSignalInput['targetType']
	targetId: string
	url: string
	priority: ExternalPriority
	reasons: string[]
	signal: {
		impressions: number
		clicks: number
		ctr: number
		position: number
		coverageErrors: number
		indexingStatus: ExternalIndexingStatus
	}
}

export function prioritizeExternalSignal(item: ExternalSignalInput): ExternalTriageResult {
	const reasons: string[] = []

	if (item.coverageErrors > 0) {
		reasons.push(`coverage errors: ${item.coverageErrors}`)
	}

	if (item.indexingStatus === 'error') {
		reasons.push('indexing status: error')
	}

	if (item.indexingStatus === 'excluded') {
		reasons.push('indexing status: excluded')
	}

	if (item.impressions >= 300 && item.ctr < 0.01) {
		reasons.push('high impressions with low CTR')
	}

	if (item.impressions >= 200 && item.position > 20) {
		reasons.push('high impressions with weak average position')
	}

	if (item.impressions >= 50 && item.position > 30) {
		reasons.push('stale ranking opportunity')
	}

	let priority: ExternalPriority = 'P4'

	if (item.coverageErrors > 0 || item.indexingStatus === 'error') {
		priority = 'P1'
	} else if (item.indexingStatus === 'excluded' || (item.impressions >= 300 && item.ctr < 0.01)) {
		priority = 'P2'
	} else if ((item.impressions >= 200 && item.position > 20) || (item.impressions >= 50 && item.position > 30)) {
		priority = 'P3'
	}

	return {
		targetType: item.targetType,
		targetId: item.targetId,
		url: item.url,
		priority,
		reasons: reasons.length > 0 ? reasons : ['no critical external signals'],
		signal: {
			impressions: item.impressions,
			clicks: item.clicks,
			ctr: item.ctr,
			position: item.position,
			coverageErrors: item.coverageErrors,
			indexingStatus: item.indexingStatus,
		},
	}
}

export function summarizeExternalTriage(items: ExternalTriageResult[]) {
	const byPriority: Record<ExternalPriority, number> = {
		P1: 0,
		P2: 0,
		P3: 0,
		P4: 0,
	}

	for (const item of items) {
		byPriority[item.priority]++
	}

	return byPriority
}
