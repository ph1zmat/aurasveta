import { buildCategoryItemListSchema } from '@/lib/seo/schema/builders/itemlist'

type ItemListStructuredDataProps = {
	name: string
	url: string
	items: Array<{
		name: string
		url: string
		imageUrl?: string | null
		price?: number | null
		priceCurrency?: string
	}>
}

export default function ItemListStructuredData({
	name,
	url,
	items,
}: ItemListStructuredDataProps) {
	const jsonLd = buildCategoryItemListSchema({
		name,
		url,
		items,
	})

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
