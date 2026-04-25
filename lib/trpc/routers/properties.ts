import { z } from 'zod'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { generateSlug } from '@/shared/lib/generateSlug'

export const propertiesRouter = createTRPCRouter({
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
			include: { values: { orderBy: { order: 'asc' } } },
		})
	}),

	// Used by storefront carousel (brands, locations, etc.)
	getForCarousel: baseProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.property.findUnique({
				where: { slug: input.slug },
				include: {
					values: {
						orderBy: { order: 'asc' },
					},
				},
			})
		}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				hasPhoto: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slug = input.slug?.trim() || generateSlug(input.name)
			return ctx.prisma.property.create({
				data: { name: input.name, slug, hasPhoto: input.hasPhoto },
				include: { values: true },
			})
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				hasPhoto: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			return ctx.prisma.property.update({
				where: { id },
				data,
				include: { values: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.property.delete({ where: { id: input } })
	}),

	// ── PropertyValue CRUD ──

	createValue: adminProcedure
		.input(
			z.object({
				propertyId: z.string(),
				value: z.string().min(1),
				slug: z.string().optional(),
				photo: z.string().optional(),
				order: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slug = input.slug?.trim() || generateSlug(input.value)
			const lastValue = await ctx.prisma.propertyValue.findFirst({
				where: { propertyId: input.propertyId },
				orderBy: { order: 'desc' },
				select: { order: true },
			})
			const order = input.order ?? (lastValue?.order ?? -1) + 1
			return ctx.prisma.propertyValue.create({
				data: {
					propertyId: input.propertyId,
					value: input.value,
					slug,
					photo: input.photo,
					order,
				},
			})
		}),

	updateValue: adminProcedure
		.input(
			z.object({
				id: z.string(),
				value: z.string().min(1).optional(),
				slug: z.string().optional(),
				photo: z.string().nullable().optional(),
				order: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			return ctx.prisma.propertyValue.update({
				where: { id },
				data,
			})
		}),

	deleteValue: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.propertyValue.delete({ where: { id: input } })
		}),

	reorderValues: adminProcedure
		.input(z.array(z.object({ id: z.string(), order: z.number().int() })))
		.mutation(async ({ ctx, input }) => {
			await Promise.all(
				input.map(item =>
					ctx.prisma.propertyValue.update({
						where: { id: item.id },
						data: { order: item.order },
					}),
				),
			)
			return { ok: true }
		}),
})

