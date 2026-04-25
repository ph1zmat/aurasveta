import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const settingRouter = createTRPCRouter({
	// Public: all public settings
	getPublic: baseProcedure.query(async ({ ctx }) => {
		const settings = await ctx.prisma.setting.findMany({
			where: { isPublic: true },
		})
		return Object.fromEntries(settings.map(s => [s.key, s.value]))
	}),

	// Public: single setting by key
	get: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const setting = await ctx.prisma.setting.findUnique({ where: { key: input } })
		return setting?.value ?? null
	}),

	// Admin: all settings grouped
	getAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
	}),

	upsert: adminProcedure
		.input(
			z.object({
				key: z.string().min(1),
				value: z.unknown(),
				type: z.string().default('string'),
				isPublic: z.boolean().default(true),
				group: z.string().default('general'),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.setting.upsert({
				where: { key: input.key },
				update: {
					value: input.value as Prisma.InputJsonValue,
					type: input.type,
					isPublic: input.isPublic,
					group: input.group,
					description: input.description,
				},
				create: {
					key: input.key,
					value: input.value as Prisma.InputJsonValue,
					type: input.type,
					isPublic: input.isPublic,
					group: input.group,
					description: input.description,
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.setting.delete({ where: { key: input } })
	}),
})
