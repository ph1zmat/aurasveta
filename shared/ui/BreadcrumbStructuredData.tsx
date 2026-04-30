const BASE_URL = 'https://aurasveta.by'

interface BreadcrumbItem {
	name: string
	href?: string
}

interface BreadcrumbStructuredDataProps {
	items: BreadcrumbItem[]
}

export default function BreadcrumbStructuredData({
	items,
}: BreadcrumbStructuredDataProps) {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
		})),
	}

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
