import type { SnippetSuggestionItem } from './snippet-suggestions'
import type { SeoTargetType } from '@/shared/types/seo'

export type AiSnippetDraft = {
	targetType: SeoTargetType
	targetId: string
	suggestedTitle: string
	suggestedDescription: string
	confidence: number
	notes: string[]
}

function truncate(input: string, max: number) {
	const normalized = input.trim().replace(/\s+/g, ' ')
	if (normalized.length <= max) return normalized
	return `${normalized.slice(0, max - 1).trim()}…`
}

export function mergeHybridSnippetSuggestion(args: {
	rule: SnippetSuggestionItem
	aiDraft: AiSnippetDraft | null
}) {
	const { rule, aiDraft } = args
	if (!aiDraft || aiDraft.confidence < 0.6) {
		return rule
	}

	const hasAiTitle = aiDraft.suggestedTitle.trim().length >= 20
	const hasAiDescription = aiDraft.suggestedDescription.trim().length >= 60

	if (!hasAiTitle && !hasAiDescription) {
		return rule
	}

	const reasons = [...rule.reasons]
	for (const note of aiDraft.notes) {
		reasons.push(`AI: ${note}`)
	}

	return {
		...rule,
		source: 'hybrid' as const,
		suggestedTitle: hasAiTitle ? truncate(aiDraft.suggestedTitle, 60) : rule.suggestedTitle,
		suggestedDescription: hasAiDescription
			? truncate(aiDraft.suggestedDescription, 155)
			: rule.suggestedDescription,
		reasons,
	}
}
