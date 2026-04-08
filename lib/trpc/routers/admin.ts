import { z } from 'zod'
import {
	createTRPCRouter,
	adminProcedure,
} from '../init'

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
			const products = await ctx.prisma.product.findMany({
				include: {
					category: { select: { name: true, slug: true } },
					properties: { include: { property: true } },
				},
			})

			if (input === 'json') {
				return { format: 'json' as const, data: JSON.stringify(products, null, 2) }
			}

			// CSV
			const headers = [
				'id', 'name', 'slug', 'description', 'price', 'compareAtPrice',
				'stock', 'sku', 'category', 'brand', 'brandCountry', 'isActive',
			]
			const rows = products.map(p => [
				p.id, p.name, p.slug, p.description ?? '', p.price ?? '',
				p.compareAtPrice ?? '', p.stock, p.sku ?? '',
				p.category?.name ?? '', p.brand ?? '', p.brandCountry ?? '',
				p.isActive,
			])
			const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')

			return { format: 'csv' as const, data: csv }
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

			for (const item of input) {
				const { categorySlug, ...data } = item
				let categoryId: string | undefined

				if (categorySlug) {
					const cat = await ctx.prisma.category.findUnique({
						where: { slug: categorySlug },
					})
					categoryId = cat?.id
				}

				const existing = await ctx.prisma.product.findUnique({
					where: { slug: data.slug },
				})

				if (existing) {
					await ctx.prisma.product.update({
						where: { id: existing.id },
						data: { ...data, categoryId },
					})
					updated++
				} else {
					await ctx.prisma.product.create({
						data: { ...data, categoryId, userId: ctx.userId },
					})
					created++
				}
			}

			return { created, updated, total: input.length }
		}),
})
