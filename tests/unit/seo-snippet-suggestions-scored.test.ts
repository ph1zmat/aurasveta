import { describe, expect, it } from 'vitest'
import { buildSnippetSuggestion } from '@/lib/seo/domain/snippet-suggestions'
import { rankRuleScoredSnippetSuggestion } from '@/lib/seo/domain/snippet-suggestions-scored'

describe('seo rule-scored snippet suggestions', () => {
	it('добавляет scoring breakdown и reason при выборе лучшего варианта', () => {
		const rule = buildSnippetSuggestion({
			targetType: 'product',
			targetId: 'p1',
			entityName: 'Люстра Aurora',
			url: 'https://aurasveta.by/product/aurora',
			currentTitle: null,
			currentDescription: null,
			brand: 'Aura',
			entityDescription: 'Современная люстра с мягким светом для гостиной и спальни.',
			noIndex: false,
			priority: 'P1',
			externalContext: {
				impressions: 420,
				ctr: 0.013,
				position: 11.2,
			},
		})

		const scored = rankRuleScoredSnippetSuggestion(rule)

		expect(scored.scoring?.strategy).toBe('rule-scored')
		expect(scored.scoring?.score).toBeGreaterThan(0)
		expect(scored.scoring?.breakdown.length).toBeGreaterThanOrEqual(0)
		expect(scored.reasons.join(' ')).toContain('Rule-scored: выбран вариант')
		expect(scored.suggestedTitle.length).toBeLessThanOrEqual(60)
		expect(scored.suggestedDescription.length).toBeLessThanOrEqual(155)
	})

	it('работает детерминированно для одинакового входа', () => {
		const rule = buildSnippetSuggestion({
			targetType: 'category',
			targetId: 'c1',
			entityName: 'Подвесные светильники',
			url: 'https://aurasveta.by/catalog/podvesnye-svetilniki',
			currentTitle: 'Подвесные светильники',
			currentDescription: 'Короткое описание',
			entityDescription: 'Большой выбор подвесных моделей, бренды и фильтры по стилю.',
			noIndex: false,
			priority: 'P2',
			externalContext: {
				impressions: 280,
				ctr: 0.02,
				position: 9.9,
			},
		})

		const first = rankRuleScoredSnippetSuggestion(rule)
		const second = rankRuleScoredSnippetSuggestion(rule)

		expect(first.suggestedTitle).toBe(second.suggestedTitle)
		expect(first.suggestedDescription).toBe(second.suggestedDescription)
		expect(first.scoring).toEqual(second.scoring)
	})
})
