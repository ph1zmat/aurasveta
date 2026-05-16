import type { PublicStoreSettings } from '@/lib/utils/getpublicstoresettings'
import { CANONICAL_BASE_URL } from '@/lib/seo/domain/rules'
import { resolveSiteAssetUrl } from '@/lib/seo/sitemetadata'

function asCleanString(value: string | null | undefined): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

function isValidPublicHttpUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

function normalizePhone(phone: string): string {
	const digits = phone.replace(/\D/g, '')
	if (digits.startsWith('375')) return `+${digits}`
	if (digits.startsWith('80')) return `+375${digits.slice(2)}`
	if (digits.length === 9) return `+375${digits}`
	return phone
}

/**
 * Генерирует JSON-LD объект `Organization` на основе публичных настроек магазина.
 * Используется в корневом layout для глобального schema.
 */
export function buildOrganizationSchema(
	settings: PublicStoreSettings | null,
): Record<string, unknown> {
	const logoUrl = resolveSiteAssetUrl(settings?.logoUrl)
	const socialLinks =
		settings?.socialLinks
			?.map(link => asCleanString(link.url))
			.filter((url): url is string => Boolean(url && isValidPublicHttpUrl(url))) ?? []
	const email = asCleanString(settings?.email)
	const address = asCleanString(settings?.address)
	const city = asCleanString(settings?.city)
	const postalCode = asCleanString(settings?.postalCode)
	const contactPhones = [asCleanString(settings?.phone), asCleanString(settings?.additionalPhone)].filter(
		(phone): phone is string => Boolean(phone),
	)

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${CANONICAL_BASE_URL}/#organization`,
		name: 'Аура Света',
		url: CANONICAL_BASE_URL,
		priceRange: '$$',
		hasOfferCatalog: {
			'@type': 'OfferCatalog',
			name: 'Каталог светильников',
			url: `${CANONICAL_BASE_URL}/catalog`,
		},
		...(logoUrl
			? { logo: { '@type': 'ImageObject', url: logoUrl } }
			: {}),
		...(email ? { email } : {}),
		...(contactPhones.length > 0
			? {
					telephone: normalizePhone(contactPhones[0]),
					contactPoint: contactPhones.map(phone => ({
						'@type': 'ContactPoint',
						telephone: normalizePhone(phone),
						contactType: 'customer service',
						areaServed: 'BY',
						availableLanguage: ['Russian', 'Belarusian'],
						hoursAvailable: {
							'@type': 'OpeningHoursSpecification',
							dayOfWeek: [
								'Monday',
								'Tuesday',
								'Wednesday',
								'Thursday',
								'Friday',
								'Saturday',
							],
							opens: '09:00',
							closes: '18:00',
						},
					})),
				}
			: {}),
		...(address
			? {
					address: {
						'@type': 'PostalAddress',
						streetAddress: address,
						addressLocality: city ?? 'Мозырь',
						...(postalCode
							? { postalCode }
							: {}),
						addressCountry: 'BY',
					},
				}
			: {}),
		...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
	}
}
