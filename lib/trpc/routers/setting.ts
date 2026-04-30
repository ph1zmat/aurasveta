import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const settingRouter = createTRPCRouter({
	getPublic: baseProcedure.query(async ({ ctx }) => {
		const settings = await ctx.prisma.setting.findMany({
			where: { isPublic: true },
		})
		return Object.fromEntries(settings.map(s => [s.key, s.value]))
	}),

	get: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.setting.findUnique({ where: { key: input } })
	}),

	getAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
	}),

	upsert: adminProcedure
		.input(
			z.object({
				key: z.string().min(1),
				value: z.unknown(),
				type: z.string().optional(),
				isPublic: z.boolean().optional(),
				group: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { key, value, ...rest } = input
			const result = await ctx.prisma.setting.upsert({
				where: { key },
				create: {
					key,
					value: value as never,
					...rest,
				},
				update: {
					value: value as never,
					...rest,
				},
			})
			revalidatePath('/', 'layout')
			return result
		}),

	update: adminProcedure
		.input(
			z.object({
				key: z.string().min(1),
				value: z.unknown(),
				type: z.string().optional(),
				isPublic: z.boolean().optional(),
				group: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { key, value, ...rest } = input
			const result = await ctx.prisma.setting.update({
				where: { key },
				data: {
					value: value as never,
					...rest,
				},
			})
			revalidatePath('/', 'layout')
			return result
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const result = await ctx.prisma.setting.delete({ where: { key: input } })
		revalidatePath('/', 'layout')
		return result
	}),

	bulkUpsert: adminProcedure
		.input(
			z.array(
				z.object({
					key: z.string().min(1),
					value: z.unknown(),
					type: z.string().optional(),
					isPublic: z.boolean().optional(),
					group: z.string().optional(),
					description: z.string().optional(),
				}),
			),
		)
		.mutation(async ({ ctx, input }) => {
			const results = await ctx.prisma.$transaction(
				input.map((item) => {
					const { key, value, ...rest } = item
					return ctx.prisma.setting.upsert({
						where: { key },
						create: { key, value: value as never, ...rest },
						update: { value: value as never, ...rest },
					})
				}),
			)
			revalidatePath('/', 'layout')
			return results
		}),
})
