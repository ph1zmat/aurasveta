import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'

export const compareRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.compareItem.findMany({
			where: { userId: ctx.userId },
			include: {
				product: {
					include: { category: { select: { name: true, slug: true } } },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}),

	toggle: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: productId }) => {
			const existing = await ctx.prisma.compareItem.findUnique({
				where: {
					userId_productId: { userId: ctx.userId, productId },
				},
			})

			if (existing) {
				await ctx.prisma.compareItem.delete({ where: { id: existing.id } })
				return { added: false }
			}

			await ctx.prisma.compareItem.create({
				data: { userId: ctx.userId, productId },
			})
			return { added: true }
		}),

	remove: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: productId }) => {
			return ctx.prisma.compareItem.delete({
				where: {
					userId_productId: { userId: ctx.userId, productId },
				},
			})
		}),

	clear: protectedProcedure.mutation(async ({ ctx }) => {
		return ctx.prisma.compareItem.deleteMany({
			where: { userId: ctx.userId },
		})
	}),
})
