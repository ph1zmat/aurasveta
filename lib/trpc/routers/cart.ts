import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '../init'

interface CartItem {
	productId: string
	quantity: number
}

const cartItemSchema = z.object({
	productId: z.string(),
	quantity: z.number().int().min(1),
})

export const cartRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		const cart = await ctx.prisma.cart.findUnique({
			where: { userId: ctx.userId },
		})
		const items = (cart?.items as unknown as CartItem[]) ?? []
		if (items.length === 0) return []

		// Fetch product details in a single query to avoid waterfall
		const productIds = items.map(i => i.productId)
		const products = await ctx.prisma.product.findMany({
			where: { id: { in: productIds }, isActive: true },
			select: {
				id: true,
				slug: true,
				name: true,
				price: true,
				compareAtPrice: true,
				images: true,
				imagePath: true,
				stock: true,
			},
		})
		const productMap = new Map(products.map(p => [p.id, p]))

		return items.map(item => {
			const p = productMap.get(item.productId)
			return {
				productId: item.productId,
				quantity: item.quantity,
				product: p
					? {
							id: p.id,
							slug: p.slug,
							name: p.name,
							price: p.price,
							compareAtPrice: p.compareAtPrice,
							images: p.images,
							imagePath: p.imagePath,
							stock: p.stock,
						}
					: null,
			}
		})
	}),

	update: protectedProcedure
		.input(z.array(cartItemSchema))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.cart.upsert({
				where: { userId: ctx.userId },
				create: { userId: ctx.userId, items: input },
				update: { items: input },
			})
		}),

	addItem: protectedProcedure
		.input(cartItemSchema)
		.mutation(async ({ ctx, input }) => {
			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: ctx.userId },
			})
			const items = (cart?.items as unknown as CartItem[]) ?? []
			const existingIdx = items.findIndex(i => i.productId === input.productId)

			if (existingIdx >= 0) {
				items[existingIdx].quantity += input.quantity
			} else {
				items.push(input)
			}

			const itemsJson = items as unknown as Prisma.InputJsonValue
			return ctx.prisma.cart.upsert({
				where: { userId: ctx.userId },
				create: { userId: ctx.userId, items: itemsJson },
				update: { items: itemsJson },
			})
		}),

	removeItem: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: ctx.userId },
			})
			const items = ((cart?.items as unknown as CartItem[]) ?? []).filter(
				i => i.productId !== input,
			)
			const itemsJson = items as unknown as Prisma.InputJsonValue
			return ctx.prisma.cart.upsert({
				where: { userId: ctx.userId },
				create: { userId: ctx.userId, items: itemsJson },
				update: { items: itemsJson },
			})
		}),

	clear: protectedProcedure.mutation(async ({ ctx }) => {
		return ctx.prisma.cart.upsert({
			where: { userId: ctx.userId },
			create: { userId: ctx.userId, items: [] },
			update: { items: [] },
		})
	}),
})
