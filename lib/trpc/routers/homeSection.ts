import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const homeSectionRouter = createTRPCRouter({
	// Public: active sections ordered by order field
	getSections: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.homeSection.findMany({
			where: { isActive: true },
			orderBy: { order: 'asc' },
			include: { sectionType: true },
		})
	}),

	// Admin: all sections including inactive
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
				config: z.record(z.unknown()).default({}),
				order: z.number().int().optional(),
				isActive: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const lastSection = await ctx.prisma.homeSection.findFirst({
				orderBy: { order: 'desc' },
				select: { order: true },
			})
			const order = input.order ?? (lastSection?.order ?? -1) + 1
			return ctx.prisma.homeSection.create({
				data: {
					sectionTypeId: input.sectionTypeId,
					title: input.title,
					config: input.config as Prisma.InputJsonValue,
					order,
					isActive: input.isActive,
				},
				include: { sectionType: true },
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().nullable().optional(),
				config: z.record(z.unknown()).optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, config, ...rest } = input
			return ctx.prisma.homeSection.update({
				where: { id },
				data: {
					...rest,
					...(config !== undefined
						? { config: config as Prisma.InputJsonValue }
						: {}),
				},
				include: { sectionType: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.homeSection.delete({ where: { id: input } })
	}),

	// Bulk reorder
	reorder: adminProcedure
		.input(z.array(z.object({ id: z.string(), order: z.number().int() })))
		.mutation(async ({ ctx, input }) => {
			await Promise.all(
				input.map(item =>
					ctx.prisma.homeSection.update({
						where: { id: item.id },
						data: { order: item.order },
					}),
				),
			)
			return { ok: true }
		}),
})
