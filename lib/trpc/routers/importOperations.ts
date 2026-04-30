import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { createTRPCRouter, adminProcedure } from '../init'

export const importOperationsRouter = createTRPCRouter({
	list: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(200).default(50),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return ctx.prisma.importOperation.findMany({
				orderBy: { createdAt: 'desc' },
				take: input?.limit ?? 50,
			})
		}),

	create: adminProcedure
		.input(
			z.object({
				type: z.enum(['import', 'export']),
				count: z.number().int().min(0).default(0),
				status: z.string().default('COMPLETED'),
				meta: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.importOperation.create({
				data: {
					type: input.type,
					count: input.count,
					status: input.status,
					meta: input.meta as Prisma.InputJsonValue | undefined,
				},
			})
		}),
})
