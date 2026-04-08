import { z } from 'zod'
import { unlink } from 'fs/promises'
import path from 'path'
import { createTRPCRouter, baseProcedure, editorProcedure } from '../init'

export const pagesRouter = createTRPCRouter({
	getPublished: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.page.findMany({
			where: { isPublished: true },
			orderBy: { publishedAt: 'desc' },
		})
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.page.findUnique({
			where: { slug: input, isPublished: true },
		})
	}),

	getAll: editorProcedure.query(async ({ ctx }) => {
		return ctx.prisma.page.findMany({
			include: {
				author: { select: { name: true, email: true } },
				_count: { select: { versions: true } },
			},
			orderBy: { updatedAt: 'desc' },
		})
	}),

	getById: editorProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.page.findUnique({
			where: { id: input },
			include: {
				versions: { orderBy: { version: 'desc' }, take: 10 },
			},
		})
	}),

	create: editorProcedure
		.input(
			z.object({
				title: z.string().min(1),
				slug: z.string().min(1),
				content: z.string().optional(),
				image: z.string().optional(),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				isPublished: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const page = await ctx.prisma.page.create({
				data: {
					...input,
					authorId: ctx.userId,
					publishedAt: input.isPublished ? new Date() : null,
				},
			})

			// Create initial version
			await ctx.prisma.pageVersion.create({
				data: {
					pageId: page.id,
					title: page.title,
					content: page.content,
					image: page.image,
					metaTitle: page.metaTitle,
					metaDesc: page.metaDesc,
					version: 1,
					createdBy: ctx.userId,
				},
			})

			return page
		}),

	update: editorProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				content: z.string().optional(),
				image: z.string().optional(),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				isPublished: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input

			if (data.isPublished !== undefined) {
				;(data as Record<string, unknown>).publishedAt = data.isPublished
					? new Date()
					: null
			}

			const page = await ctx.prisma.page.update({
				where: { id },
				data,
			})

			// Auto-version
			const lastVersion = await ctx.prisma.pageVersion.findFirst({
				where: { pageId: id },
				orderBy: { version: 'desc' },
			})

			await ctx.prisma.pageVersion.create({
				data: {
					pageId: id,
					title: page.title,
					content: page.content,
					image: page.image,
					metaTitle: page.metaTitle,
					metaDesc: page.metaDesc,
					version: (lastVersion?.version ?? 0) + 1,
					createdBy: ctx.userId,
				},
			})

			return page
		}),

	updateImagePath: editorProcedure
		.input(
			z.object({
				pageId: z.string(),
				imagePath: z.string().nullable(),
				imageOriginalName: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.page.update({
				where: { id: input.pageId },
				data: {
					imagePath: input.imagePath,
					imageOriginalName: input.imageOriginalName ?? null,
				},
				select: { id: true, imagePath: true },
			})
		}),

	removeImage: editorProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const page = await ctx.prisma.page.findUnique({
				where: { id: input },
				select: { imagePath: true },
			})

			if (page?.imagePath) {
				const fileName = path.basename(page.imagePath)
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

			return ctx.prisma.page.update({
				where: { id: input },
				data: { imagePath: null, imageOriginalName: null },
				select: { id: true },
			})
		}),

	delete: editorProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.page.delete({ where: { id: input } })
	}),
})
