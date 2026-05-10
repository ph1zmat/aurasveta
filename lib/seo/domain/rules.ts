/** Правила длины заголовков и описаний для SEO-аудита */
export const SEO_RULES = {
	title: {
		min: 30,
		max: 60,
	},
	description: {
		min: 70,
		max: 160,
	},
} as const

/** Канонический домен продакшена */
export const CANONICAL_BASE_URL = 'https://aurasveta.by' as const

/** Максимальный размер батча для bulk-операций */
export const BULK_BATCH_SIZE = 100 as const

/** Количество примеров в dry-run ответе */
export const BULK_SAMPLE_SIZE = 10 as const

/**
 * Query-параметры, которые должны быть удалены при нормализации canonical URL.
 * Источник: стандартные трекинговые параметры GA4 / Meta / GCLID.
 */
export const TRACKED_QUERY_PARAMS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'fbclid',
	'gclid',
	'ref',
	'yclid',
] as const
