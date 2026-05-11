import { describe, expect, it } from 'vitest'
import { prioritizeExternalSignal, summarizeExternalTriage } from '@/lib/seo/domain/externaltriage'

describe('seo external triage', () => {
	it('даёт P1 при coverage errors', () => {
		const result = prioritizeExternalSignal({
			targetType: 'product',
			targetId: 'p1',
			url: 'https://aurasveta.by/product/lamp',
			impressions: 20,
			clicks: 1,
			ctr: 0.05,
			position: 9,
			coverageErrors: 2,
			indexingStatus: 'indexed',
		})

		expect(result.priority).toBe('P1')
		expect(result.reasons.join(' ')).toContain('coverage errors')
	})

	it('даёт P2 при excluded и высоких показах с низким CTR', () => {
		const result = prioritizeExternalSignal({
			targetType: 'category',
			targetId: 'c1',
			url: 'https://aurasveta.by/catalog/chandeliers',
			impressions: 450,
			clicks: 2,
			ctr: 0.004,
			position: 17,
			coverageErrors: 0,
			indexingStatus: 'excluded',
		})

		expect(result.priority).toBe('P2')
		expect(result.reasons.some(r => r.includes('excluded'))).toBe(true)
	})

	it('даёт P3 для rank-opportunity без критики', () => {
		const result = prioritizeExternalSignal({
			targetType: 'page',
			targetId: 'pg1',
			url: 'https://aurasveta.by/pages/delivery',
			impressions: 240,
			clicks: 5,
			ctr: 0.02,
			position: 24,
			coverageErrors: 0,
			indexingStatus: 'indexed',
		})

		expect(result.priority).toBe('P3')
	})

	it('summary считает количество по приоритетам', () => {
		const summary = summarizeExternalTriage([
			{ priority: 'P1' } as ReturnType<typeof prioritizeExternalSignal>,
			{ priority: 'P2' } as ReturnType<typeof prioritizeExternalSignal>,
			{ priority: 'P2' } as ReturnType<typeof prioritizeExternalSignal>,
			{ priority: 'P4' } as ReturnType<typeof prioritizeExternalSignal>,
		])

		expect(summary).toEqual({ P1: 1, P2: 2, P3: 0, P4: 1 })
	})
})
