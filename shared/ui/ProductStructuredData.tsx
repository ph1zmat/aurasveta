interface ProductStructuredDataProps {
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

export default function ProductStructuredData({
	name,
	description,
	price,
	images,
	sku,
	brand,
	inStock,
	rating,
	reviewsCount,
	url,
}: ProductStructuredDataProps) {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name,
		description: description ?? undefined,
		image: images.length > 0 ? images : undefined,
		sku: sku ?? undefined,
		brand: brand ? { '@type': 'Brand', name: brand } : undefined,
		offers: price
			? {
					'@type': 'Offer',
					price: price.toFixed(2),
					priceCurrency: 'BYN',
					availability: inStock
						? 'https://schema.org/InStock'
						: 'https://schema.org/OutOfStock',
					url,
				}
			: undefined,
		aggregateRating:
			rating && reviewsCount && reviewsCount > 0
				? {
						'@type': 'AggregateRating',
						ratingValue: rating,
						reviewCount: reviewsCount,
					}
				: undefined,
	}

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
