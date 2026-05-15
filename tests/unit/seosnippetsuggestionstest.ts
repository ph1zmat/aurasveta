import { describe, expect, it } from 'vitest'
import { buildSnippetSuggestion } from '@/lib/seo/domain/snippetsuggestions'

describe('seo snippet suggestions', () => {
	it('строит low-risk рекомендацию для пустого product сниппета', () => {
		const result = buildSnippetSuggestion({
			targetType: 'product',
			targetId: 'p1',
			entityName: 'Люстра Aurora',
			url: 'https://aurasveta.by/product/aurora',
			currentTitle: null,
			currentDescription: null,
			brand: 'Aura',
			entityDescription: 'Современная подвесная люстра для гостиной и спальни.',
			noIndex: false,
			priority: 'P1',
			externalContext: {
				impressions: 320,
				ctr: 0.01,
				position: 11.4,
			},
		})

		expect(result.risk).toBe('low')
		expect(result.priority).toBe('P1')
		expect(result.suggestedTitle).toContain('Люстра Aurora')
		expect(result.suggestedDescription).toContain('Аура Света')
		expect(result.reasons.join(' ')).toContain('низком CTR')
	})

	it('ставит medium risk при переработке уже заполненного сниппета', () => {
		const result = buildSnippetSuggestion({
			targetType: 'page',
			targetId: 'pg1',
			entityName: 'Доставка',
			url: 'https://aurasveta.by/delivery',
			currentTitle: 'Доставка по Беларуси и России очень длинный title который выходит далеко за лимит',
			currentDescription: 'Коротко',
			entityDescription: 'Подробные условия доставки, сроки, стоимость и полезные уточнения по регионам.',
			noIndex: false,
			priority: 'P2',
		})

		expect(result.risk).toBe('medium')
		expect(result.reasons.length).toBeGreaterThan(0)
		expect(result.suggestedTitle.length).toBeLessThanOrEqual(61)
		expect(result.suggestedDescription.length).toBeLessThanOrEqual(156)
	})
})