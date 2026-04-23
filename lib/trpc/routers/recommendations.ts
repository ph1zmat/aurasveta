import { z } from 'zod'
import { createTRPCRouter, baseProcedure } from '../init'
import { productImageSelect } from '@/lib/products/product-images'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

/** Product fields needed for recommendation cards */
const productCardSelect = {
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
	rating: true,
	reviewsCount: true,
	badges: true,
	createdAt: true,
	category: { select: { id: true, name: true, slug: true } },
} as const

export const recommendationsRouter = createTRPCRouter({
	/** 3.1 — Similar products (same category, excluding current) */
	getSimilarProducts: baseProcedure
		.input(
			z.object({
				productId: z.string(),
				limit: z.number().min(1).max(20).default(6),
			}),
		)
		.query(async ({ ctx, input }) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: input.productId },
				select: { categoryId: true, brand: true },
			})
			if (!product?.categoryId) return []

			return ctx.prisma.product.findMany({
				where: {
					id: { not: input.productId },
					categoryId: product.categoryId,
					isActive: true,
				},
				take: input.limit,
				orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
				select: productCardSelect,
			})
		}),

	/** 3.2 — Products from same brand (acts as "collection") */
	getProductsFromBrand: baseProcedure
		.input(
			z.object({
				productId: z.string(),
				limit: z.number().min(1).max(20).default(8),
			}),
		)
		.query(async ({ ctx, input }) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: input.productId },
				select: { brand: true },
			})
			if (!product?.brand) return []

			return ctx.prisma.product.findMany({
				where: {
					brand: product.brand,
					id: { not: input.productId },
					isActive: true,
				},
				take: input.limit,
				orderBy: { createdAt: 'desc' },
				select: productCardSelect,
			})
		}),

	/** 3.3 — Popular in category (by order count + views) */
	getPopularInCategory: baseProcedure
		.input(
			z.object({
				categoryId: z.string(),
				limit: z.number().min(1).max(20).default(8),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.prisma.product.findMany({
				where: { categoryId: input.categoryId, isActive: true },
				take: input.limit,
				orderBy: [
					{ orderItems: { _count: 'desc' } },
					{ reviewsCount: 'desc' },
					{ rating: 'desc' },
				],
				select: productCardSelect,
			})
		}),

	/** 3.4 — Popular products globally (by views + orders last 30 days) */
	getPopularProducts: baseProcedure
		.input(z.object({ limit: z.number().min(1).max(20).default(12) }))
		.query(async ({ ctx, input }) => {
			const lastMonth = new Date()
			lastMonth.setMonth(lastMonth.getMonth() - 1)

			// Use view count from ProductView as popularity signal
			const popularViews = await ctx.prisma.productView.groupBy({
				by: ['productId'],
				where: { viewedAt: { gte: lastMonth } },
				_count: { productId: true },
				orderBy: { _count: { productId: 'desc' } },
				take: input.limit,
			})

			if (popularViews.length === 0) {
				// Fallback: newest products with highest rating
				return ctx.prisma.product.findMany({
					where: { isActive: true },
					take: input.limit,
					orderBy: [{ rating: 'desc' }, { reviewsCount: 'desc' }],
					select: productCardSelect,
				})
			}

			const productIds = popularViews.map(v => v.productId)
			const products = await ctx.prisma.product.findMany({
				where: { id: { in: productIds }, isActive: true },
				select: productCardSelect,
			})

			// Sort by view count order
			const idOrder = new Map(productIds.map((id, i) => [id, i]))
			return products.sort(
				(a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
			)
		}),

	/** 3.5 — Recently viewed (server-side, from ProductView table) */
	getRecentlyViewed: baseProcedure
		.input(
			z.object({
				sessionId: z.string(),
				limit: z.number().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.userId

			const views = await ctx.prisma.productView.findMany({
				where: userId ? { userId } : { sessionId: input.sessionId },
				orderBy: { viewedAt: 'desc' },
				distinct: ['productId'],
				take: input.limit,
				select: {
					product: { select: productCardSelect },
				},
			})

			return views.map(v => v.product)
		}),

	/** 3.6 — Popular searches (last 7 days) */
	getPopularSearches: baseProcedure
		.input(z.object({ limit: z.number().min(1).max(30).default(10) }))
		.query(async ({ ctx, input }) => {
			const lastWeek = new Date()
			lastWeek.setDate(lastWeek.getDate() - 7)

			const results = await ctx.prisma.searchQuery.groupBy({
				by: ['query'],
				where: { createdAt: { gte: lastWeek } },
				_count: { query: true },
				orderBy: { _count: { query: 'desc' } },
				take: input.limit,
			})

			return results.map(r => ({ query: r.query, count: r._count.query }))
		}),

	/** Log a product view */
	logProductView: baseProcedure
		.input(
			z.object({
				productId: z.string(),
				sessionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.userId ?? null

			await ctx.prisma.productView.upsert({
				where: {
					sessionId_productId: {
						sessionId: input.sessionId,
						productId: input.productId,
					},
				},
				create: {
					userId,
					sessionId: input.sessionId,
					productId: input.productId,
				},
				update: {
					viewedAt: new Date(),
					userId, // update userId if user logged in since last view
				},
			})

			return { success: true }
		}),

	/** Log a search query */
	logSearchQuery: baseProcedure
		.input(
			z.object({
				query: z.string(),
				sessionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const trimmed = input.query.trim().toLowerCase()
			if (trimmed.length < 2) return { success: false }

			const userId = ctx.userId ?? null

			await ctx.prisma.searchQuery.create({
				data: {
					userId,
					sessionId: input.sessionId,
					query: trimmed,
				},
			})

			return { success: true }
		}),
})
