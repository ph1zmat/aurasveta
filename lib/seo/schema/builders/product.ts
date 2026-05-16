const BASE_URL = 'https://aurasveta.by'

type ShippingPolicyInput = {
	countryCode: string
	currency: string
	shippingRate: number | null
	minTransitDays: number | null
	maxTransitDays: number | null
}

type ReturnPolicyInput = {
	returnPolicyCategory: 'FINITE_WINDOW' | 'NOT_PERMITTED'
	merchantReturnDays: number | null
	returnMethod: 'BY_MAIL' | 'IN_STORE' | 'PICKUP'
	returnFees: 'FREE' | 'BUYER_PAYS' | 'RESTOCKING_FEE'
}

type WarrantyPolicyInput = {
	durationMonths: number | null
	warrantyScope: 'LIMITED' | 'FULL' | 'MANUFACTURER'
}

type ProductConditionInput = 'NEW' | 'USED' | 'REFURBISHED'

const DEFAULT_SHIPPING: ShippingPolicyInput = {
	countryCode: 'BY',
	currency: 'BYN',
	shippingRate: 0,
	minTransitDays: 1,
	maxTransitDays: 5,
}

const DEFAULT_RETURN: ReturnPolicyInput = {
	returnPolicyCategory: 'FINITE_WINDOW',
	merchantReturnDays: 14,
	returnMethod: 'BY_MAIL',
	returnFees: 'FREE',
}

const DEFAULT_WARRANTY: WarrantyPolicyInput = {
	durationMonths: 12,
	warrantyScope: 'MANUFACTURER',
}

export interface ProductSchemaInput {
	name: string
	description?: string | null
	price?: number | null
	images: string[]
	sku?: string | null
	brand?: string | null
	condition?: ProductConditionInput | null
	inStock: boolean
	rating?: number | null
	reviewsCount?: number
	url: string
	shippingPolicy?: ShippingPolicyInput | null
	returnPolicy?: ReturnPolicyInput | null
	warrantyPolicy?: WarrantyPolicyInput | null
}

function mapReturnPolicyCategory(value: ReturnPolicyInput['returnPolicyCategory']) {
	if (value === 'NOT_PERMITTED') {
		return 'https://schema.org/MerchantReturnNotPermitted'
	}

	return 'https://schema.org/MerchantReturnFiniteReturnWindow'
}

function mapReturnMethod(value: ReturnPolicyInput['returnMethod']) {
	switch (value) {
		case 'IN_STORE':
			return 'https://schema.org/ReturnInStore'
		case 'BY_MAIL':
			return 'https://schema.org/ReturnByMail'
		default:
			return null
	}
}

function mapReturnFees(value: ReturnPolicyInput['returnFees']) {
	switch (value) {
		case 'FREE':
			return 'https://schema.org/FreeReturn'
		case 'BUYER_PAYS':
			return 'https://schema.org/ReturnFeesCustomerResponsibility'
		default:
			return null
	}
}

function buildShippingDetails(policy: ShippingPolicyInput) {
	const result: Record<string, unknown> = {
		'@type': 'OfferShippingDetails',
		shippingDestination: {
			'@type': 'DefinedRegion',
			addressCountry: policy.countryCode,
		},
	}

	if (policy.shippingRate != null) {
		result.shippingRate = {
			'@type': 'MonetaryAmount',
			value: policy.shippingRate.toFixed(2),
			currency: policy.currency,
		}
	}

	if (policy.minTransitDays != null || policy.maxTransitDays != null) {
		const transitTime: Record<string, unknown> = {
			'@type': 'QuantitativeValue',
			unitCode: 'DAY',
		}

		if (policy.minTransitDays != null) {
			transitTime.minValue = policy.minTransitDays
		}

		if (policy.maxTransitDays != null) {
			transitTime.maxValue = policy.maxTransitDays
		}

		result.deliveryTime = {
			'@type': 'ShippingDeliveryTime',
			transitTime,
		}
	}

	return result
}

function buildMerchantReturnPolicy(policy: ReturnPolicyInput) {
	const returnMethod = mapReturnMethod(policy.returnMethod)
	const returnFees = mapReturnFees(policy.returnFees)

	return {
		'@type': 'MerchantReturnPolicy',
		returnPolicyCategory: mapReturnPolicyCategory(policy.returnPolicyCategory),
		...(policy.returnPolicyCategory === 'FINITE_WINDOW' &&
		policy.merchantReturnDays != null
			? { merchantReturnDays: policy.merchantReturnDays }
			: {}),
		...(returnMethod ? { returnMethod } : {}),
		...(returnFees ? { returnFees } : {}),
	}
}

function buildWarrantyPromise(policy: WarrantyPolicyInput) {
	if (policy.durationMonths == null || policy.durationMonths <= 0) {
		return null
	}

	return {
		'@type': 'WarrantyPromise',
		description:
			policy.warrantyScope === 'FULL'
				? 'Полная гарантия'
				: policy.warrantyScope === 'MANUFACTURER'
					? 'Гарантия производителя'
					: 'Ограниченная гарантия',
		durationOfWarranty: {
			'@type': 'QuantitativeValue',
			value: policy.durationMonths,
			unitCode: 'MON',
		},
	}
}

function mapProductCondition(condition: ProductConditionInput | null | undefined) {
	switch (condition) {
		case 'USED':
			return 'https://schema.org/UsedCondition'
		case 'REFURBISHED':
			return 'https://schema.org/RefurbishedCondition'
		case 'NEW':
		default:
			return 'https://schema.org/NewCondition'
	}
}

/**
 * Генерирует JSON-LD объект `Product`.
 * Дублирует логику компонента `ProductStructuredData`, но как чистая функция.
 * Привязывает seller к `@id` Organization для связи schema-графа.
 */
export function buildProductSchema(
	input: ProductSchemaInput,
): Record<string, unknown> {
	const offer: Record<string, unknown> = {
		'@type': 'Offer',
		price: input.price?.toFixed(2) ?? '0.00',
		priceCurrency: 'BYN',
		availability: input.inStock
			? 'https://schema.org/InStock'
			: 'https://schema.org/OutOfStock',
		itemCondition: mapProductCondition(input.condition),
		seller: {
			'@type': 'Organization',
			'@id': `${BASE_URL}/#organization`,
			name: 'Аура Света',
		},
		url: input.url,
		shippingDetails: buildShippingDetails(input.shippingPolicy ?? DEFAULT_SHIPPING),
		hasMerchantReturnPolicy: buildMerchantReturnPolicy(input.returnPolicy ?? DEFAULT_RETURN),
	}

	const warrantyPromise = buildWarrantyPromise(input.warrantyPolicy ?? DEFAULT_WARRANTY)
	if (warrantyPromise) {
		offer.hasWarrantyPromise = warrantyPromise
	}

	const reviewData =
		input.rating != null && input.reviewsCount && input.reviewsCount > 0
			? [
					{
						'@type': 'Review',
						reviewRating: {
							'@type': 'Rating',
							ratingValue: input.rating,
							bestRating: 5,
							worstRating: 1,
						},
						author: { '@type': 'Organization', name: 'Аура Света' },
						reviewBody: `Отзывы покупателей (${input.reviewsCount})`,
					},
				]
			: undefined

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: input.name,
		description:
			input.description ||
			`${input.name} — купить в интернет-магазине Аура Света в Мозыре с доставкой по Беларуси.`,
		image:
			input.images.length > 0
				? input.images
				: ['https://aurasveta.by/product-placeholder.png'],
		...(input.sku ? { sku: input.sku, mpn: input.sku } : {}),
		...(input.brand
			? { brand: { '@type': 'Brand', name: input.brand } }
			: {}),
		offers: offer,
		...(input.rating && input.reviewsCount && input.reviewsCount > 0
			? {
					aggregateRating: {
						'@type': 'AggregateRating',
						ratingValue: input.rating,
						reviewCount: input.reviewsCount,
						bestRating: 5,
						worstRating: 1,
					},
				}
			: {}),
		...(reviewData ? { review: reviewData } : {}),
	}
}
