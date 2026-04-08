import { z } from 'zod'
import {
	createTRPCRouter,
	protectedProcedure,
} from '../init'

export const profileRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.user.findUnique({
			where: { id: ctx.userId },
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				image: true,
				role: true,
				createdAt: true,
			},
		})
	}),

	update: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
				phone: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.user.update({
				where: { id: ctx.userId },
				data: input,
				select: {
					id: true,
					email: true,
					name: true,
					phone: true,
					image: true,
					role: true,
				},
			})
		}),

	getStats: protectedProcedure.query(async ({ ctx }) => {
		const [ordersCount, favoritesCount] = await Promise.all([
			ctx.prisma.order.count({ where: { userId: ctx.userId } }),
			ctx.prisma.favorite.count({ where: { userId: ctx.userId } }),
		])
		return { ordersCount, favoritesCount }
	}),
})
