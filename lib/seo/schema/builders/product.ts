const BASE_URL = 'https://aurasveta.by'

export interface ProductSchemaInput {
	name: string
	description?: string | null
	price?: number | null
	images: string[]
	sku?: string | null
	brand?: string | null
	inStock: boolean
	rating?: number | null
	reviewsCount?: number
	url: string
}

/**
 * Генерирует JSON-LD объект `Product`.
 * Дублирует логику компонента `ProductStructuredData`, но как чистая функция.
 * Привязывает seller к `@id` Organization для связи schema-графа.
 */
export function buildProductSchema(
	input: ProductSchemaInput,
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: input.name,
		...(input.description ? { description: input.description } : {}),
		...(input.images.length > 0 ? { image: input.images } : {}),
		...(input.sku ? { sku: input.sku } : {}),
		...(input.brand
			? { brand: { '@type': 'Brand', name: input.brand } }
			: {}),
		...(input.price != null
			? {
					offers: {
						'@type': 'Offer',
						price: input.price.toFixed(2),
						priceCurrency: 'BYN',
						availability: input.inStock
							? 'https://schema.org/InStock'
							: 'https://schema.org/OutOfStock',
						itemCondition: 'https://schema.org/NewCondition',
						seller: {
							'@type': 'Organization',
							'@id': `${BASE_URL}/#organization`,
							name: 'Аура Света',
						},
						url: input.url,
					},
				}
			: {}),
		...(input.rating && input.reviewsCount && input.reviewsCount > 0
			? {
					aggregateRating: {
						'@type': 'AggregateRating',
						ratingValue: input.rating,
						reviewCount: input.reviewsCount,
					},
				}
			: {}),
	}
}
