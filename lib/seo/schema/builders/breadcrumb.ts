const BASE_URL = 'https://aurasveta.by'

export interface BreadcrumbItem {
	name: string
	href?: string
}

/**
 * Генерирует JSON-LD объект `BreadcrumbList`.
 * Чистая функция без JSX — используется серверными компонентами.
 */
export function buildBreadcrumbSchema(
	items: BreadcrumbItem[],
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
		})),
	}
}
