import { z } from 'zod'

export interface SchemaValidationResult {
	ok: boolean
	errors: Array<{ code: string; path: string; message: string }>
	warnings: Array<{ code: string; path: string; message: string }>
}

// ─── Zod-схемы структуры ───────────────────────────────────────────────────

const ProductSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('Product'),
	name: z.string().min(1),
	image: z.array(z.string().url()).optional(),
	offers: z
		.object({
			'@type': z.literal('Offer'),
			price: z.string(),
			priceCurrency: z.string().length(3),
			availability: z.string().url(),
			itemCondition: z.string().url().optional(),
			seller: z
				.object({
					'@type': z.literal('Organization'),
					'@id': z.string().url().optional(),
					name: z.string().min(1).optional(),
				})
				.optional(),
			shippingDetails: z
				.object({
					'@type': z.literal('OfferShippingDetails'),
				})
				.optional(),
			hasMerchantReturnPolicy: z
				.object({
					'@type': z.literal('MerchantReturnPolicy'),
				})
				.optional(),
			hasWarrantyPromise: z
				.object({
					'@type': z.literal('WarrantyPromise'),
				})
				.optional(),
			url: z.string().url(),
		})
		.optional(),
	aggregateRating: z
		.object({
			'@type': z.literal('AggregateRating'),
			ratingValue: z.number(),
			reviewCount: z.number().int().nonnegative(),
			bestRating: z.number().optional(),
			worstRating: z.number().optional(),
		})
		.optional(),
})

const BreadcrumbSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('BreadcrumbList'),
	itemListElement: z
		.array(
			z.object({
				'@type': z.literal('ListItem'),
				position: z.number().int().positive(),
				name: z.string().min(1),
			}),
		)
		.min(1),
})

const OrganizationSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('Organization'),
	name: z.string().min(1),
	url: z.string().url(),
})

const WebSiteSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('WebSite'),
	name: z.string().min(1),
	url: z.string().url(),
})

const FaqSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('FAQPage'),
	mainEntity: z
		.array(
			z.object({
				'@type': z.literal('Question'),
				name: z.string().min(1),
				acceptedAnswer: z.object({
					'@type': z.literal('Answer'),
					text: z.string().min(1),
				}),
			}),
		)
		.min(1),
})

const ItemListSchemaShape = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.literal('ItemList'),
	name: z.string().min(1),
	url: z.string().url(),
	numberOfItems: z.number().int().nonnegative(),
	itemListElement: z
		.array(
			z.object({
				'@type': z.literal('ListItem'),
				position: z.number().int().positive(),
				item: z.object({
					'@type': z.literal('Product'),
					name: z.string().min(1),
					url: z.string().url(),
					image: z.string().url().optional(),
					offers: z
						.object({
							'@type': z.literal('Offer'),
							price: z.string(),
							priceCurrency: z.string().length(3),
						})
						.optional(),
				}),
			}),
		)
		.min(1),
})

// ─── Реестр валидаторов ────────────────────────────────────────────────────

const SCHEMA_VALIDATORS: Record<string, z.ZodTypeAny> = {
	Product: ProductSchemaShape,
	BreadcrumbList: BreadcrumbSchemaShape,
	Organization: OrganizationSchemaShape,
	WebSite: WebSiteSchemaShape,
	FAQPage: FaqSchemaShape,
	ItemList: ItemListSchemaShape,
}

// ─── Публичный API ─────────────────────────────────────────────────────────

/**
 * Валидирует JSON-LD объект по Zod-схеме и бизнес-правилам.
 *
 * @param type  — значение `@type` (например, `'Product'`, `'BreadcrumbList'`)
 * @param payload — объект для проверки
 * @returns `{ ok, errors[], warnings[] }`
 */
export function validateSchema(
	type: string,
	payload: unknown,
): SchemaValidationResult {
	const validator = SCHEMA_VALIDATORS[type]
	if (!validator) {
		return {
			ok: false,
			errors: [
				{
					code: 'UNKNOWN_TYPE',
					path: '@type',
					message: `Неизвестный тип schema: ${type}`,
				},
			],
			warnings: [],
		}
	}

	const result = validator.safeParse(payload)

	if (!result.success) {
		return {
			ok: false,
			errors: result.error.issues.map((e) => ({
				code: e.code,
				path: e.path.join('.') || '<root>',
				message: e.message,
			})),
			warnings: [],
		}
	}

	// ── Бизнес-предупреждения ──────────────────────────────────────────────
	const warnings: Array<{ code: string; path: string; message: string }> = []

	if (type === 'Product') {
		const p = payload as Record<string, unknown>
		const productOffers =
			p.offers && typeof p.offers === 'object'
				? (p.offers as Record<string, unknown>)
				: null

		if (productOffers && 'priceValidUntil' in productOffers) {
			return {
				ok: false,
				errors: [
					{
						code: 'SYNTHETIC_FIELD',
						path: 'offers.priceValidUntil',
						message:
							'priceValidUntil запрещён без явного DB-backed контракта и источника даты.',
					},
				],
				warnings: [],
			}
		}

		if (!p.offers) {
			warnings.push({
				code: 'MISSING_OFFERS',
				path: 'offers',
				message: 'Product без offers — нет данных о цене/доступности для поисковиков',
			})
		}
		if (!p.image) {
			warnings.push({
				code: 'MISSING_IMAGE',
				path: 'image',
				message: 'Product без image — нет изображения для rich snippet',
			})
		}
	}

	if (type === 'ItemList') {
		const list = payload as Record<string, unknown>
		const itemList = Array.isArray(list.itemListElement)
			? (list.itemListElement as Array<Record<string, unknown>>)
			: []

		const hasItemWithoutImage = itemList.some(entry => {
			const item = entry.item
			if (!item || typeof item !== 'object') return false
			return !('image' in (item as Record<string, unknown>))
		})

		if (hasItemWithoutImage) {
			warnings.push({
				code: 'ITEMLIST_MISSING_IMAGE',
				path: 'itemListElement[].item.image',
				message:
					'Некоторые элементы ItemList без image — сниппет может быть беднее.',
			})
		}
	}

	return { ok: true, errors: [], warnings }
}
