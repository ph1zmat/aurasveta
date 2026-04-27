import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const homeSectionRouter = createTRPCRouter({
	getSections: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.homeSection.findMany({
			where: { isActive: true },
			orderBy: { order: 'asc' },
			include: { sectionType: true },
		})
	}),

	getAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.homeSection.findMany({
			orderBy: { order: 'asc' },
			include: { sectionType: true },
		})
	}),

	getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.homeSection.findUnique({
			where: { id: input },
			include: { sectionType: true },
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				sectionTypeId: z.string(),
				title: z.string().optional(),
				config: z.record(z.string(), z.unknown()).optional().default({}),
				order: z.number().int().default(0),
				isActive: z.boolean().optional().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { config, ...rest } = input
			const result = await ctx.prisma.homeSection.create({
				data: { ...rest, config: config as Prisma.InputJsonValue },
			})
			revalidatePath('/', 'page')
			return result
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				sectionTypeId: z.string().optional(),
				title: z.string().optional(),
				config: z.record(z.string(), z.unknown()).optional(),
				order: z.number().int().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, config, ...rest } = input
			const result = await ctx.prisma.homeSection.update({
				where: { id },
				data: {
					...rest,
					...(config !== undefined
						? { config: config as Prisma.InputJsonValue }
						: {}),
				},
			})
			revalidatePath('/', 'page')
			return result
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const result = await ctx.prisma.homeSection.delete({ where: { id: input } })
		revalidatePath('/', 'page')
		return result
	}),

	reorder: adminProcedure
		.input(z.array(z.object({ id: z.string(), order: z.number().int() })))
		.mutation(async ({ ctx, input }) => {
			const updates = input.map(({ id, order }) =>
				ctx.prisma.homeSection.update({ where: { id }, data: { order } }),
			)
			const result = await ctx.prisma.$transaction(updates)
			revalidatePath('/', 'page')
			return result
		}),
})
