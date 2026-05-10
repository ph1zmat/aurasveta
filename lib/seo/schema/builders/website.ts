const BASE_URL = 'https://aurasveta.by'

/**
 * Генерирует JSON-LD объект `WebSite` + `SearchAction`.
 * Позволяет Google показывать Sitelinks Searchbox в SERP (SEO-CLAIM-033).
 */
export function buildWebSiteSchema(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${BASE_URL}/#website`,
		name: 'Аура Света',
		url: BASE_URL,
		inLanguage: 'ru-RU',
		publisher: { '@id': `${BASE_URL}/#organization` },
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
			},
			'query-input': 'required name=search_term_string',
		},
	}
}
