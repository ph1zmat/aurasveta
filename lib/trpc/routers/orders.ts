import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../init'
import { sendPushToAdmins } from '@/lib/push/send'
import { adminEventBus } from '@/lib/realtime/admin-events'
import { productImageSelect } from '@/lib/products/product-images'
import {
	AdminOrderStatusSchema,
	AdminOrderUpdateInputSchema,
} from '@/shared/types/order'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

const adminOrderInclude = {
	user: { select: { name: true, email: true } },
	items: {
		include: {
			product: {
				select: {
					id: true,
					name: true,
					slug: true,
					images: orderedProductImages,
					category: { select: { id: true, name: true, slug: true } },
				},
			},
		},
	},
} as const

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
				contactMethod: z.enum(['PHONE', 'VIBER']).default('PHONE'),
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
						contactMethod: input.contactMethod,
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
				search: z.string().trim().min(1).optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const baseWhere: Prisma.OrderWhereInput = {}

			if (input.search) {
				baseWhere.OR = [
					{ id: { contains: input.search, mode: 'insensitive' } },
					{ phone: { contains: input.search, mode: 'insensitive' } },
					{
						user: {
							name: { contains: input.search, mode: 'insensitive' },
						},
					},
					{
						user: {
							email: { contains: input.search, mode: 'insensitive' },
						},
					},
				]
			}

			const where: Prisma.OrderWhereInput = input.status
				? {
						AND: [baseWhere, { status: input.status }],
					}
				: baseWhere

			const [items, total, groupedCounts] = await Promise.all([
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
				ctx.prisma.order.groupBy({
					by: ['status'],
					where: baseWhere,
					_count: { _all: true },
				}),
			])

			const countsByStatus = groupedCounts.reduce(
				(acc, item) => {
					acc[item.status] = item._count._all
					return acc
				},
				{
					PENDING: 0,
					PAID: 0,
					SHIPPED: 0,
					DELIVERED: 0,
					CANCELLED: 0,
				} as Record<
					'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
					number
				>,
			)

			return {
				items,
				total,
				totalPages: Math.ceil(total / input.limit),
				countsByStatus,
			}
		}),

	getAdminById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.order.findUnique({
			where: { id: input },
			include: adminOrderInclude,
		})
	}),

	updateAdminOrder: adminProcedure
		.input(AdminOrderUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			const updateData: Prisma.OrderUpdateInput = {}

			if (data.status !== undefined) {
				updateData.status = data.status
			}
			if (data.phone !== undefined) {
				updateData.phone = data.phone?.trim() || null
			}
			if (data.address !== undefined) {
				updateData.address = data.address?.trim() || null
			}
			if (data.comment !== undefined) {
				updateData.comment = data.comment?.trim() || null
			}

			return ctx.prisma.order.update({
				where: { id },
				data: updateData,
				include: adminOrderInclude,
			})
		}),

	updateStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: AdminOrderStatusSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.order.update({
				where: { id: input.id },
				data: { status: input.status },
			})
		}),

	getAllByStatuses: adminProcedure.query(async ({ ctx }) => {
		const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
		// Один запрос вместо 5 отдельных; группируем в JS
		const orders = await ctx.prisma.order.findMany({
			where: { status: { in: statuses as unknown as ('PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED')[] } },
			include: {
				user: { select: { name: true, email: true } },
				items: { include: { product: { select: { name: true, slug: true } } } },
			},
			orderBy: { createdAt: 'desc' },
			take: 250,
		})

		const result = Object.fromEntries(
			statuses.map((s) => [s, [] as typeof orders]),
		) as Record<(typeof statuses)[number], typeof orders>

		for (const order of orders) {
			const list = result[order.status as (typeof statuses)[number]]
			if (list.length < 50) {
				list.push(order)
			}
		}

		return result
	}),
})
