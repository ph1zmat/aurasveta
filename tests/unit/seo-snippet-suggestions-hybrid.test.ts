import { describe, expect, it } from 'vitest'
import { mergeHybridSnippetSuggestion, type AiSnippetDraft } from '@/lib/seo/domain/snippet-suggestions-hybrid'
import type { SnippetSuggestionItem } from '@/lib/seo/domain/snippet-suggestions'

function makeRuleSuggestion(): SnippetSuggestionItem {
	return {
		targetType: 'product',
		targetId: 'p1',
		entityName: 'Люстра Aurora',
		url: 'https://aurasveta.by/product/aurora',
		currentTitle: null,
		currentDescription: null,
		suggestedTitle: 'Люстра Aurora Aura — купить в Аура Света',
		suggestedDescription:
			'Люстра Aurora Aura в интернет-магазине Аура Света. Современная подвесная модель для гостиной. Доставка по Беларуси.',
		reasons: ['Отсутствует meta title — рекомендация закрывает P1 пробел'],
		risk: 'low',
		source: 'rule',
		priority: 'P1',
		externalContext: {
			impressions: 320,
			ctr: 0.012,
			position: 10.8,
		},
	}
}

function makeAiDraft(overrides?: Partial<AiSnippetDraft>): AiSnippetDraft {
	return {
		targetType: 'product',
		targetId: 'p1',
		suggestedTitle: 'Люстра Aurora для гостиной и спальни — выгодная цена в Аура Света',
		suggestedDescription:
			'Люстра Aurora с актуальной ценой и фото в каталоге Аура Света. Подберите подходящую модель для интерьера и оформите заказ с доставкой по Беларуси.',
		confidence: 0.78,
		notes: ['Смягчили формулировку и добавили коммерческий интент'],
		...overrides,
	}
}

describe('seo hybrid snippet suggestions', () => {
	it('применяет AI-драфт при достаточной confidence и помечает source=hybrid', () => {
		const merged = mergeHybridSnippetSuggestion({
			rule: makeRuleSuggestion(),
			aiDraft: makeAiDraft(),
		})

		expect(merged.source).toBe('hybrid')
		expect(merged.suggestedTitle).toContain('Люстра Aurora')
		expect(merged.suggestedDescription).toContain('Беларуси')
		expect(merged.reasons.join(' ')).toContain('AI:')
		expect(merged.suggestedTitle.length).toBeLessThanOrEqual(60)
		expect(merged.suggestedDescription.length).toBeLessThanOrEqual(155)
	})

	it('не применяет AI-драфт при низкой confidence', () => {
		const rule = makeRuleSuggestion()
		const merged = mergeHybridSnippetSuggestion({
			rule,
			aiDraft: makeAiDraft({ confidence: 0.45 }),
		})

		expect(merged).toEqual(rule)
	})
})
