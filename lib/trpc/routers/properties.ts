import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const propertiesRouter = createTRPCRouter({
	getForCarousel: baseProcedure
		.input(z.object({ slug: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const property = await ctx.prisma.property.findUnique({
				where: { slug: input.slug },
				include: {
					values: {
						orderBy: [{ order: 'asc' }, { value: 'asc' }],
						select: {
							id: true,
							value: true,
							slug: true,
							photo: true,
							order: true,
						},
					},
				},
			})

			if (!property) return null

			return {
				id: property.id,
				slug: property.slug,
				name: property.name,
				hasPhoto: property.hasPhoto,
				values: property.values,
			}
		}),

	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.property.findMany({
			orderBy: { name: 'asc' },
			include: {
				values: { orderBy: { order: 'asc' } },
				_count: { select: { productValues: true } },
			},
		})
	}),

	getById: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.property.findUnique({
			where: { id: input },
			include: {
				values: { orderBy: { order: 'asc' } },
				_count: { select: { productValues: true } },
			},
		})
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.property.findUnique({
			where: { slug: input },
			include: {
				values: { orderBy: { order: 'asc' } },
			},
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				slug: z.string().min(1),
				name: z.string().min(1),
				hasPhoto: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.prisma.property.create({ data: input })
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				slug: z.string().min(1).optional(),
				name: z.string().min(1).optional(),
				hasPhoto: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...rest } = input
			const result = await ctx.prisma.property.update({
				where: { id },
				data: rest,
			})
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const result = await ctx.prisma.property.delete({ where: { id: input } })
		revalidatePath('/')
		revalidatePath('/admin/properties')
		return result
	}),

	createValue: adminProcedure
		.input(
			z.object({
				propertyId: z.string(),
				value: z.string().min(1),
				slug: z.string().min(1).optional(),
				photo: z.string().nullable().optional(),
				order: z.number().int().optional().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slug =
				input.slug ??
				input.value
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '')
			const result = await ctx.prisma.propertyValue.create({
				data: {
					propertyId: input.propertyId,
					value: input.value,
					slug,
					photo: input.photo,
					order: input.order,
				},
			})
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),

	updateValue: adminProcedure
		.input(
			z.object({
				id: z.string(),
				value: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				photo: z.string().nullable().optional(),
				order: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...rest } = input
			const result = await ctx.prisma.propertyValue.update({
				where: { id },
				data: rest,
			})
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),

	deleteValue: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.prisma.propertyValue.delete({
				where: { id: input },
			})
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),

	reorderValues: adminProcedure
		.input(z.array(z.object({ id: z.string(), order: z.number().int() })))
		.mutation(async ({ ctx, input }) => {
			const updates = input.map(({ id, order }) =>
				ctx.prisma.propertyValue.update({ where: { id }, data: { order } }),
			)
			const result = await ctx.prisma.$transaction(updates)
			revalidatePath('/')
			revalidatePath('/admin/properties')
			return result
		}),
})
