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
		return cart?.items ?? []
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
