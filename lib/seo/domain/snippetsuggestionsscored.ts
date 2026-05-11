import type { SnippetSuggestionItem } from './snippetsuggestions'

type ScoreBreakdown = {
	length: number
	ctrOpportunity: number
	clarity: number
	uniqueness: number
	riskPenalty: number
}

type Candidate = {
	label: 'base' | 'commercial' | 'delivery'
	title: string
	description: string
}

function normalize(input: string) {
	return input.toLowerCase().replace(/\s+/g, ' ').trim()
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}

function countUniqueTokens(input: string) {
	const tokens = normalize(input)
		.split(' ')
		.filter(token => token.length > 2)
	return new Set(tokens).size
}

function scoreLength(title: string, description: string) {
	const titleDelta = Math.abs(56 - title.length)
	const descDelta = Math.abs(140 - description.length)
	const titleScore = clamp(35 - titleDelta, 0, 35)
	const descScore = clamp(30 - Math.round(descDelta / 2), 0, 30)
	return titleScore + descScore
}

function scoreCtrOpportunity(args: {
	item: SnippetSuggestionItem
	title: string
	description: string
}) {
	const text = normalize(`${args.title} ${args.description}`)
	const hasCommercialWords = /(купить|цена|в наличии|доставка|заказать)/.test(text)
	const external = args.item.externalContext
	if (!external) return hasCommercialWords ? 5 : 2

	if (external.impressions >= 200 && external.ctr < 0.02) {
		return hasCommercialWords ? 15 : 8
	}

	return hasCommercialWords ? 9 : 4
}

function scoreClarity(args: { title: string; description: string }) {
	const normalizedTitle = normalize(args.title)
	const normalizedDescription = normalize(args.description)
	let score = 8
	if (!/\|\s*аура света/.test(normalizedTitle) && !/аура света/.test(normalizedTitle)) {
		score -= 2
	}
	if (!/доставка/.test(normalizedDescription)) {
		score -= 2
	}
	if (args.description.length < 90) {
		score -= 2
	}
	return clamp(score, 0, 10)
}

function scoreUniqueness(args: {
	title: string
	description: string
	currentTitle: string | null
	currentDescription: string | null
}) {
	const current = `${args.currentTitle ?? ''} ${args.currentDescription ?? ''}`.trim()
	if (!current) return 8

	const currentTokens = countUniqueTokens(current)
	const candidateTokens = countUniqueTokens(`${args.title} ${args.description}`)
	const ratio = currentTokens > 0 ? candidateTokens / currentTokens : 1
	if (ratio >= 1.1) return 8
	if (ratio >= 0.9) return 6
	if (ratio >= 0.75) return 4
	return 2
}

function scoreCandidate(args: { item: SnippetSuggestionItem; candidate: Candidate }) {
	const length = scoreLength(args.candidate.title, args.candidate.description)
	const ctrOpportunity = scoreCtrOpportunity({
		item: args.item,
		title: args.candidate.title,
		description: args.candidate.description,
	})
	const clarity = scoreClarity({
		title: args.candidate.title,
		description: args.candidate.description,
	})
	const uniqueness = scoreUniqueness({
		title: args.candidate.title,
		description: args.candidate.description,
		currentTitle: args.item.currentTitle,
		currentDescription: args.item.currentDescription,
	})

	const riskPenalty = args.item.reasons.some(reason => reason.includes('noindex')) ? 8 : 0

	const score = clamp(length + ctrOpportunity + clarity + uniqueness - riskPenalty, 0, 100)

	return {
		score,
		breakdown: {
			length,
			ctrOpportunity,
			clarity,
			uniqueness,
			riskPenalty,
		} satisfies ScoreBreakdown,
	}
}

function buildCandidates(item: SnippetSuggestionItem): Candidate[] {
	const titleBase = item.suggestedTitle.replace(/\s+/g, ' ').trim()
	const descriptionBase = item.suggestedDescription.replace(/\s+/g, ' ').trim()

	const commercialTitle = titleBase.includes('| Аура Света')
		? titleBase.replace('| Аура Света', '— цена и наличие | Аура Света')
		: `${titleBase} — цена и наличие`

	const commercialDescription = descriptionBase.includes('Доставка по Беларуси')
		? descriptionBase
		: `${descriptionBase} Доставка по Беларуси.`

	const deliveryTitle = titleBase.includes('доставка')
		? titleBase
		: `${titleBase.replace(/\s*\|\s*Аура Света$/, '')} — доставка по Беларуси | Аура Света`

	const deliveryDescription = descriptionBase.includes('Быстрая доставка')
		? descriptionBase
		: `${descriptionBase} Быстрая доставка по Беларуси.`

	return [
		{ label: 'base', title: titleBase, description: descriptionBase },
		{ label: 'commercial', title: commercialTitle, description: commercialDescription },
		{ label: 'delivery', title: deliveryTitle, description: deliveryDescription },
	]
}

function truncate(input: string, max: number) {
	const normalized = input.trim().replace(/\s+/g, ' ')
	if (normalized.length <= max) return normalized
	return `${normalized.slice(0, max - 1).trim()}…`
}

export function rankRuleScoredSnippetSuggestion(item: SnippetSuggestionItem): SnippetSuggestionItem {
	const candidates = buildCandidates(item)

	const ranked = candidates
		.map(candidate => ({
			candidate,
			...scoreCandidate({ item, candidate }),
		}))
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score
			return a.candidate.label.localeCompare(b.candidate.label)
		})

	const best = ranked[0]
	if (!best) return item

	return {
		...item,
		suggestedTitle: truncate(best.candidate.title, 60),
		suggestedDescription: truncate(best.candidate.description, 155),
		reasons: [
			...item.reasons,
			`Rule-scored: выбран вариант ${best.candidate.label} (score ${best.score})`,
		],
		scoring: {
			strategy: 'rule-scored',
			score: best.score,
			variant: best.candidate.label,
			breakdown: best.breakdown,
		},
	}
}
