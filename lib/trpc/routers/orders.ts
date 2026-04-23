import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../init'
import { sendPushToAdmins } from '@/lib/push/send'
import { adminEventBus } from '@/lib/realtime/admin-events'
import { productImageSelect } from '@/lib/products/product-images'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

export const ordersRouter = createTRPCRouter({
	getMyOrders: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.order.findMany({
			where: { userId: ctx.userId },
			include: {
				items: {
					include: {
						product: {
							select: {
								name: true,
								slug: true,
								images: orderedProductImages,
							},
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
					items: {
						include: {
							product: {
								include: {
									images: orderedProductImages,
									category: { select: { id: true, name: true, slug: true } },
								},
							},
						},
					},
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
			const order = await ctx.prisma.$transaction(async tx => {
				// Fetch products with current prices and stock
				const products = await tx.product.findMany({
					where: { id: { in: input.items.map(i => i.productId) } },
					select: { id: true, price: true, stock: true, name: true },
				})

				const productMap = new Map(products.map(p => [p.id, p]))

				// Validate stock for all items
				for (const item of input.items) {
					const product = productMap.get(item.productId)
					if (!product) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: `Товар не найден: ${item.productId}`,
						})
					}
					if (product.stock < item.quantity) {
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock}`,
						})
					}
				}

				// Decrement stock for each product
				for (const item of input.items) {
					await tx.product.update({
						where: { id: item.productId },
						data: { stock: { decrement: item.quantity } },
					})
				}

				// Calculate total from current DB prices
				const total = input.items.reduce(
					(sum, item) =>
						sum + (productMap.get(item.productId)?.price ?? 0) * item.quantity,
					0,
				)

				// Create order
				return tx.order.create({
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
								price: productMap.get(item.productId)?.price ?? 0,
							})),
						},
					},
					include: { items: true },
				})
			})

			// Clear cart after order
			await ctx.prisma.cart.upsert({
				where: { userId: ctx.userId },
				create: { userId: ctx.userId, items: [] },
				update: { items: [] },
			})

			// Отправить push-уведомление администраторам о новом заказе
			sendPushToAdmins({
				title: 'Новый заказ',
				body: `Заказ #${order.id.slice(-6)} на сумму ${order.total}₽`,
				data: { orderId: order.id, type: 'new_order' },
			}).catch(err => console.error('[Push] Ошибка отправки:', err))

			// Realtime для открытой CMS (SSE)
			adminEventBus.publish({
				type: 'order.created',
				orderId: order.id,
				total: order.total,
				createdAt: new Date().toISOString(),
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
