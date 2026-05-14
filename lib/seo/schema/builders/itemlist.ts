const BASE_URL = 'https://aurasveta.by'

export interface ItemListProductInput {
	name: string
	url: string
	imageUrl?: string | null
	price?: number | null
	priceCurrency?: string
}

export interface CategoryItemListSchemaInput {
	name: string
	url: string
	items: ItemListProductInput[]
}

export function buildCategoryItemListSchema(
	input: CategoryItemListSchemaInput,
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: input.name,
		url: input.url,
		numberOfItems: input.items.length,
		itemListElement: input.items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'Product',
				name: item.name,
				url: item.url.startsWith('http')
					? item.url
					: `${BASE_URL}${item.url}`,
				...(item.imageUrl ? { image: item.imageUrl } : {}),
				...(item.price != null
					? {
						offers: {
							'@type': 'Offer',
							price: item.price.toFixed(2),
							priceCurrency: item.priceCurrency ?? 'BYN',
						},
					}
					: {}),
			},
		})),
	}
}
