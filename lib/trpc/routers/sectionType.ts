import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const sectionTypeRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.sectionType.findMany({ orderBy: { name: 'asc' } })
	}),

	getById: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.sectionType.findUnique({ where: { id: input } })
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				component: z.string().min(1),
				configSchema: z.record(z.unknown()).default({}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.sectionType.create({
				data: {
					name: input.name,
					component: input.component,
					configSchema: input.configSchema as Prisma.InputJsonValue,
				},
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				component: z.string().min(1).optional(),
				configSchema: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, configSchema, ...rest } = input
			return ctx.prisma.sectionType.update({
				where: { id },
				data: {
					...rest,
					...(configSchema !== undefined
						? { configSchema: configSchema as Prisma.InputJsonValue }
						: {}),
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.sectionType.delete({ where: { id: input } })
	}),
})
