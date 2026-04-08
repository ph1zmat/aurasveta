import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../init'

export const ordersRouter = createTRPCRouter({
	getMyOrders: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.order.findMany({
			where: { userId: ctx.userId },
			include: {
				items: {
					include: {
						product: {
							select: { name: true, slug: true, images: true, imagePath: true },
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.order.findFirst({
				where: { id: input, userId: ctx.userId },
				include: {
					items: { include: { product: true } },
				},
			})
		}),

	create: protectedProcedure
		.input(
			z.object({
				address: z.string().min(1),
				phone: z.string().min(1),
				comment: z.string().optional(),
				items: z.array(
					z.object({
						productId: z.string(),
						quantity: z.number().int().min(1),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const products = await ctx.prisma.product.findMany({
				where: { id: { in: input.items.map(i => i.productId) } },
				select: { id: true, price: true },
			})

			const priceMap = new Map(products.map(p => [p.id, p.price ?? 0]))
			const total = input.items.reduce(
				(sum, item) =>
					sum + (priceMap.get(item.productId) ?? 0) * item.quantity,
				0,
			)

			const order = await ctx.prisma.order.create({
				data: {
					userId: ctx.userId,
					total,
					address: input.address,
					phone: input.phone,
					comment: input.comment,
					items: {
						create: input.items.map(item => ({
							productId: item.productId,
							quantity: item.quantity,
							price: priceMap.get(item.productId) ?? 0,
						})),
					},
				},
				include: { items: true },
			})

			// Clear cart after order
			await ctx.prisma.cart.upsert({
				where: { userId: ctx.userId },
				create: { userId: ctx.userId, items: [] },
				update: { items: [] },
			})

			return order
		}),

	// Admin procedures
	getAllOrders: adminProcedure
		.input(
			z.object({
				status: z
					.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
					.optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where: Prisma.OrderWhereInput = {}
			if (input.status) where.status = input.status

			const [items, total] = await Promise.all([
				ctx.prisma.order.findMany({
					where,
					include: {
						user: { select: { name: true, email: true } },
						items: {
							include: { product: { select: { name: true, slug: true } } },
						},
					},
					orderBy: { createdAt: 'desc' },
					skip: (input.page - 1) * input.limit,
					take: input.limit,
				}),
				ctx.prisma.order.count({ where }),
			])

			return { items, total, totalPages: Math.ceil(total / input.limit) }
		}),

	updateStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum([
					'PENDING',
					'PAID',
					'SHIPPED',
					'DELIVERED',
					'CANCELLED',
				]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.order.update({
				where: { id: input.id },
				data: { status: input.status },
			})
		}),
})
