import { z } from 'zod'
import Papa from 'papaparse'
import { createTRPCRouter, adminProcedure } from '../init'

export const adminRouter = createTRPCRouter({
	getStats: adminProcedure.query(async ({ ctx }) => {
		const [
			totalProducts,
			totalOrders,
			totalUsers,
			totalRevenue,
			recentOrders,
			topProducts,
		] = await Promise.all([
			ctx.prisma.product.count(),
			ctx.prisma.order.count(),
			ctx.prisma.user.count(),
			ctx.prisma.order.aggregate({ _sum: { total: true } }),
			ctx.prisma.order.findMany({
				take: 10,
				orderBy: { createdAt: 'desc' },
				include: {
					user: { select: { name: true, email: true } },
				},
			}),
			ctx.prisma.orderItem.groupBy({
				by: ['productId'],
				_sum: { quantity: true },
				_count: true,
				orderBy: { _sum: { quantity: 'desc' } },
				take: 10,
			}),
		])

		// Get product names for top products
		const topProductIds = topProducts.map(tp => tp.productId)
		const products = await ctx.prisma.product.findMany({
			where: { id: { in: topProductIds } },
			select: { id: true, name: true, slug: true, price: true },
		})

		const topProductsWithNames = topProducts.map(tp => ({
			...tp,
			product: products.find(p => p.id === tp.productId),
		}))

		return {
			totalProducts,
			totalOrders,
			totalUsers,
			totalRevenue: totalRevenue._sum.total ?? 0,
			recentOrders,
			topProducts: topProductsWithNames,
		}
	}),

	getRevenueChart: adminProcedure
		.input(
			z.object({
				days: z.number().min(7).max(365).default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			const since = new Date()
			since.setDate(since.getDate() - input.days)

			const orders = await ctx.prisma.order.findMany({
				where: { createdAt: { gte: since } },
				select: { total: true, createdAt: true },
				orderBy: { createdAt: 'asc' },
			})

			// Group by date
			const grouped = new Map<string, number>()
			for (const order of orders) {
				const date = order.createdAt.toISOString().split('T')[0]
				grouped.set(date, (grouped.get(date) ?? 0) + order.total)
			}

			return Array.from(grouped.entries()).map(([date, revenue]) => ({
				date,
				revenue,
			}))
		}),

	exportProducts: adminProcedure
		.input(z.enum(['json', 'csv']).default('json'))
		.query(async ({ ctx, input }) => {
			const total = await ctx.prisma.product.count()
			const TAKE = 5000
			const products = await ctx.prisma.product.findMany({
				take: TAKE,
				include: {
					category: { select: { name: true, slug: true } },
					properties: { include: { property: true } },
				},
			})

			if (input === 'json') {
				return {
					format: 'json' as const,
					data: JSON.stringify(products, null, 2),
					warning: total > TAKE ? `Экспортировано только ${TAKE} из ${total} товаров` : undefined,
				}
			}

			// CSV via PapaParse for correct escaping
			const rows = products.map((p) => ({
				id: p.id,
				name: p.name,
				slug: p.slug,
				description: p.description ?? '',
				price: p.price ?? '',
				compareAtPrice: p.compareAtPrice ?? '',
				stock: p.stock,
				sku: p.sku ?? '',
				category: p.category?.name ?? '',
				brand: p.brand ?? '',
				brandCountry: p.brandCountry ?? '',
				isActive: p.isActive,
			}))
			const csv = Papa.unparse(rows, {
				header: true,
				newline: '\n',
			})

			return {
				format: 'csv' as const,
				data: csv,
				warning: total > TAKE ? `Экспортировано только ${TAKE} из ${total} товаров` : undefined,
			}
		}),

	importProducts: adminProcedure
		.input(
			z.array(
				z.object({
					name: z.string(),
					slug: z.string(),
					description: z.string().optional(),
					price: z.number().optional(),
					compareAtPrice: z.number().optional(),
					stock: z.number().default(0),
					sku: z.string().optional(),
					categorySlug: z.string().optional(),
					brand: z.string().optional(),
					brandCountry: z.string().optional(),
					isActive: z.boolean().default(true),
				}),
			),
		)
		.mutation(async ({ ctx, input }) => {
			let created = 0
			let updated = 0

			// Pre-fetch all categories in one query
			const categorySlugs = [
				...new Set(input.map(i => i.categorySlug).filter(Boolean) as string[]),
			]
			const categories =
				categorySlugs.length > 0
					? await ctx.prisma.category.findMany({
							where: { slug: { in: categorySlugs } },
							select: { id: true, slug: true },
						})
					: []
			const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

			// Pre-fetch all existing products by slug
			const slugs = input.map(i => i.slug)
			const existingProducts = await ctx.prisma.product.findMany({
				where: { slug: { in: slugs } },
				select: { id: true, slug: true },
			})
			const existingMap = new Map(existingProducts.map(p => [p.slug, p.id]))

			// Batch in a transaction
			await ctx.prisma.$transaction(async tx => {
				const toCreate: Array<
					(typeof input)[number] & { categoryId?: string }
				> = []
				const toUpdate: Array<{ id: string; data: Record<string, unknown> }> =
					[]

				for (const item of input) {
					const { categorySlug, ...data } = item
					const categoryId = categorySlug
						? categoryMap.get(categorySlug)
						: undefined
					const existingId = existingMap.get(data.slug)

					if (existingId) {
						toUpdate.push({ id: existingId, data: { ...data, categoryId } })
						updated++
					} else {
						toCreate.push({ ...data, categoryId } as typeof item & {
							categoryId?: string
						})
						created++
					}
				}

				// Bulk create new products
				if (toCreate.length > 0) {
					await tx.product.createMany({
						data: toCreate.map(item => ({
							name: item.name,
							slug: item.slug,
							description: item.description,
							price: item.price,
							compareAtPrice: item.compareAtPrice,
							stock: item.stock,
							sku: item.sku,
							brand: item.brand,
							brandCountry: item.brandCountry,
							isActive: item.isActive,
							categoryId: item.categoryId,
							userId: ctx.userId,
						})),
					})
				}

				// Updates still need individual calls (different data per row)
				for (const { id, data } of toUpdate) {
					await tx.product.update({ where: { id }, data })
				}
			})

			return { created, updated, total: input.length }
		}),

	getStatsWithTrends: adminProcedure.query(async ({ ctx }) => {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

		const [
			totalProducts,
			totalOrders,
			totalUsers,
			revenueAgg,
			prevRevenueAgg,
			ordersThisMonth,
			ordersPrevMonth,
			usersThisMonth,
			usersPrevMonth,
		] = await Promise.all([
			ctx.prisma.product.count(),
			ctx.prisma.order.count(),
			ctx.prisma.user.count(),
			ctx.prisma.order.aggregate({
				where: { createdAt: { gte: startOfMonth } },
				_sum: { total: true },
			}),
			ctx.prisma.order.aggregate({
				where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
				_sum: { total: true },
			}),
			ctx.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
			ctx.prisma.order.count({ where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
			ctx.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
			ctx.prisma.user.count({ where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
		])

		const calcTrend = (curr: number, prev: number): number =>
			prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 1000) / 10

		const totalRevenue = revenueAgg._sum.total ?? 0
		const prevRevenue = prevRevenueAgg._sum.total ?? 0

		// Sparkline: 7 daily buckets for current metric
		const sparklineDays = 7
		const sparklineStart = new Date()
		sparklineStart.setDate(sparklineStart.getDate() - sparklineDays + 1)
		sparklineStart.setHours(0, 0, 0, 0)

		const sparklineOrders = await ctx.prisma.order.findMany({
			where: { createdAt: { gte: sparklineStart } },
			select: { total: true, createdAt: true },
		})

		const buckets: Record<string, { revenue: number; orders: number; users: number }> = {}
		for (let i = 0; i < sparklineDays; i++) {
			const d = new Date(sparklineStart)
			d.setDate(d.getDate() + i)
			buckets[d.toISOString().slice(0, 10)] = { revenue: 0, orders: 0, users: 0 }
		}
		for (const o of sparklineOrders) {
			const key = o.createdAt.toISOString().slice(0, 10)
			if (buckets[key]) {
				buckets[key].revenue += o.total
				buckets[key].orders += 1
			}
		}

		const sparklineRevenue = Object.values(buckets).map((b) => b.revenue)
		const sparklineOrders2 = Object.values(buckets).map((b) => b.orders)

		return {
			totalProducts,
			totalOrders,
			totalUsers,
			totalRevenue,
			revenueTrend: calcTrend(totalRevenue, prevRevenue),
			ordersTrend: calcTrend(ordersThisMonth, ordersPrevMonth),
			usersTrend: calcTrend(usersThisMonth, usersPrevMonth),
			conversionRate: totalOrders > 0 && totalUsers > 0
				? Math.round((ordersThisMonth / Math.max(usersThisMonth, 1)) * 100) / 100
				: 0,
			conversionTrend: 0,
			sparklineRevenue,
			sparklineOrders: sparklineOrders2,
			sparklineUsers: sparklineRevenue.map(() => 0),
		}
	}),

	getTopProducts: adminProcedure
		.input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 5
			const topItems = await ctx.prisma.orderItem.groupBy({
				by: ['productId'],
				_sum: { quantity: true },
				orderBy: { _sum: { quantity: 'desc' } },
				take: limit,
			})
			const ids = topItems.map((t) => t.productId)
			const products = await ctx.prisma.product.findMany({
				where: { id: { in: ids } },
				select: {
					id: true,
					name: true,
					slug: true,
					price: true,
					brand: true,
					category: { select: { name: true } },
					images: {
						take: 1,
						orderBy: { order: 'asc' },
						select: { url: true },
					},
				},
			})
			const productMap = new Map(products.map((p) => [p.id, p]))
			return topItems.map((t) => ({
				productId: t.productId,
				salesCount: t._sum.quantity ?? 0,
				product: productMap.get(t.productId),
			}))
		}),
})
