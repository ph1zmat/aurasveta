import type { SeoTargetType } from '@/shared/types/seo'

export type AiSnippetDraftInput = {
	targetType: SeoTargetType
	targetId: string
	entityName: string
	currentTitle: string | null
	currentDescription: string | null
}

export type AiSnippetProvider = 'stub-gpt'

export async function fetchAiSnippetDrafts(args: {
	provider: AiSnippetProvider
	items: AiSnippetDraftInput[]
	limit: number
}) {
	const drafts = args.items.slice(0, args.limit).map(item => {
		const baseTitle = item.currentTitle?.trim() || `${item.entityName} — обновлённый сниппет`
		const baseDescription =
			item.currentDescription?.trim() ||
			`${item.entityName} в Аура Света: актуальные характеристики, цены и полезная информация для выбора.`

		return {
			targetType: item.targetType,
			targetId: item.targetId,
			suggestedTitle: `${baseTitle.replace(/\s+/g, ' ').slice(0, 48)} | Аура Света`,
			suggestedDescription: `${baseDescription.replace(/\s+/g, ' ').slice(0, 128)} Быстрая доставка по Беларуси.`,
			confidence: 0.72,
			notes: [
				'Переформулировка заголовка под коммерческий интент',
				'Добавлен более явный value-проп в description',
			],
		}
	})

	return {
		provider: args.provider,
		source: 'stub' as const,
		drafts,
	}
}
