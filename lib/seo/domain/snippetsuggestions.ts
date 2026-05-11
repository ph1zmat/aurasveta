import type { SeoTargetType } from '@/shared/types/seo'

export type SnippetSuggestionRisk = 'low' | 'medium'

export type SnippetSuggestionItem = {
	targetType: SeoTargetType
	targetId: string
	entityName: string
	url: string
	currentTitle: string | null
	currentDescription: string | null
	suggestedTitle: string
	suggestedDescription: string
	reasons: string[]
	risk: SnippetSuggestionRisk
	source: 'rule' | 'hybrid'
	priority: 'P1' | 'P2' | 'P3'
	scoring?: {
		strategy: 'rule-scored'
		score: number
		variant: 'base' | 'commercial' | 'delivery'
		breakdown: {
			length: number
			ctrOpportunity: number
			clarity: number
			uniqueness: number
			riskPenalty: number
		}
	}
	externalContext: {
		impressions: number
		ctr: number
		position: number
	} | null
}

type SnippetSuggestionInput = {
	targetType: SeoTargetType
	targetId: string
	entityName: string
	url: string
	currentTitle: string | null
	currentDescription: string | null
	brand?: string | null
	entityDescription?: string | null
	noIndex: boolean
	priority: 'P1' | 'P2' | 'P3'
	externalContext?: {
		impressions: number
		ctr: number
		position: number
	} | null
}

function stripHtml(input: string | null | undefined) {
	return (input ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateAtWord(input: string, maxLength: number) {
	const normalized = input.replace(/\s+/g, ' ').trim()
	if (normalized.length <= maxLength) return normalized
	const sliced = normalized.slice(0, maxLength + 1)
	const lastSpace = sliced.lastIndexOf(' ')
	return `${(lastSpace > 20 ? sliced.slice(0, lastSpace) : normalized.slice(0, maxLength)).trim()}…`
}

function buildSuggestedTitle(input: SnippetSuggestionInput) {
	if (input.targetType === 'product') {
		return truncateAtWord(
			`${input.entityName}${input.brand ? ` ${input.brand}` : ''} — купить в Аура Света`,
			60,
		)
	}

	if (input.targetType === 'category') {
		return truncateAtWord(`${input.entityName} — каталог и цены | Аура Света`, 60)
	}

	return truncateAtWord(`${input.entityName} | Аура Света`, 60)
}

function buildSuggestedDescription(input: SnippetSuggestionInput) {
	const entityExcerpt = stripHtml(input.entityDescription)
	const excerpt = entityExcerpt
		? truncateAtWord(entityExcerpt, 90)
		: input.targetType === 'product'
			? `Характеристики, актуальные цены и фото${input.brand ? ` ${input.brand}` : ''}.`
			: input.targetType === 'category'
				? 'Подборка моделей, цены, фото и удобная навигация по каталогу.'
				: 'Полезная информация, условия и ответы на частые вопросы.'

	if (input.targetType === 'product') {
		return truncateAtWord(
			`${input.entityName}${input.brand ? ` ${input.brand}` : ''} в интернет-магазине Аура Света. ${excerpt} Доставка по Беларуси.`,
			155,
		)
	}

	if (input.targetType === 'category') {
		return truncateAtWord(
			`${input.entityName} в каталоге Аура Света: ${excerpt} Заказывайте с доставкой по Беларуси.`,
			155,
		)
	}

	return truncateAtWord(
		`${input.entityName} — ${excerpt} Актуальная информация на сайте Аура Света.`,
		155,
	)
}

export function buildSnippetSuggestion(input: SnippetSuggestionInput): SnippetSuggestionItem {
	const reasons: string[] = []

	if (!input.currentTitle) reasons.push('Отсутствует meta title — рекомендация закрывает P1 пробел')
	else if (input.currentTitle.length < 30 || input.currentTitle.length > 60) {
		reasons.push('Текущий title вне рекомендуемой длины 30–60 символов')
	}

	if (!input.currentDescription) {
		reasons.push('Отсутствует meta description — рекомендация повышает полноту сниппета')
	} else if (input.currentDescription.length < 70 || input.currentDescription.length > 160) {
		reasons.push('Текущий description вне рекомендуемой длины 70–160 символов')
	}

	if (input.noIndex) {
		reasons.push('Страница закрыта noindex — перед применением нужна ручная проверка индексации')
	}

	if (input.externalContext) {
		if (input.externalContext.impressions >= 200 && input.externalContext.ctr < 0.02) {
			reasons.push('Есть показы при низком CTR — сниппет стоит усилить под кликабельность')
		}
		if (input.externalContext.position > 8 && input.externalContext.position <= 20) {
			reasons.push('Есть rank opportunity: URL уже близко к топу, улучшение сниппета может помочь')
		}
	}

	const risk: SnippetSuggestionRisk =
		!input.currentTitle || !input.currentDescription ? 'low' : 'medium'

	return {
		targetType: input.targetType,
		targetId: input.targetId,
		entityName: input.entityName,
		url: input.url,
		currentTitle: input.currentTitle,
		currentDescription: input.currentDescription,
		suggestedTitle: buildSuggestedTitle(input),
		suggestedDescription: buildSuggestedDescription(input),
		reasons,
		risk,
		source: 'rule',
		priority: input.priority,
		externalContext: input.externalContext ?? null,
	}
}
