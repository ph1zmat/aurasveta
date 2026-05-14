import { buildBreadcrumbSchema } from '@/lib/seo/schema/builders/breadcrumb'

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
	const jsonLd = buildBreadcrumbSchema(items)

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
