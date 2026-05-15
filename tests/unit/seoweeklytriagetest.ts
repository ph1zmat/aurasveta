import { describe, expect, it } from 'vitest'
import { buildWeeklyTriageBoard } from '@/lib/seo/domain/weeklytriage'

describe('seo weekly triage', () => {
	it('раскладывает P1/P2 по зонам и учитывает tech-сигналы', () => {
		const result = buildWeeklyTriageBoard({
			seoRows: [
				{
					targetType: 'product',
					title: null,
					description: 'desc',
					ogImage: 'https://aurasveta.by/img/a.jpg',
					canonicalUrl: 'https://aurasveta.by/product/a',
					noIndex: false,
				},
				{
					targetType: 'category',
					title: 'Категория',
					description: null,
					ogImage: 'https://aurasveta.by/img/c.jpg',
					canonicalUrl: 'https://aurasveta.by/catalog/c',
					noIndex: false,
				},
				{
					targetType: 'page',
					title: 'Доставка',
					description: 'Описание',
					ogImage: 'https://aurasveta.by/img/p.jpg',
					canonicalUrl: 'https://aurasveta.by/delivery',
					noIndex: false,
				},
			],
			duplicateCanonicalCount: 2,
			weeklyBulkErrors: 1,
		})

		expect(result.summary).toEqual({
			totalP1: 3,
			totalP2: 2,
			totalZonesWithWork: 3,
		})

		const productZone = result.zones.find(zone => zone.key === 'product')
		const categoryZone = result.zones.find(zone => zone.key === 'category')
		const pageZone = result.zones.find(zone => zone.key === 'page')
		const techZone = result.zones.find(zone => zone.key === 'tech')

		expect(productZone).toMatchObject({ p1Count: 1, p2Count: 0, severity: 'critical' })
		expect(categoryZone).toMatchObject({ p1Count: 0, p2Count: 1, severity: 'warning' })
		expect(pageZone).toMatchObject({ p1Count: 0, p2Count: 0, severity: 'healthy' })
		expect(techZone).toMatchObject({ p1Count: 2, p2Count: 1, severity: 'critical' })
	})
})
