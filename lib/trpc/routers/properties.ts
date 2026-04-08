import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const propertiesRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.property.findMany({
			orderBy: { name: 'asc' },
			include: { _count: { select: { productValues: true } } },
		})
	}),

	getById: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.property.findUnique({
			where: { id: input },
			include: { _count: { select: { productValues: true } } },
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				key: z.string().min(1),
				name: z.string().min(1),
				type: z
					.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'])
					.default('STRING'),
				options: z.union([z.array(z.string()), z.null()]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.property.create({
				data: {
					...input,
					options:
						(input.options as unknown as Prisma.InputJsonValue) ?? undefined,
				},
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				key: z.string().min(1).optional(),
				name: z.string().min(1).optional(),
				type: z
					.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'])
					.optional(),
				options: z.union([z.array(z.string()), z.null()]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...rest } = input
			return ctx.prisma.property.update({
				where: { id },
				data: {
					...rest,
					options:
						(rest.options as unknown as Prisma.InputJsonValue) ?? undefined,
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.property.delete({ where: { id: input } })
	}),
})
