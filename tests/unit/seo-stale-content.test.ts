import { describe, expect, it } from 'vitest'
import { buildStaleContentQueue } from '@/lib/seo/domain/stale-content'

describe('seo stale content queue', () => {
	it('включает stale кандидата при росте показов и падении CTR', () => {
		const result = buildStaleContentQueue({
			signals: [
				{
					targetType: 'product',
					targetId: 'p1',
					entityName: 'Люстра Aurora',
					url: 'https://aurasveta.by/product/lustra-aurora',
					currentImpressions: 900,
					previousImpressions: 400,
					currentCtr: 0.011,
					previousCtr: 0.026,
					currentPosition: 15.3,
					daysSinceContentUpdate: 80,
				},
			],
			minAgeDays: 30,
			minImpressions: 100,
			minImpressionsGrowthPct: 20,
			minCtrDropPct: 15,
			minWeakPosition: 10,
			limit: 10,
		})

		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			targetType: 'product',
			targetId: 'p1',
			priority: expect.stringMatching(/P1|P2/),
		})
	})

	it('не включает свежий контент без просадки CTR', () => {
		const result = buildStaleContentQueue({
			signals: [
				{
					targetType: 'page',
					targetId: 'pg1',
					entityName: 'Доставка',
					url: 'https://aurasveta.by/pages/delivery',
					currentImpressions: 500,
					previousImpressions: 450,
					currentCtr: 0.051,
					previousCtr: 0.052,
					currentPosition: 6.3,
					daysSinceContentUpdate: 8,
				},
			],
			minAgeDays: 30,
			minImpressions: 100,
			minImpressionsGrowthPct: 20,
			minCtrDropPct: 15,
			minWeakPosition: 10,
			limit: 10,
		})

		expect(result).toEqual([])
	})
})
