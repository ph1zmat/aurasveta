import { z } from 'zod'
import { unlink } from 'fs/promises'
import path from 'path'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

export const categoriesRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			include: { children: true, _count: { select: { products: true } } },
			orderBy: { name: 'asc' },
		})
	}),

	getTree: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			where: { parentId: null },
			include: {
				children: {
					include: {
						children: true,
						_count: { select: { products: true } },
					},
				},
				_count: { select: { products: true } },
			},
			orderBy: { name: 'asc' },
		})
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.category.findUnique({
			where: { slug: input },
			include: {
				children: true,
				parent: true,
				_count: { select: { products: true } },
			},
		})
	}),

	getNav: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			where: { parentId: null },
			select: { id: true, name: true, slug: true },
			orderBy: { name: 'asc' },
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().min(1),
				description: z.string().optional(),
				image: z.string().optional(),
				parentId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.category.create({ data: input })
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				description: z.string().optional(),
				image: z.string().optional(),
				parentId: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			return ctx.prisma.category.update({ where: { id }, data })
		}),

	updateImagePath: adminProcedure
		.input(
			z.object({
				categoryId: z.string(),
				imagePath: z.string().nullable(),
				imageOriginalName: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.category.update({
				where: { id: input.categoryId },
				data: {
					imagePath: input.imagePath,
					imageOriginalName: input.imageOriginalName ?? null,
				},
				select: { id: true, imagePath: true },
			})
		}),

	removeImage: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const category = await ctx.prisma.category.findUnique({
				where: { id: input },
				select: { imagePath: true },
			})

			if (category?.imagePath) {
				const fileName = path.basename(category.imagePath)
				const fullPath = path.join(
					process.cwd(),
					'public',
					'productimg',
					fileName,
				)
				try {
					await unlink(fullPath)
				} catch {
					/* file may not exist */
				}
			}

			return ctx.prisma.category.update({
				where: { id: input },
				data: { imagePath: null, imageOriginalName: null },
				select: { id: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.category.delete({ where: { id: input } })
	}),
})
