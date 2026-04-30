import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { createTRPCRouter, adminProcedure } from '../init'

export const notificationsRouter = createTRPCRouter({
	list: adminProcedure
		.input(
			z
				.object({
					type: z.enum(['all', 'order', 'system']).default('all'),
					limit: z.number().min(1).max(200).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const type = input?.type ?? 'all'
			const limit = input?.limit ?? 100
			return ctx.prisma.notification.findMany({
				where: type === 'all' ? undefined : { type },
				orderBy: { createdAt: 'desc' },
				take: limit,
			})
		}),

	countUnread: adminProcedure.query(async ({ ctx }) => {
		const count = await ctx.prisma.notification.count({ where: { isRead: false } })
		return { count }
	}),

	createFromEvent: adminProcedure
		.input(
			z.object({
				type: z.enum(['order', 'system']),
				title: z.string().min(1),
				desc: z.string().min(1),
				meta: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.notification.create({
				data: {
					type: input.type,
					title: input.title,
					desc: input.desc,
					meta: input.meta as Prisma.InputJsonValue | undefined,
				},
			})
		}),

	markRead: adminProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.notification.update({
				where: { id: input.id },
				data: { isRead: true, readAt: new Date() },
			})
		}),

	markAllRead: adminProcedure.mutation(async ({ ctx }) => {
		const result = await ctx.prisma.notification.updateMany({
			where: { isRead: false },
			data: { isRead: true, readAt: new Date() },
		})
		return { updated: result.count }
	}),

	clearAll: adminProcedure.mutation(async ({ ctx }) => {
		const result = await ctx.prisma.notification.deleteMany({})
		return { deleted: result.count }
	}),
})
