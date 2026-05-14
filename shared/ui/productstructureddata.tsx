import { buildProductSchema } from '@/lib/seo/schema/builders/product'

interface ProductStructuredDataProps {
	name: string
	description?: string | null
	price?: number | null
	images: string[]
	sku?: string | null
	brand?: string | null
	condition?: 'NEW' | 'USED' | 'REFURBISHED' | null
	inStock: boolean
	rating?: number | null
	reviewsCount?: number
	url: string
	shippingPolicy?: {
		countryCode: string
		currency: string
		shippingRate: number | null
		minTransitDays: number | null
		maxTransitDays: number | null
	} | null
	returnPolicy?: {
		returnPolicyCategory: 'FINITE_WINDOW' | 'NOT_PERMITTED'
		merchantReturnDays: number | null
		returnMethod: 'BY_MAIL' | 'IN_STORE' | 'PICKUP'
		returnFees: 'FREE' | 'BUYER_PAYS' | 'RESTOCKING_FEE'
	} | null
	warrantyPolicy?: {
		durationMonths: number | null
		warrantyScope: 'LIMITED' | 'FULL' | 'MANUFACTURER'
	} | null
}

export default function ProductStructuredData({
	name,
	description,
	price,
	images,
	sku,
	brand,
	condition,
	inStock,
	rating,
	reviewsCount,
	url,
	shippingPolicy,
	returnPolicy,
	warrantyPolicy,
}: ProductStructuredDataProps) {
	const jsonLd = buildProductSchema({
		name,
		description,
		price,
		images,
		sku,
		brand,
		condition,
		inStock,
		rating,
		reviewsCount,
		url,
		shippingPolicy,
		returnPolicy,
		warrantyPolicy,
	})

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
