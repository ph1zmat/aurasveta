export interface FaqSchemaItem {
	question: string
	answer: string
}

export interface FaqSectionLike {
	type?: string
	config?: unknown
}

function normalizeFaqItem(item: unknown): FaqSchemaItem | null {
	if (!item || typeof item !== 'object') return null

	const question =
		typeof (item as { question?: unknown }).question === 'string'
			? (item as { question: string }).question.trim()
			: ''
	const answer =
		typeof (item as { answer?: unknown }).answer === 'string'
			? (item as { answer: string }).answer.trim()
			: ''

	if (!question || !answer) return null

	return { question, answer }
}

export function extractFaqItemsFromSections(
	sections: FaqSectionLike[],
): FaqSchemaItem[] {
	return sections.flatMap(section => {
		if (section.type !== 'faq' || !section.config || typeof section.config !== 'object') {
			return []
		}

		const items = (section.config as { items?: unknown }).items
		if (!Array.isArray(items)) return []

		return items
			.map(normalizeFaqItem)
			.filter((item): item is FaqSchemaItem => item !== null)
	})
}

/**
 * Генерирует JSON-LD объект `FAQPage` из массива пар вопрос/ответ.
 * Возвращает `null`, если нет ни одной валидной пары (SEO-CLAIM-035 / E6).
 *
 * HTML-теги не экранируются — Google принимает HTML в `text`,
 * но текст не должен содержать разметки форм или JS.
 */
export function buildFaqSchema(
	items: FaqSchemaItem[],
): Record<string, unknown> | null {
	const valid = items
		.map(normalizeFaqItem)
		.filter((item): item is FaqSchemaItem => item !== null)
	if (valid.length === 0) return null

	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: valid.map(item => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer,
			},
		})),
	}
}
