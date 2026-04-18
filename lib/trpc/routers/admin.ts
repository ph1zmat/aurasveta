import { z } from 'zod'
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
			const products = await ctx.prisma.product.findMany({
				include: {
					category: { select: { name: true, slug: true } },
					properties: { include: { property: true } },
				},
			})

			if (input === 'json') {
				return {
					format: 'json' as const,
					data: JSON.stringify(products, null, 2),
				}
			}

			// CSV
			const headers = [
				'id',
				'name',
				'slug',
				'description',
				'price',
				'compareAtPrice',
				'stock',
				'sku',
				'category',
				'brand',
				'brandCountry',
				'isActive',
			]
			const rows = products.map(p => [
				p.id,
				p.name,
				p.slug,
				p.description ?? '',
				p.price ?? '',
				p.compareAtPrice ?? '',
				p.stock,
				p.sku ?? '',
				p.category?.name ?? '',
				p.brand ?? '',
				p.brandCountry ?? '',
				p.isActive,
			])
			const csv = [
				headers.join(','),
				...rows.map(r =>
					r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
				),
			].join('\n')

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
})
