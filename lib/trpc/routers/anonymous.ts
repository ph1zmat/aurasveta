import { z } from 'zod'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, baseProcedure, protectedProcedure } from '../init'

interface CartItem {
	productId: string
	quantity: number
}

function verifySessionId(sessionId: string, signature: string): boolean {
	const secret = process.env.BETTER_AUTH_SECRET
	if (!secret) throw new Error('BETTER_AUTH_SECRET is required')
	const expected = crypto
		.createHmac('sha256', secret)
		.update(sessionId)
		.digest('hex')
	return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

const signedSessionInput = z.object({
	sessionId: z.string(),
	signature: z.string(),
})

function validateSession(input: {
	sessionId: string
	signature: string
}): string {
	if (!verifySessionId(input.sessionId, input.signature)) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Invalid session signature',
		})
	}
	return input.sessionId
}

export const anonymousRouter = createTRPCRouter({
	init: baseProcedure
		.input(signedSessionInput)
		.mutation(async ({ ctx, input }) => {
			const sessionId = validateSession(input)
			const existing = await ctx.prisma.anonymousSession.findUnique({
				where: { sessionId },
			})
			if (existing) return existing

			return ctx.prisma.anonymousSession.create({
				data: { sessionId },
			})
		}),

	getSession: baseProcedure
		.input(signedSessionInput)
		.query(async ({ ctx, input }) => {
			const sessionId = validateSession(input)
			return ctx.prisma.anonymousSession.findUnique({
				where: { sessionId },
			})
		}),

	updateCart: baseProcedure
		.input(
			z.object({
				sessionId: z.string(),
				signature: z.string(),
				cart: z.array(
					z.object({ productId: z.string(), quantity: z.number() }),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const sessionId = validateSession(input)
			return ctx.prisma.anonymousSession.update({
				where: { sessionId },
				data: { cart: input.cart },
			})
		}),

	updateFavorites: baseProcedure
		.input(
			z.object({
				sessionId: z.string(),
				signature: z.string(),
				favorites: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const sessionId = validateSession(input)
			return ctx.prisma.anonymousSession.update({
				where: { sessionId },
				data: { favorites: input.favorites },
			})
		}),

	migrateToUser: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: sessionId }) => {
			const anonSession = await ctx.prisma.anonymousSession.findUnique({
				where: { sessionId },
			})
			if (!anonSession) return { migrated: false }

			// Migrate cart
			const anonCart = anonSession.cart as unknown as CartItem[]
			if (Array.isArray(anonCart) && anonCart.length > 0) {
				const existingCart = await ctx.prisma.cart.findUnique({
					where: { userId: ctx.userId },
				})
				const existingItems =
					(existingCart?.items as unknown as CartItem[]) ?? []

				// Merge carts
				for (const item of anonCart) {
					const idx = existingItems.findIndex(
						i => i.productId === item.productId,
					)
					if (idx >= 0) {
						existingItems[idx].quantity += item.quantity
					} else {
						existingItems.push(item)
					}
				}

				const itemsJson = existingItems as unknown as Prisma.InputJsonValue
				await ctx.prisma.cart.upsert({
					where: { userId: ctx.userId },
					create: { userId: ctx.userId, items: itemsJson },
					update: { items: itemsJson },
				})
			}

			// Migrate favorites
			const anonFavorites = anonSession.favorites as string[]
			if (Array.isArray(anonFavorites) && anonFavorites.length > 0) {
				await ctx.prisma.favorite.createMany({
					data: anonFavorites.map(productId => ({
						userId: ctx.userId,
						productId,
					})),
					skipDuplicates: true,
				})
			}

			// Delete anonymous session
			await ctx.prisma.anonymousSession.delete({
				where: { sessionId },
			})

			return { migrated: true }
		}),

	migrateCompare: protectedProcedure
		.input(z.array(z.string()))
		.mutation(async ({ ctx, input: productIds }) => {
			for (const productId of productIds) {
				await ctx.prisma.compareItem.upsert({
					where: {
						userId_productId: { userId: ctx.userId, productId },
					},
					create: { userId: ctx.userId, productId },
					update: {},
				})
			}
			return { migrated: true }
		}),
})
