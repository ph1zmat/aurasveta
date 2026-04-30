import { z } from 'zod'

export const sectionTypeValues = [
	'hero',
	'product-grid',
	'featured-categories',
	'rich-text',
	'gallery',
	'benefits',
	'faq',
	'cta-banner',
] as const

export const SectionTypeSchema = z.enum(sectionTypeValues)
export type SectionType = z.infer<typeof SectionTypeSchema>

export const SectionBackgroundSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('none'),
	}),
	z.object({
		type: z.literal('color'),
		value: z.string().min(1),
	}),
	z.object({
		type: z.literal('gradient'),
		value: z.string().min(1),
	}),
	z.object({
		type: z.literal('image'),
		mediaAssetId: z.string().cuid(),
		overlay: z.number().min(0).max(1).default(0),
	}),
])

export type SectionBackground = z.infer<typeof SectionBackgroundSchema>

export const LinkTargetSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('page'),
		pageId: z.string().cuid(),
	}),
	z.object({
		kind: z.literal('product'),
		productId: z.string().cuid(),
	}),
	z.object({
		kind: z.literal('category'),
		categoryId: z.string().cuid(),
	}),
	z.object({
		kind: z.literal('external'),
		url: z.url(),
	}),
])

export type LinkTarget = z.infer<typeof LinkTargetSchema>

export const CharacteristicFilterSchema = z.object({
	propertyId: z.string().cuid(),
	operator: z.enum(['eq', 'in', 'neq']),
	valueIds: z.array(z.string().cuid()).min(1),
})

export type CharacteristicFilter = z.infer<typeof CharacteristicFilterSchema>

export const ProductSourceSchema = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('manual'),
	}),
	z.object({
		mode: z.literal('category'),
		categoryId: z.string().cuid(),
	}),
	z.object({
		mode: z.literal('characteristics'),
		filters: z.array(CharacteristicFilterSchema).min(1),
	}),
	z.object({
		mode: z.literal('collection'),
		collection: z.enum(['new', 'sale', 'featured']),
	}),
])

export type ProductSource = z.infer<typeof ProductSourceSchema>

export const HeroSectionConfigSchema = z.object({
	type: z.literal('hero'),
	layout: z.enum(['split', 'centered', 'fullscreen']).default('split'),
	description: z.string().optional(),
	badges: z.array(z.string()).default([]),
	primaryCta: LinkTargetSchema.optional(),
	secondaryCta: LinkTargetSchema.optional(),
	mediaRole: z.enum(['background', 'side-image']).default('background'),
})

export const ProductGridSectionConfigSchema = z.object({
	type: z.literal('product-grid'),
	source: ProductSourceSchema,
	limit: z.number().int().min(1).max(24).default(8),
	sort: z
		.enum(['manual', 'newest', 'price-asc', 'price-desc', 'popular'])
		.default('manual'),
	columns: z
		.object({
			mobile: z.number().int().min(1).max(2).default(1),
			tablet: z.number().int().min(2).max(3).default(2),
			desktop: z.number().int().min(2).max(6).default(4),
		})
		.default({ mobile: 1, tablet: 2, desktop: 4 }),
	showPrice: z.boolean().default(true),
	showCompareAtPrice: z.boolean().default(true),
	showCharacteristics: z.array(z.string().cuid()).default([]),
	emptyStateText: z.string().optional(),
})

export const FeaturedCategoriesSectionConfigSchema = z.object({
	type: z.literal('featured-categories'),
	source: z.discriminatedUnion('mode', [
		z.object({
			mode: z.literal('manual'),
		}),
		z.object({
			mode: z.literal('children-of-category'),
			parentCategoryId: z.string().cuid(),
		}),
		z.object({
			mode: z.literal('header-root'),
		}),
	]),
	layout: z.enum(['grid', 'carousel']).default('grid'),
	limit: z.number().int().min(1).max(24).default(6),
	showProductCount: z.boolean().default(true),
})

export const RichTextSectionConfigSchema = z.object({
	type: z.literal('rich-text'),
	body: z.string().min(1),
	maxWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full']).default('lg'),
})

export const GallerySectionConfigSchema = z.object({
	type: z.literal('gallery'),
	layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
	lightbox: z.boolean().default(true),
	aspectRatio: z.enum(['1:1', '4:3', '3:4', '16:9']).default('4:3'),
})

export const BenefitsSectionConfigSchema = z.object({
	type: z.literal('benefits'),
	items: z.array(
		z.object({
			title: z.string().min(1),
			description: z.string().optional(),
			icon: z.string().optional(),
			link: LinkTargetSchema.optional(),
		}),
	)
		.min(1)
		.max(12),
	columns: z
		.object({
			mobile: z.number().int().min(1).max(2).default(1),
			desktop: z.number().int().min(2).max(4).default(3),
		})
		.default({ mobile: 1, desktop: 3 }),
})

export const FaqSectionConfigSchema = z.object({
	type: z.literal('faq'),
	items: z.array(
		z.object({
			question: z.string().min(1),
			answer: z.string().min(1),
		}),
	).min(1),
})

export const CtaBannerSectionConfigSchema = z.object({
	type: z.literal('cta-banner'),
	description: z.string().optional(),
	primaryCta: LinkTargetSchema,
	secondaryCta: LinkTargetSchema.optional(),
	align: z.enum(['left', 'center']).default('left'),
})

export const SectionConfigSchema = z.discriminatedUnion('type', [
	HeroSectionConfigSchema,
	ProductGridSectionConfigSchema,
	FeaturedCategoriesSectionConfigSchema,
	RichTextSectionConfigSchema,
	GallerySectionConfigSchema,
	BenefitsSectionConfigSchema,
	FaqSectionConfigSchema,
	CtaBannerSectionConfigSchema,
])

export type HeroSectionConfig = z.infer<typeof HeroSectionConfigSchema>
export type ProductGridSectionConfig = z.infer<
	typeof ProductGridSectionConfigSchema
>
export type FeaturedCategoriesSectionConfig = z.infer<
	typeof FeaturedCategoriesSectionConfigSchema
>
export type RichTextSectionConfig = z.infer<typeof RichTextSectionConfigSchema>
export type GallerySectionConfig = z.infer<typeof GallerySectionConfigSchema>
export type BenefitsSectionConfig = z.infer<typeof BenefitsSectionConfigSchema>
export type FaqSectionConfig = z.infer<typeof FaqSectionConfigSchema>
export type CtaBannerSectionConfig = z.infer<typeof CtaBannerSectionConfigSchema>

export type SectionConfig = z.infer<typeof SectionConfigSchema>

export const SectionRecordSchema = z
	.object({
		id: z.string().cuid(),
		pageId: z.string().cuid(),
		type: SectionTypeSchema,
		order: z.number().int().min(0),
		isActive: z.boolean().default(true),
		title: z.string().nullable().optional(),
		subtitle: z.string().nullable().optional(),
		anchor: z.string().nullable().optional(),
		background: SectionBackgroundSchema.nullable().optional(),
		config: SectionConfigSchema,
	})
	.superRefine((value, ctx) => {
		if (value.type !== value.config.type) {
			ctx.addIssue({
				code: 'custom',
				path: ['config', 'type'],
				message: 'Section type must match config.type',
			})
		}
	})

export type SectionRecord = z.infer<typeof SectionRecordSchema>
