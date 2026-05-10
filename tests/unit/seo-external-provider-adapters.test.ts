import { describe, expect, it } from 'vitest'
import { normalizeCtr, normalizeExternalSignal } from '@/lib/seo/external/normalize'
import { fetchExternalSignals } from '@/lib/seo/external'

describe('seo external provider adapters', () => {
	it('normalizeCtr поддерживает долю и проценты', () => {
		expect(normalizeCtr(0.12)).toBe(0.12)
		expect(normalizeCtr(12)).toBe(0.12)
		expect(normalizeCtr(-5)).toBe(0)
		expect(normalizeCtr(250)).toBe(1)
	})

	it('normalizeExternalSignal ограничивает некорректные поля', () => {
		const normalized = normalizeExternalSignal({
			targetType: 'product',
			targetId: 'id-1',
			url: 'https://aurasveta.by/product/id-1',
			impressions: 10.8,
			clicks: 99,
			ctr: 35,
			position: -2,
			coverageErrors: -4,
			indexingStatus: 'indexed',
		})

		expect(normalized.impressions).toBe(11)
		expect(normalized.clicks).toBe(11)
		expect(normalized.ctr).toBe(0.35)
		expect(normalized.position).toBe(0)
		expect(normalized.coverageErrors).toBe(0)
	})

	it('fetchExternalSignals возвращает нормализованный stub для GSC', async () => {
		const result = await fetchExternalSignals('google-search-console', { limit: 2 })
		expect(result.provider).toBe('google-search-console')
		expect(result.source).toBe('stub')
		expect(result.signals.length).toBe(2)
		expect(result.signals.every(s => s.ctr >= 0 && s.ctr <= 1)).toBe(true)
	})

	it('fetchExternalSignals возвращает нормализованный stub для Яндекс', async () => {
		const result = await fetchExternalSignals('yandex-webmaster', { limit: 3 })
		expect(result.provider).toBe('yandex-webmaster')
		expect(result.source).toBe('stub')
		expect(result.signals.length).toBe(3)
		expect(result.signals.every(s => s.impressions >= s.clicks)).toBe(true)
	})
})
