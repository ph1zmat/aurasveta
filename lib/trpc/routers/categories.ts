import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { generateSlug } from '@/shared/lib/generateSlug'
import { deleteFile } from '@/lib/storage'
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

async function resolveCategoryProductCount(
	ctx: { prisma: PrismaClient },
	category: CategoryWithFilterMeta,
) {
	if (!isFilteringCategory(category)) {
		return category._count?.products ?? 0
	}

	return ctx.prisma.product.count({
		where: {
			isActive: true,
			...buildCategoryProductWhere(category, { includeChildren: true }),
		},
	})
}

async function enrichCategoryNode(
	ctx: { prisma: PrismaClient },
	category: CategoryWithFilterMeta,
	cache: Map<
		string,
		Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']
	>,
): Promise<CategoryWithFilterMeta> {
	const resolvedCategory = await withResolvedCategoryImage(ctx, category, {
		cache,
	})
	const children = category.children
		? await Promise.all(
				category.children.map(child => enrichCategoryNode(ctx, child, cache)),
			)
		: undefined
	const parent = category.parent
		? await withResolvedCategoryImage(ctx, category.parent, { cache })
		: undefined

	return {
		...resolvedCategory,
		...(parent !== undefined ? { parent } : {}),
		...(children ? { children } : {}),
		_count: {
			products: await resolveCategoryProductCount(ctx, category),
		},
		filterSummary: getCategoryFilterSummary(category),
	}
}

async function withResolvedCategoryImage<
	T extends {
		id: string
		image?: string | null
		imagePath?: string | null
	},
>(
	ctx: { prisma: PrismaClient },
	category: T,
	options?: {
		cache?: Map<
			string,
			Awaited<ReturnType<typeof withResolvedImageAsset>>['imageAsset']
		>
		preferProxy?: boolean
	},
) {
	const resolvedCategory = await withResolvedImageAsset(category, options)
	if (resolvedCategory.imageUrl) {
		return resolvedCategory
	}

	const fallbackProduct = await ctx.prisma.product.findFirst({
		where: {
			isActive: true,
			images: { some: {} },
			OR: [
				{ categoryId: category.id },
				{ category: { parentId: category.id } },
			],
		},
		orderBy: { createdAt: 'desc' },
		select: {
			images: {
				orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
				select: productImageSelect,
			},
		},
	})

	if (!fallbackProduct) {
		return resolvedCategory
	}

	const resolvedProduct = await withResolvedProductImages(
		fallbackProduct,
		options,
	)
	if (!resolvedProduct.imageUrl) {
		return resolvedCategory
	}

	return {
		...resolvedCategory,
		imageUrl: resolvedProduct.imageUrl,
		imageAsset: resolvedProduct.imageAsset,
	}
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

		const cache = new Map()
		return Promise.all(
			categories.map(category => enrichCategoryNode(ctx, category, cache)),
		)
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

		const cache = new Map()
		return Promise.all(
			categories.map(category => enrichCategoryNode(ctx, category, cache)),
		)
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

		const cache = new Map()
		return enrichCategoryNode(ctx, category, cache)
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

		const cache = new Map()
		return Promise.all(
			categories.map(category => enrichCategoryNode(ctx, category, cache)),
		)
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
						createdAt: true,
						category: { select: { name: true, slug: true } },
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
					parentId: z.string().optional(),
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
			return ctx.prisma.category.create({
				data: {
					...rest,
					slug,
					showInHeader,
					...filterData,
				},
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
					parentId: z.string().nullable().optional(),
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
				...data
			} = input
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

			return ctx.prisma.category.update({
				where: { id },
				data: {
					...data,
					...filterData,
				},
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
