import { z } from 'zod'
import { createTRPCRouter, baseProcedure, editorProcedure } from '../init'
import { deleteFile } from '@/lib/storage'
import { withResolvedImageAsset } from '@/lib/storage-image-assets'

export const pagesRouter = createTRPCRouter({
	getPublished: baseProcedure.query(async ({ ctx }) => {
		const pages = await ctx.prisma.page.findMany({
			where: { isPublished: true },
			orderBy: { publishedAt: 'desc' },
		})

		const cache = new Map()
		return Promise.all(pages.map(page => withResolvedImageAsset(page, { cache })))
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const page = await ctx.prisma.page.findUnique({
			where: { slug: input, isPublished: true },
		})

		return page ? withResolvedImageAsset(page) : null
	}),

	getAll: editorProcedure.query(async ({ ctx }) => {
		const pages = await ctx.prisma.page.findMany({
			include: {
				author: { select: { name: true, email: true } },
				_count: { select: { versions: true } },
			},
			orderBy: { updatedAt: 'desc' },
		})

		const cache = new Map()
		return Promise.all(pages.map(page => withResolvedImageAsset(page, { cache })))
	}),

	getById: editorProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const page = await ctx.prisma.page.findUnique({
			where: { id: input },
			include: {
				versions: { orderBy: { version: 'desc' }, take: 10 },
			},
		})

		return page ? withResolvedImageAsset(page) : null
	}),

	create: editorProcedure
		.input(
			z.object({
				title: z.string().min(1),
				slug: z.string().min(1),
				content: z.string().optional(),
				contentBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
				seo: z.record(z.string(), z.unknown()).optional(),
				showAsBanner: z.boolean().optional(),
				bannerImage: z.string().optional(),
				bannerLink: z.string().optional(),
				isSystem: z.boolean().optional(),
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
					contentBlocks: input.contentBlocks as never,
					seo: input.seo as never,
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
				contentBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
				seo: z.record(z.string(), z.unknown()).optional(),
				showAsBanner: z.boolean().optional(),
				bannerImage: z.string().optional(),
				bannerLink: z.string().optional(),
				isSystem: z.boolean().optional(),
				image: z.string().optional(),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				isPublished: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, contentBlocks, seo, ...data } = input

			if (data.isPublished !== undefined) {
				;(data as Record<string, unknown>).publishedAt = data.isPublished
					? new Date()
					: null
			}

			const page = await ctx.prisma.page.update({
				where: { id },
				data: {
					...data,
					...(contentBlocks !== undefined
						? { contentBlocks: contentBlocks as never }
						: {}),
					...(seo !== undefined ? { seo: seo as never } : {}),
				},
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
				try {
					await deleteFile(page.imagePath)
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
