import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import { productImageSelect } from '@/lib/products/product-images'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

export const favoritesRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.favorite.findMany({
			where: { userId: ctx.userId },
			include: {
				product: {
					include: {
						category: { select: { name: true, slug: true } },
						images: orderedProductImages,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}),

	toggle: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.prisma.favorite.findUnique({
				where: {
					userId_productId: { userId: ctx.userId, productId: input },
				},
			})

			if (existing) {
				await ctx.prisma.favorite.delete({ where: { id: existing.id } })
				return { added: false }
			}

			await ctx.prisma.favorite.create({
				data: { userId: ctx.userId, productId: input },
			})
			return { added: true }
		}),

	check: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const fav = await ctx.prisma.favorite.findUnique({
			where: {
				userId_productId: { userId: ctx.userId, productId: input },
			},
		})
		return !!fav
	}),

	remove: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.favorite.delete({
				where: {
					userId_productId: { userId: ctx.userId, productId: input },
				},
			})
		}),
})
