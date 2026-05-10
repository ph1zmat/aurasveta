export type WeeklyTriageZoneKey = 'product' | 'category' | 'page' | 'tech'

export type WeeklyTriageSeoRow = {
	targetType: 'product' | 'category' | 'page'
	title: string | null
	description: string | null
	ogImage: string | null
	canonicalUrl: string | null
	noIndex: boolean
}

export type WeeklyTriageZone = {
	key: WeeklyTriageZoneKey
	label: string
	ownerKey: WeeklyTriageZoneKey
	p1Count: number
	p2Count: number
	total: number
	severity: 'healthy' | 'warning' | 'critical'
	recommendedAction: string
	note: string
}

function classifyRow(row: WeeklyTriageSeoRow) {
	if (!row.title || row.noIndex) return 'P1' as const
	if (!row.description || !row.ogImage) return 'P2' as const
	if (row.canonicalUrl && !/^https?:\/\//i.test(row.canonicalUrl)) return 'P2' as const
	return 'OK' as const
}

function zoneMeta(key: WeeklyTriageZoneKey) {
	if (key === 'product') {
		return {
			label: 'Товары',
			action: 'Bulk-fix только по safe subset: strict/safe-overwrite для пустых meta полей.',
			note: 'Коммерческий контент: сначала title/noindex, затем description и OG.',
		}
	}
	if (key === 'category') {
		return {
			label: 'Категории',
			action: 'Проверить title/canonical и запускать bulk-fix на ограниченном наборе категорий.',
			note: 'Категории влияют на листинги и перелинковку, приоритет выше CMS-страниц.',
		}
	}
	if (key === 'page') {
		return {
			label: 'CMS страницы',
			action: 'Ручной triage через SEO editor и точечный bulk-fix только для пустых описаний.',
			note: 'Для контентных страниц предпочтительнее ручная проверка смыслов и сниппетов.',
		}
	}
	return {
		label: 'Tech SEO',
		action: 'Сначала устранить duplicate canonical и ошибки bulk-операций, затем повторить audit.',
		note: 'Tech-зона не меняет сниппеты напрямую, но блокирует стабильность индексации.',
	}
}

function buildSeverity(p1Count: number, p2Count: number) {
	if (p1Count > 0) return 'critical' as const
	if (p2Count > 0) return 'warning' as const
	return 'healthy' as const
}

export function buildWeeklyTriageBoard(args: {
	seoRows: WeeklyTriageSeoRow[]
	duplicateCanonicalCount: number
	weeklyBulkErrors: number
}) {
	const grouped = {
		product: { p1Count: 0, p2Count: 0 },
		category: { p1Count: 0, p2Count: 0 },
		page: { p1Count: 0, p2Count: 0 },
	}

	for (const row of args.seoRows) {
		const priority = classifyRow(row)
		if (priority === 'P1') grouped[row.targetType].p1Count++
		if (priority === 'P2') grouped[row.targetType].p2Count++
	}

	const techP1 = args.duplicateCanonicalCount > 0 ? args.duplicateCanonicalCount : 0
	const techP2 = args.weeklyBulkErrors

	const zones: WeeklyTriageZone[] = (['product', 'category', 'page', 'tech'] as const).map(
		(key) => {
			const meta = zoneMeta(key)
			const p1Count = key === 'tech' ? techP1 : grouped[key].p1Count
			const p2Count = key === 'tech' ? techP2 : grouped[key].p2Count

			return {
				key,
				label: meta.label,
				ownerKey: key,
				p1Count,
				p2Count,
				total: p1Count + p2Count,
				severity: buildSeverity(p1Count, p2Count),
				recommendedAction: meta.action,
				note: meta.note,
			}
		},
	)

	return {
		zones,
		summary: {
			totalP1: zones.reduce((sum, zone) => sum + zone.p1Count, 0),
			totalP2: zones.reduce((sum, zone) => sum + zone.p2Count, 0),
			totalZonesWithWork: zones.filter(zone => zone.total > 0).length,
		},
	}
}
