const BASE_URL = 'https://aurasveta.by'

export interface BreadcrumbItem {
	name: string
	href?: string
}

function normalizeBreadcrumbHref(href: string): string | null {
	const trimmed = href.trim()
	if (!trimmed) return null

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed
	}

	if (trimmed.startsWith('/')) {
		return `${BASE_URL}${trimmed}`
	}

	return `${BASE_URL}/${trimmed}`
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
		itemListElement: items.map((item, index) => {
			const normalizedHref =
				typeof item.href === 'string' ? normalizeBreadcrumbHref(item.href) : null

			return {
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				...(normalizedHref ? { item: normalizedHref } : {}),
			}
		}),
	}
}
