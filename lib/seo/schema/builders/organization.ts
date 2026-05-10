import type { PublicStoreSettings } from '@/lib/utils/getPublicStoreSettings'

const BASE_URL = 'https://aurasveta.by'

/**
 * Генерирует JSON-LD объект `Organization` на основе публичных настроек магазина.
 * Используется в корневом layout для глобального schema.
 */
export function buildOrganizationSchema(
	settings: PublicStoreSettings | null,
): Record<string, unknown> {
	const logoUrl = settings?.logoUrl
		? settings.logoUrl.startsWith('http')
			? settings.logoUrl
			: `${BASE_URL}${settings.logoUrl}`
		: undefined

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${BASE_URL}/#organization`,
		name: 'Аура Света',
		url: BASE_URL,
		...(logoUrl
			? { logo: { '@type': 'ImageObject', url: logoUrl } }
			: {}),
		...(settings?.phone
			? {
					telephone: settings.phone,
					contactPoint: [
						{
							'@type': 'ContactPoint',
							telephone: settings.phone,
							contactType: 'customer service',
							areaServed: 'BY',
							availableLanguage: 'Russian',
						},
					],
				}
			: {}),
		...(settings?.address
			? {
					address: {
						'@type': 'PostalAddress',
						streetAddress: settings.address,
						addressLocality: settings.city ?? 'Мозырь',
						addressCountry: 'BY',
					},
				}
			: {}),
		sameAs:
			settings?.socialLinks
				?.filter(l => l.url.trim().length > 0)
				.map(l => l.url) ?? [],
	}
}
