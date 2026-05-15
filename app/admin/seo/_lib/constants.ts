export const SEO_FILTERS = [
	'all',
	'missing-title',
	'missing-desc',
	'noindex',
] as const

export type SeoFilter = (typeof SEO_FILTERS)[number]

export const TARGET_TYPE_OPTIONS = ['product', 'category', 'page'] as const
export type SeoTargetType = (typeof TARGET_TYPE_OPTIONS)[number]

export const BULK_MODES = ['strict', 'safe-overwrite', 'force'] as const
export type BulkMode = (typeof BULK_MODES)[number]

export const BULK_UI_LIMIT = 100 as const

export const BULK_TARGET_LABELS: Record<SeoTargetType, string> = {
	product: 'Товары',
	category: 'Категории',
	page: 'Страницы',
}

export const BULK_MODE_LABELS: Record<BulkMode, string> = {
	strict: 'Строгий — только пустые поля',
	'safe-overwrite': 'Безопасный — без ручных правок',
	force: 'Полный — перезаписать всё',
}

export const FEATURES = {
	externalIntegrations: false,
	weeklyTriage: false,
	snippetTrials: false,
	cannibalization: false,
	staleContent: false,
} as const
