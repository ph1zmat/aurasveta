import type { Prisma, PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { upsertSeoMetadata } from '@/lib/seo/metadata-persistence'
import { generateSlug } from '@/shared/lib/generateSlug'
import { deleteFile } from '@/lib/storage'
import { SeoFieldsInputSchema } from '@/shared/types/seo'
import {
	buildCategoryProductWhere,
	getCategoryFilterSummary,
	isFilteringCategory,
	type CategoryFilterAware,
} from '@/lib/categories/category-filters'
import { productImageSelect } from '@/lib/products/product-images'
import {
	withResolvedImageAsset,
	withResolvedProductImages,
} from '@/lib/storage-image-assets'

const categoryFilterInputSchema = z.object({
	categoryMode: z.enum(['MANUAL', 'FILTER']).default('MANUAL'),
	filterKind: z.enum(['PROPERTY_VALUE', 'SALE']).nullable().optional(),
	filterPropertyId: z.string().nullable().optional(),
	filterPropertyValueId: z.string().nullable().optional(),
})

const categoryHeaderVisibilityInputSchema = z.object({
	showInHeader: z.boolean().default(true),
})

const categoryRelationSelect = {
	id: true,
	name: true,
	slug: true,
} as const

const categoryFilterRelationInclude = {
	filterProperty: { select: categoryRelationSelect },
	filterPropertyValue: {
		select: { id: true, value: true, slug: true, propertyId: true },
	},
} as const

type CategoryWithFilterMeta = CategoryFilterAware & {
	name: string
	slug: string
	showInHeader?: boolean
	image?: string | null
	imagePath?: string | null
	imageUrl?: string | null
	description?: string | null
	parentId?: string | null
	imageOriginalName?: string | null
	createdAt?: Date
	updatedAt?: Date
	_count?: { products: number }
	filterProperty?: { id: string; name: string; slug: string } | null
	filterPropertyValue?: {
		id: string
		value: string
		slug: string
		propertyId: string
	} | null
	children?: CategoryWithFilterMeta[]
	parent?: CategoryWithFilterMeta | null
	filterSummary?: string | null
}

async function ensureValidParentAssignment(
	ctx: { prisma: PrismaClient },
	args: {
		parentId?: string | null
		currentCategoryId?: string | null
	},
) {
	const { parentId, currentCategoryId } = args

	if (!parentId) {
		return
	}

	if (currentCategoryId && parentId === currentCategoryId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Категория не может быть родительской сама для себя.',
		})
	}

	let cursor: string | null = parentId

	while (cursor) {
		if (currentCategoryId && cursor === currentCategoryId) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Нельзя перенести категорию внутрь собственной ветки.',
			})
		}

		const category: { id: string; parentId: string | null } | null =
			await ctx.prisma.category.findUnique({
			where: { id: cursor },
			select: { id: true, parentId: true },
			})

		if (!category) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Выбранная родительская категория не существует.',
			})
		}

		cursor = category.parentId
	}
}

async function resolveCategoryFilterData(
	ctx: { prisma: PrismaClient },
	input: z.infer<typeof categoryFilterInputSchema>,
) {
	if (input.categoryMode !== 'FILTER') {
		return {
			categoryMode: 'MANUAL' as const,
			filterKind: null,
			filterPropertyId: null,
			filterPropertyValueId: null,
		}
	}

	if (!input.filterKind) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Выберите тип фильтра для фильтрующей категории.',
		})
	}

	if (input.filterKind === 'SALE') {
		return {
			categoryMode: 'FILTER' as const,
			filterKind: 'SALE' as const,
			filterPropertyId: null,
			filterPropertyValueId: null,
		}
	}

	if (!input.filterPropertyId || !input.filterPropertyValueId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Для фильтра по свойству нужно выбрать свойство и значение.',
		})
	}

	const propertyValue = await ctx.prisma.propertyValue.findUnique({
		where: { id: input.filterPropertyValueId },
		select: { id: true, propertyId: true },
	})

	if (!propertyValue || propertyValue.propertyId !== input.filterPropertyId) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Выбранное значение не принадлежит выбранному свойству.',
		})
	}

	return {
		categoryMode: 'FILTER' as const,
		filterKind: 'PROPERTY_VALUE' as const,
		filterPropertyId: input.filterPropertyId,
		filterPropertyValueId: input.filterPropertyValueId,
	}
}

/** Рекурсивно собирает все узлы категорий в плоский массив */
function flattenCategoryNodes(
	categories: CategoryWithFilterMeta[],
	result: CategoryWithFilterMeta[] = [],
): CategoryWithFilterMeta[] {
	for (const c of categories) {
		result.push(c)
		if (c.children) flattenCategoryNodes(c.children, result)
		if (c.parent) result.push(c.parent)
	}
	return result
}

/** Batch-загрузка fallback-изображений для всех категорий одним запросом */
async function batchResolveCategoryFallbackImages(
	ctx: { prisma: PrismaClient },
	categoryIds: string[],
	cache: Map<string, Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']>,
) {
	if (categoryIds.length === 0) return new Map<string, { imageUrl: string | null; imageAsset: Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset'] }>()

	const products = await ctx.prisma.product.findMany({
		where: {
			isActive: true,
			images: { some: {} },
			OR: [
				{ rootCategoryId: { in: categoryIds } },
				{ subcategoryId: { in: categoryIds } },
				{ categoryId: { in: categoryIds } },
				{ subcategory: { parentId: { in: categoryIds } } },
				{ category: { parentId: { in: categoryIds } } },
			],
		},
		orderBy: { createdAt: 'desc' },
		select: {
			categoryId: true,
			rootCategoryId: true,
			subcategoryId: true,
			category: { select: { parentId: true } },
			subcategory: { select: { parentId: true } },
			images: {
				orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
				select: productImageSelect,
			},
		},
	})

	const byCategoryId = new Map<string, typeof products[number]>()
	const byParentId = new Map<string, typeof products[number]>()

	for (const product of products) {
		const directCategoryId = product.subcategoryId ?? product.categoryId ?? product.rootCategoryId
		const parentCategoryId = product.rootCategoryId ?? product.category?.parentId

		if (directCategoryId && !byCategoryId.has(directCategoryId)) {
			byCategoryId.set(directCategoryId, product)
		}
		if (parentCategoryId && !byParentId.has(parentCategoryId)) {
			byParentId.set(parentCategoryId, product)
		}
	}

	const resolved = new Map<string, { imageUrl: string | null; imageAsset: Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset'] }>()

	for (const [catId, product] of byCategoryId) {
		const r = await withResolvedProductImages(product, { cache })
		if (r.imageUrl) resolved.set(catId, { imageUrl: r.imageUrl, imageAsset: r.imageAsset })
	}
	for (const [parentId, product] of byParentId) {
		if (resolved.has(parentId)) continue
		const r = await withResolvedProductImages(product, { cache })
		if (r.imageUrl) resolved.set(parentId, { imageUrl: r.imageUrl, imageAsset: r.imageAsset })
	}

	return resolved
}

/** Batch-вычисление counts для filtering-категорий (параллельно) */
async function batchResolveCategoryProductCounts(
	ctx: { prisma: PrismaClient },
	categories: CategoryWithFilterMeta[],
) {
	const counts = new Map<string, number>()
	const filtering = categories.filter(isFilteringCategory)

	await Promise.all(
		filtering.map(async (cat) => {
			const count = await ctx.prisma.product.count({
				where: {
					isActive: true,
					...buildCategoryProductWhere(cat, { includeChildren: true }),
				},
			})
			counts.set(cat.id, count)
		}),
	)

	return counts
}

async function enrichCategoryNode(
	ctx: { prisma: PrismaClient },
	category: CategoryWithFilterMeta,
	cache: Map<
		string,
		Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']
	>,
	fallbackImages: Map<string, { imageUrl: string | null; imageAsset: Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset'] }>,
	productCounts: Map<string, number>,
): Promise<CategoryWithFilterMeta> {
	// Резолвим собственное изображение категории
	const resolvedCategory = await withResolvedImageAsset(category, { cache })
	const fallback = fallbackImages.get(category.id)
	const finalCategory = fallback && !resolvedCategory.imageUrl
		? { ...resolvedCategory, imageUrl: fallback.imageUrl, imageAsset: fallback.imageAsset }
		: resolvedCategory

	const children = category.children
		? await Promise.all(
				category.children.map(child => enrichCategoryNode(ctx, child, cache, fallbackImages, productCounts)),
			)
		: undefined

	const parent = category.parent
		? await enrichCategoryNode(ctx, category.parent, cache, fallbackImages, productCounts)
		: undefined

	return {
		...finalCategory,
		...(parent !== undefined ? { parent } : {}),
		...(children ? { children } : {}),
		_count: {
			products: productCounts.get(category.id) ?? category._count?.products ?? 0,
		},
		filterSummary: getCategoryFilterSummary(category),
	}
}

/** Batch-обогащение массива категорий (1 запрос на fallback-изображения + параллельные counts) */
async function enrichCategories(
	ctx: { prisma: PrismaClient },
	categories: CategoryWithFilterMeta[],
) {
	const cache = new Map<string, Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']>()
	const allNodes = flattenCategoryNodes(categories)
	const categoryIds = [...new Set(allNodes.map((c) => c.id))]

	const [fallbackImages, productCounts] = await Promise.all([
		batchResolveCategoryFallbackImages(ctx, categoryIds, cache),
		batchResolveCategoryProductCounts(ctx, allNodes),
	])

	return Promise.all(
		categories.map((category) =>
			enrichCategoryNode(ctx, category, cache, fallbackImages, productCounts),
		),
	)
}

/** Batch-обогащение единичной категории */
async function enrichSingleCategory(
	ctx: { prisma: PrismaClient },
	category: CategoryWithFilterMeta,
) {
	const cache = new Map<string, Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']>()
	const allNodes = flattenCategoryNodes([category])
	const categoryIds = [...new Set(allNodes.map((c) => c.id))]

	const [fallbackImages, productCounts] = await Promise.all([
		batchResolveCategoryFallbackImages(ctx, categoryIds, cache),
		batchResolveCategoryProductCounts(ctx, allNodes),
	])

	return enrichCategoryNode(ctx, category, cache, fallbackImages, productCounts)
}

export const categoriesRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		const categories = await ctx.prisma.category.findMany({
			include: {
				children: {
					include: {
						_count: { select: { products: true } },
						...categoryFilterRelationInclude,
					},
				},
				_count: { select: { products: true } },
				...categoryFilterRelationInclude,
			},
			orderBy: { name: 'asc' },
		})

		return enrichCategories(ctx, categories)
	}),

	getTree: baseProcedure.query(async ({ ctx }) => {
		const categories = await ctx.prisma.category.findMany({
			where: { parentId: null },
			include: {
				children: {
					include: {
						children: {
							include: {
								_count: { select: { products: true } },
								...categoryFilterRelationInclude,
							},
						},
						_count: { select: { products: true } },
						...categoryFilterRelationInclude,
					},
				},
				_count: { select: { products: true } },
				...categoryFilterRelationInclude,
			},
			orderBy: { name: 'asc' },
		})

		return enrichCategories(ctx, categories)
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const category = await ctx.prisma.category.findUnique({
			where: { slug: input },
			include: {
				children: {
					include: {
						_count: { select: { products: true } },
						...categoryFilterRelationInclude,
					},
				},
				parent: {
					include: {
						_count: { select: { products: true } },
						...categoryFilterRelationInclude,
					},
				},
				_count: { select: { products: true } },
				...categoryFilterRelationInclude,
			},
		})

		if (!category) return null

		return enrichSingleCategory(ctx, category)
	}),

	getNav: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			where: { parentId: null, showInHeader: true },
			select: { id: true, name: true, slug: true, showInHeader: true },
			orderBy: { name: 'asc' },
		})
	}),

	getHeaderTree: baseProcedure.query(async ({ ctx }) => {
		const categories = await ctx.prisma.category.findMany({
			where: { parentId: null, showInHeader: true },
			include: {
				children: {
					where: { showInHeader: true },
					include: {
						children: {
							where: { showInHeader: true },
							include: {
								_count: { select: { products: true } },
								...categoryFilterRelationInclude,
							},
						},
						_count: { select: { products: true } },
						...categoryFilterRelationInclude,
					},
				},
				_count: { select: { products: true } },
				...categoryFilterRelationInclude,
			},
			orderBy: { name: 'asc' },
		})

		return enrichCategories(ctx, categories)
	}),

	getProductsByCategorySlug: baseProcedure
		.input(
			z.object({
				slug: z.string(),
				includeChildren: z.boolean().default(false),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				sortBy: z
					.enum(['price-asc', 'price-desc', 'name', 'newest', 'rating'])
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { slug, includeChildren, page, limit, sortBy } = input

			const category = await ctx.prisma.category.findUnique({
				where: { slug },
				select: {
					id: true,
					name: true,
					parentId: true,
					categoryMode: true,
					filterKind: true,
					filterPropertyId: true,
					filterPropertyValueId: true,
					children: { select: { id: true } },
				},
			})

			if (!category) return { items: [], total: 0, page, limit, totalPages: 0 }

			const where = {
				isActive: true,
				...buildCategoryProductWhere(category, { includeChildren }),
			}

			let orderBy: Record<string, string> = { createdAt: 'desc' }
			switch (sortBy) {
				case 'price-asc':
					orderBy = { price: 'asc' }
					break
				case 'price-desc':
					orderBy = { price: 'desc' }
					break
				case 'name':
					orderBy = { name: 'asc' }
					break
				case 'newest':
					orderBy = { createdAt: 'desc' }
					break
				case 'rating':
					orderBy = { rating: 'desc' }
					break
			}

			const [items, total] = await Promise.all([
				ctx.prisma.product.findMany({
					where,
					orderBy,
					skip: (page - 1) * limit,
					take: limit,
					select: {
						id: true,
						slug: true,
						name: true,
						description: true,
						price: true,
						compareAtPrice: true,
						stock: true,
						images: {
							orderBy: { order: 'asc' },
							select: productImageSelect,
						},
						brand: true,
						brandCountry: true,
						rating: true,
						reviewsCount: true,
						badges: true,
						isActive: true,
						categoryId: true,
						rootCategoryId: true,
						subcategoryId: true,
						createdAt: true,
						category: { select: { name: true, slug: true } },
						rootCategory: { select: { name: true, slug: true, parentId: true } },
						subcategory: { select: { name: true, slug: true, parentId: true } },
					},
				}),
				ctx.prisma.product.count({ where }),
			])

			const cache = new Map()
			const enrichedItems = await Promise.all(
				items.map(item => withResolvedProductImages(item, { cache })),
			)

			return {
				items: enrichedItems,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			}
		}),

	create: adminProcedure
		.input(
			z
				.object({
					name: z.string().min(1),
					slug: z.string().optional(),
					description: z.string().optional(),
					image: z.string().optional(),
					imagePath: z.string().optional(),
					imageOriginalName: z.string().nullable().optional(),
					parentId: z.string().optional(),
					seo: SeoFieldsInputSchema.optional(),
				})
				.merge(categoryHeaderVisibilityInputSchema)
				.merge(categoryFilterInputSchema),
		)
		.mutation(async ({ ctx, input }) => {
			const {
				categoryMode,
				filterKind,
				filterPropertyId,
				filterPropertyValueId,
				showInHeader,
				seo,
				image,
				imagePath,
				imageOriginalName,
				...rest
			} = input
			let slug = input.slug?.trim() || generateSlug(input.name)
			let suffix = 0
			while (await ctx.prisma.category.findUnique({ where: { slug } })) {
				suffix++
				slug = `${generateSlug(input.name)}-${suffix}`
			}
			const filterData = await resolveCategoryFilterData(ctx, {
				categoryMode,
				filterKind,
				filterPropertyId,
				filterPropertyValueId,
			})

			await ensureValidParentAssignment(ctx, {
				parentId: rest.parentId,
			})

			return ctx.prisma.$transaction(async tx => {
				const category = await tx.category.create({
					data: {
						...rest,
						slug,
						showInHeader,
						imagePath: imagePath ?? image,
						imageOriginalName: imageOriginalName ?? null,
						...filterData,
					},
				})

				if (seo !== undefined) {
					await upsertSeoMetadata(tx, {
						targetType: 'category',
						targetId: category.id,
						fields: seo,
					})
				}

				return category
			})
		}),

	update: adminProcedure
		.input(
			z
				.object({
					id: z.string(),
					name: z.string().min(1).optional(),
					slug: z.string().optional(),
					description: z.string().optional(),
					image: z.string().optional(),
					imagePath: z.string().optional(),
					imageOriginalName: z.string().nullable().optional(),
					parentId: z.string().nullable().optional(),
					seo: SeoFieldsInputSchema.optional(),
				})
				.merge(categoryHeaderVisibilityInputSchema.partial())
				.merge(categoryFilterInputSchema.partial()),
		)
		.mutation(async ({ ctx, input }) => {
			const {
				id,
				categoryMode,
				filterKind,
				filterPropertyId,
				filterPropertyValueId,
				seo,
				image,
				imagePath,
				imageOriginalName,
				...data
			} = input

			const updateData: Prisma.CategoryUncheckedUpdateInput = { ...data }

			if (image !== undefined || imagePath !== undefined) {
				updateData.imagePath = imagePath ?? image ?? null
			}

			if (imageOriginalName !== undefined) {
				updateData.imageOriginalName = imageOriginalName
			}
			if (data.name && !data.slug) {
				let slug = generateSlug(data.name)
				let suffix = 0
				while (
					await ctx.prisma.category.findFirst({
						where: { slug, id: { not: id } },
					})
				) {
					suffix++
					slug = `${generateSlug(data.name)}-${suffix}`
				}
				data.slug = slug
			}

			const currentCategory = (await ctx.prisma.category.findUnique({
				where: { id },
				select: {
					categoryMode: true,
					filterKind: true,
					filterPropertyId: true,
					filterPropertyValueId: true,
				} as unknown as never,
			})) as {
				categoryMode: 'MANUAL' | 'FILTER'
				filterKind: 'PROPERTY_VALUE' | 'SALE' | null
				filterPropertyId: string | null
				filterPropertyValueId: string | null
			} | null

			if (!currentCategory) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Категория не найдена.',
				})
			}

			const filterData = await resolveCategoryFilterData(ctx, {
				categoryMode: categoryMode ?? currentCategory.categoryMode,
				filterKind:
					filterKind === undefined ? currentCategory.filterKind : filterKind,
				filterPropertyId:
					filterPropertyId === undefined
						? currentCategory.filterPropertyId
						: filterPropertyId,
				filterPropertyValueId:
					filterPropertyValueId === undefined
						? currentCategory.filterPropertyValueId
						: filterPropertyValueId,
			})

			await ensureValidParentAssignment(ctx, {
				parentId: data.parentId,
				currentCategoryId: id,
			})

			return ctx.prisma.$transaction(async tx => {
				const category = await tx.category.update({
					where: { id },
					data: {
						...updateData,
						...filterData,
					},
				})

				if (seo !== undefined) {
					await upsertSeoMetadata(tx, {
						targetType: 'category',
						targetId: id,
						fields: seo,
					})
				}

				return category
			})
		}),

	updateImagePath: adminProcedure
		.input(
			z.object({
				categoryId: z.string(),
				imagePath: z.string().nullable(),
				imageOriginalName: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.category.update({
				where: { id: input.categoryId },
				data: {
					imagePath: input.imagePath,
					imageOriginalName: input.imageOriginalName ?? null,
				},
				select: { id: true, imagePath: true },
			})
		}),

	removeImage: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const category = await ctx.prisma.category.findUnique({
				where: { id: input },
				select: { imagePath: true },
			})

			if (category?.imagePath) {
				try {
					await deleteFile(category.imagePath)
				} catch {
					/* file may not exist */
				}
			}

			return ctx.prisma.category.update({
				where: { id: input },
				data: { imagePath: null, imageOriginalName: null },
				select: { id: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.category.delete({ where: { id: input } })
	}),
})
