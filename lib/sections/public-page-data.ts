import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
	createStorageImageAsset,
	withResolvedImageAsset,
} from '@/lib/storage-image-assets'
import { productImageSelect } from '@/lib/products/product-images'
import {
	SectionBackgroundSchema,
	SectionConfigSchema,
	type SectionBackground,
} from '@/shared/types/sections'
import type {
	ResolvedSectionCategory,
	ResolvedSectionMediaItem,
	ResolvedSectionPageReference,
	ResolvedSectionProduct,
	ResolvedSectionRecord,
} from '@/entities/section/registry'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

const sectionProductSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	price: true,
	compareAtPrice: true,
	stock: true,
	images: orderedProductImages,
	brand: true,
	brandCountry: true,
	badges: true,
	createdAt: true,
	rating: true,
	reviewsCount: true,
	category: { select: { name: true, slug: true } },
} as const

const sectionCategorySelect = {
	id: true,
	name: true,
	slug: true,
	image: true,
	imagePath: true,
	showInHeader: true,
	children: {
		select: {
			name: true,
			slug: true,
		},
		orderBy: { name: 'asc' as const },
	},
} as const

const sectionPageSelect = {
	id: true,
	title: true,
	slug: true,
	image: true,
	imagePath: true,
} as const

const pageSectionsInclude = {
	sections: {
		where: { isActive: true },
		orderBy: { order: 'asc' as const },
		include: {
			products: {
				orderBy: { order: 'asc' as const },
				include: {
					product: { select: sectionProductSelect },
				},
			},
			categories: {
				orderBy: { order: 'asc' as const },
				include: {
					category: { select: sectionCategorySelect },
				},
			},
			pages: {
				orderBy: { order: 'asc' as const },
				include: {
					targetPage: { select: sectionPageSelect },
				},
			},
			mediaItems: {
				orderBy: { order: 'asc' as const },
				include: {
					mediaAsset: true,
				},
			},
		},
	},
} satisfies Prisma.PageInclude

type PageWithSections = Prisma.PageGetPayload<{
	include: typeof pageSectionsInclude
}>

type SectionWithRelations = PageWithSections['sections'][number]

export interface PublicPageRenderData {
	page: Awaited<ReturnType<typeof withResolvedImageAsset<PageWithSections>>>
	sections: ResolvedSectionRecord[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeSectionConfig(section: SectionWithRelations) {
	const rawConfig = isRecord(section.config) ? section.config : {}
	const parsed = SectionConfigSchema.safeParse({
		...rawConfig,
		type: section.type,
	})

	if (!parsed.success) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn(
				`[section-resolver] Invalid section config for ${section.id}`,
				parsed.error.flatten(),
			)
		}
		return null
	}

	return parsed.data
}

function normalizeSectionBackground(value: unknown): SectionBackground | null {
	if (!value) return null
	const parsed = SectionBackgroundSchema.safeParse(value)
	return parsed.success ? parsed.data : null
}

function buildProductOrderBy(sort: ResolvedSectionRecord<'product-grid'>['config']['sort']) {
	switch (sort) {
		case 'popular':
			return { reviewsCount: 'desc' as const }
		case 'price-asc':
			return { price: 'asc' as const }
		case 'price-desc':
			return { price: 'desc' as const }
		case 'manual':
		case 'newest':
		default:
			return { createdAt: 'desc' as const }
	}
}

function mapProduct(product: SectionWithRelations['products'][number]['product']): ResolvedSectionProduct {
	return {
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: product.description,
		price: product.price,
		compareAtPrice: product.compareAtPrice,
		stock: product.stock,
		images: product.images,
		brand: product.brand,
		brandCountry: product.brandCountry,
		rating: product.rating,
		reviewsCount: product.reviewsCount,
		badges: product.badges,
		createdAt: product.createdAt,
		category: product.category,
	}
}

async function resolveProductGridProducts(section: SectionWithRelations, config: ResolvedSectionRecord<'product-grid'>['config']) {
	if (config.source.mode === 'manual') {
		return section.products.map(item => mapProduct(item.product)).slice(0, config.limit)
	}

	const where: Prisma.ProductWhereInput = { isActive: true }

	if (config.source.mode === 'category') {
		where.categoryId = config.source.categoryId
	}

	if (config.source.mode === 'characteristics') {
		where.AND = config.source.filters.map(filter => {
			if (filter.operator === 'neq') {
				return {
					NOT: {
						properties: {
							some: {
								propertyId: filter.propertyId,
								propertyValueId: { in: filter.valueIds },
							},
						},
					},
				}
			}

			return {
				properties: {
					some: {
						propertyId: filter.propertyId,
						propertyValueId: { in: filter.valueIds },
					},
				},
			}
		})
	}

	if (config.source.mode === 'collection') {
		if (config.source.collection === 'sale') {
			where.compareAtPrice = { not: null }
		}
	}

	const orderBy =
		config.source.mode === 'collection' && config.source.collection === 'featured'
			? ({ reviewsCount: 'desc' as const } satisfies Prisma.ProductOrderByWithRelationInput)
			: buildProductOrderBy(config.sort)

	const products = await prisma.product.findMany({
		where,
		orderBy,
		take: config.limit,
		select: sectionProductSelect,
	})

	return products.map(mapProduct)
}

async function mapCategory(
	category: SectionWithRelations['categories'][number]['category'],
	cache: Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>,
): Promise<ResolvedSectionCategory> {
	const resolved = await withResolvedImageAsset(category, { cache })
	return {
		id: category.id,
		name: category.name,
		slug: category.slug,
		image: category.image,
		imagePath: category.imagePath,
		imageUrl: resolved.imageUrl,
		showInHeader: category.showInHeader,
		children: category.children,
	}
}

async function resolveFeaturedCategories(
	section: SectionWithRelations,
	config: ResolvedSectionRecord<'featured-categories'>['config'],
	cache: Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>,
) {
	if (config.source.mode === 'manual') {
		return Promise.all(section.categories.map(item => mapCategory(item.category, cache)))
	}

	const categories = await prisma.category.findMany({
		where:
			config.source.mode === 'children-of-category'
				? { parentId: config.source.parentCategoryId }
				: { parentId: null, showInHeader: true },
		orderBy: { name: 'asc' },
		take: config.limit,
		select: sectionCategorySelect,
	})

	return Promise.all(categories.map(category => mapCategory(category, cache)))
}

async function resolvePageReferences(
	section: SectionWithRelations,
	cache: Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>,
): Promise<ResolvedSectionPageReference[]> {
	return Promise.all(
		section.pages.map(async item => {
			const resolved = await withResolvedImageAsset(item.targetPage, { cache })
			return {
				id: item.targetPage.id,
				title: item.targetPage.title,
				slug: item.targetPage.slug,
				image: item.targetPage.image,
				imagePath: item.targetPage.imagePath,
				imageUrl: resolved.imageUrl,
			}
		}),
	)
}

async function resolveMediaItems(
	section: SectionWithRelations,
	cache: Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>,
): Promise<ResolvedSectionMediaItem[]> {
	return Promise.all(
		section.mediaItems.map(async item => {
			const asset = await createStorageImageAsset(item.mediaAsset.storageKey, { cache })
			return {
				id: item.mediaAsset.id,
				storageKey: item.mediaAsset.storageKey,
				url: asset?.url ?? item.mediaAsset.storageKey,
				alt: item.altOverride ?? item.mediaAsset.alt ?? null,
				mimeType: item.mediaAsset.mimeType,
				width: item.mediaAsset.width,
				height: item.mediaAsset.height,
				role: item.role,
			}
		}),
	)
}

async function resolveSection(
	section: SectionWithRelations,
	cache: Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>,
): Promise<ResolvedSectionRecord | null> {
	const config = normalizeSectionConfig(section)
	if (!config) return null

	const base = {
		id: section.id,
		type: config.type,
		title: section.title,
		subtitle: section.subtitle,
		anchor: section.anchor,
		background: normalizeSectionBackground(section.background),
		config,
		products: [] as ResolvedSectionProduct[],
		categories: [] as ResolvedSectionCategory[],
		pages: [] as ResolvedSectionPageReference[],
		mediaItems: [] as ResolvedSectionMediaItem[],
	} satisfies Omit<ResolvedSectionRecord, 'type'> & { type: typeof config.type }

	const [pages, mediaItems] = await Promise.all([
		resolvePageReferences(section, cache),
		resolveMediaItems(section, cache),
	])

	if (config.type === 'product-grid') {
		return {
			...base,
			pages,
			mediaItems,
			products: await resolveProductGridProducts(section, config),
		}
	}

	if (config.type === 'featured-categories') {
		return {
			...base,
			pages,
			mediaItems,
			categories: await resolveFeaturedCategories(section, config, cache),
		}
	}

	if (config.type === 'gallery') {
		return {
			...base,
			pages,
			mediaItems,
		}
	}

	if (config.type === 'hero') {
		return {
			...base,
			pages,
			mediaItems,
			products: section.products.map(item => mapProduct(item.product)),
			categories: await Promise.all(section.categories.map(item => mapCategory(item.category, cache))),
		}
	}

	return {
		...base,
		pages,
		mediaItems,
		products: section.products.map(item => mapProduct(item.product)),
		categories: await Promise.all(section.categories.map(item => mapCategory(item.category, cache))),
	}
}

async function resolveSections(page: PageWithSections) {
	const cache = new Map<string, Awaited<ReturnType<typeof createStorageImageAsset>>>()
	const sections = await Promise.all(page.sections.map(section => resolveSection(section, cache)))
	return sections.filter((section): section is ResolvedSectionRecord => section !== null)
}

export async function getPublishedPageRenderDataBySlug(
	slug: string,
): Promise<PublicPageRenderData | null> {
	const page = await prisma.page.findFirst({
		where: { slug, isPublished: true },
		include: pageSectionsInclude,
	})

	if (!page) return null

	const resolvedPage = await withResolvedImageAsset(page)
	const sections = await resolveSections(page)

	return {
		page: resolvedPage,
		sections,
	}
}

export async function getUnifiedHomePageRenderData(): Promise<PublicPageRenderData | null> {
	const page = await prisma.page.findFirst({
		where: {
			isPublished: true,
			OR: [{ kind: 'HOME' }, { slug: 'home' }],
		},
		include: pageSectionsInclude,
		orderBy: { updatedAt: 'desc' },
	})

	if (!page) return null

	const sections = await resolveSections(page)
	if (sections.length === 0) return null

	return {
		page: await withResolvedImageAsset(page),
		sections,
	}
}
