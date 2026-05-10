export interface FaqSchemaItem {
	question: string
	answer: string
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
	const valid = items.filter(
		i => i.question.trim().length > 0 && i.answer.trim().length > 0,
	)
	if (valid.length === 0) return null

	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: valid.map(item => ({
			'@type': 'Question',
			name: item.question.trim(),
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer.trim(),
			},
		})),
	}
}
