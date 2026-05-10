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
	offers: z
		.object({
			'@type': z.literal('Offer'),
			price: z.string(),
			priceCurrency: z.string().length(3),
			availability: z.string().url(),
			url: z.string().url(),
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

// ─── Реестр валидаторов ────────────────────────────────────────────────────

const SCHEMA_VALIDATORS: Record<string, z.ZodTypeAny> = {
	Product: ProductSchemaShape,
	BreadcrumbList: BreadcrumbSchemaShape,
	Organization: OrganizationSchemaShape,
	WebSite: WebSiteSchemaShape,
	FAQPage: FaqSchemaShape,
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
			errors: result.error.errors.map(e => ({
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

	return { ok: true, errors: [], warnings }
}
