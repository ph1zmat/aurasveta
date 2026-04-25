import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const sectionTypeRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.sectionType.findMany({
			orderBy: { name: 'asc' },
			include: { _count: { select: { sections: true } } },
		})
	}),

	getById: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.sectionType.findUnique({
			where: { id: input },
			include: { sections: true },
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				component: z.string().min(1),
				configSchema: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.prisma.sectionType.create({
				data: {
					name: input.name,
					component: input.component,
					configSchema: input.configSchema ?? {},
				},
			})
			revalidatePath('/', 'layout')
			return result
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
			const { id, ...rest } = input
			const result = await ctx.prisma.sectionType.update({
				where: { id },
				data: rest,
			})
			revalidatePath('/', 'layout')
			return result
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const result = await ctx.prisma.sectionType.delete({ where: { id: input } })
		revalidatePath('/', 'layout')
		return result
	}),
})
