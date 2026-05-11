import { describe, expect, it } from 'vitest'
import { detectCannibalizationCandidates } from '@/lib/seo/domain/cannibalization'

describe('seo cannibalization detection', () => {
	it('находит кандидата при query с двумя конкурирующими URL', () => {
		const result = detectCannibalizationCandidates({
			signals: [
				{
					query: 'люстра aurora',
					url: 'https://aurasveta.by/product/lustra-aurora',
					impressions: 900,
					clicks: 14,
					ctr: 0.0155,
					position: 12.4,
				},
				{
					query: 'люстра aurora',
					url: 'https://aurasveta.by/catalog/potolochnye-svetilniki',
					impressions: 730,
					clicks: 9,
					ctr: 0.0123,
					position: 14.2,
				},
			],
			minImpressions: 100,
			maxPosition: 25,
			limit: 10,
		})

		expect(result).toHaveLength(1)
		expect(result[0]?.query).toBe('люстра aurora')
		expect(result[0]?.urls.length).toBe(2)
		expect(['high', 'medium']).toContain(result[0]?.confidence)
	})

	it('не возвращает кандидатов, если у запроса только один URL', () => {
		const result = detectCannibalizationCandidates({
			signals: [
				{
					query: 'доставка',
					url: 'https://aurasveta.by/pages/delivery',
					impressions: 300,
					clicks: 40,
					ctr: 0.133,
					position: 3.1,
				},
			],
			minImpressions: 100,
			maxPosition: 25,
			limit: 10,
		})

		expect(result).toEqual([])
	})
})
