import { z } from 'zod'
import { createTRPCRouter, baseProcedure, editorProcedure } from '../init'
import { deleteFile } from '@/lib/storage'
import { withResolvedImageAsset } from '@/lib/storage-image-assets'
import { pageLegacySeoToFields, upsertSeoMetadata } from '@/lib/seo/metadata-persistence'
import { SectionBackgroundSchema, SectionTypeSchema } from '@/shared/types/sections'
import {
	createPageVersionSnapshotInput,
	replacePageSections,
} from '@/lib/sections/page-section-persistence'
import { PAGE_BLOCK_TYPES } from '@/shared/types/page-builder'
import {
	replacePageBlocks,
	pageBlocksToSnapshot,
} from '@/lib/pages/page-block-persistence'

const pageBlockInputSchema = z.object({
	id: z.string().optional(),
	type: z.enum(PAGE_BLOCK_TYPES),
	isActive: z.boolean().default(true),
	config: z.record(z.string(), z.unknown()),
})

const pageSectionBackgroundInputSchema = SectionBackgroundSchema

const pageSectionMediaItemInputSchema = z.object({
	storageKey: z.string().min(1),
	originalName: z.string().nullable().optional(),
	alt: z.string().nullable().optional(),
	role: z.string().nullable().optional(),
})

const pageSectionInputSchema = z.object({
	type: SectionTypeSchema,
	title: z.string().nullable().optional(),
	subtitle: z.string().nullable().optional(),
	anchor: z.string().nullable().optional(),
	isActive: z.boolean().default(true),
	background: pageSectionBackgroundInputSchema.nullable().optional(),
	config: z.record(z.string(), z.unknown()),
	manualProductIds: z.array(z.string()).optional(),
	manualCategoryIds: z.array(z.string()).optional(),
	mediaItems: z.array(pageSectionMediaItemInputSchema).optional(),
})

const homePageBasePayloadSchema = z.object({
	title: z.string().min(1).default('Главная'),
	sections: z.array(pageSectionInputSchema).default([]),
	isPublished: z.boolean().default(false),
})

export const pagesRouter = createTRPCRouter({
	getAdminList: editorProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(10),
				search: z.string().trim().default(''),
				sortBy: z
					.enum(['title', 'slug', 'createdAt', 'updatedAt', 'isPublished'])
					.default('updatedAt'),
				sortDir: z.enum(['asc', 'desc']).default('desc'),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = input.search
				? {
						OR: [
							{
								title: { contains: input.search, mode: 'insensitive' as const },
							},
							{
								slug: { contains: input.search, mode: 'insensitive' as const },
							},
						],
					}
				: undefined

			const [total, pages] = await Promise.all([
				ctx.prisma.page.count({ where }),
				ctx.prisma.page.findMany({
					where,
					include: {
						author: { select: { name: true, email: true } },
						_count: { select: { versions: true } },
					},
					orderBy: { [input.sortBy]: input.sortDir },
					skip: (input.page - 1) * input.pageSize,
					take: input.pageSize,
				}),
			])

			const cache = new Map()
			const items = await Promise.all(
				pages.map(page => withResolvedImageAsset(page, { cache })),
			)

			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize,
				pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
			}
		}),

	getPublished: baseProcedure.query(async ({ ctx }) => {
		const pages = await ctx.prisma.page.findMany({
			where: { isPublished: true },
			orderBy: { publishedAt: 'desc' },
		})

		const cache = new Map()
		return Promise.all(
			pages.map(page => withResolvedImageAsset(page, { cache })),
		)
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
		return Promise.all(
			pages.map(page => withResolvedImageAsset(page, { cache })),
		)
	}),

	getById: editorProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const page = await ctx.prisma.page.findUnique({
			where: { id: input },
			include: {
				sections: {
					orderBy: { order: 'asc' },
					include: {
						products: { orderBy: { order: 'asc' }, select: { productId: true } },
						categories: {
							orderBy: { order: 'asc' },
							select: { categoryId: true },
						},
						pages: {
							orderBy: { order: 'asc' },
							select: { targetPageId: true },
						},
						mediaItems: {
							orderBy: { order: 'asc' },
							include: {
								mediaAsset: {
									select: {
										storageKey: true,
										originalName: true,
										alt: true,
									},
								},
							},
						},
					},
				},
				blocks: {
					orderBy: { order: 'asc' },
				},
				versions: { orderBy: { version: 'desc' }, take: 10 },
			},
		})

		return page ? withResolvedImageAsset(page) : null
	}),

	getHomePage: editorProcedure.query(async ({ ctx }) => {
		const page = await ctx.prisma.page.findFirst({
			where: {
				OR: [{ kind: 'HOME' }, { slug: 'home' }],
			},
			include: {
				_count: { select: { sections: true } },
			},
			orderBy: { updatedAt: 'desc' },
		})

		return page
	}),

	create: editorProcedure
		.input(
			z.object({
				title: z.string().min(1),
				slug: z.string().min(1),
				content: z.string().optional(),
				contentBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
				showAsBanner: z.boolean().optional(),
				bannerImage: z.string().optional(),
				bannerLink: z.string().optional(),
				isSystem: z.boolean().optional(),
				image: z.string().optional(),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				isPublished: z.boolean().default(false),
				sections: z.array(pageSectionInputSchema).optional(),
				blocks: z.array(pageBlockInputSchema).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { sections, blocks, ...pageInput } = input

			return ctx.prisma.$transaction(async tx => {
				const page = await tx.page.create({
					data: {
						...pageInput,
						contentBlocks: input.contentBlocks as never,
						authorId: ctx.userId,
						publishedAt: input.isPublished ? new Date() : null,
					},
				})

				if (sections) {
					await replacePageSections(tx, page.id, sections)
				}

				if (blocks !== undefined) {
					await replacePageBlocks(tx, page.id, blocks)
				}

				await upsertSeoMetadata(tx, {
					targetType: 'page',
					targetId: page.id,
					fields: pageLegacySeoToFields({
						metaTitle: page.metaTitle,
						metaDesc: page.metaDesc,
					}),
				})

				await tx.pageVersion.create({
					data: {
						pageId: page.id,
						title: page.title,
						content: page.content,
						image: page.image,
						metaTitle: page.metaTitle,
						metaDesc: page.metaDesc,
						version: 1,
						createdBy: ctx.userId,
						...createPageVersionSnapshotInput({
							page,
							sections: sections ?? [],
						}),
						...(blocks !== undefined
							? { blocksSnapshot: pageBlocksToSnapshot(blocks) }
							: {}),
					},
				})

				return page
			})
		}),

	update: editorProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				slug: z.string().min(1).optional(),
				content: z.string().optional(),
				contentBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
				showAsBanner: z.boolean().optional(),
				bannerImage: z.string().optional(),
				bannerLink: z.string().optional(),
				isSystem: z.boolean().optional(),
				image: z.string().optional(),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				isPublished: z.boolean().optional(),
				sections: z.array(pageSectionInputSchema).optional(),
				blocks: z.array(pageBlockInputSchema).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, contentBlocks, sections, blocks, ...data } = input

			if (data.isPublished !== undefined) {
				;(data as Record<string, unknown>).publishedAt = data.isPublished
					? new Date()
					: null
			}

			return ctx.prisma.$transaction(async tx => {
				const page = await tx.page.update({
					where: { id },
					data: {
						...data,
						...(contentBlocks !== undefined
							? { contentBlocks: contentBlocks as never }
							: {}),
					},
				})

				if (sections) {
					await replacePageSections(tx, id, sections)
				}

				if (blocks !== undefined) {
					await replacePageBlocks(tx, id, blocks)
				}

				await upsertSeoMetadata(tx, {
					targetType: 'page',
					targetId: id,
					fields: pageLegacySeoToFields({
						metaTitle: page.metaTitle,
						metaDesc: page.metaDesc,
					}),
				})

				const lastVersion = await tx.pageVersion.findFirst({
					where: { pageId: id },
					orderBy: { version: 'desc' },
				})

				await tx.pageVersion.create({
					data: {
						pageId: id,
						title: page.title,
						content: page.content,
						image: page.image,
						metaTitle: page.metaTitle,
						metaDesc: page.metaDesc,
						version: (lastVersion?.version ?? 0) + 1,
						createdBy: ctx.userId,
						...createPageVersionSnapshotInput({
							page,
							sections: sections ?? [],
						}),
						...(blocks !== undefined
							? { blocksSnapshot: pageBlocksToSnapshot(blocks) }
							: {}),
					},
				})

				return page
			})
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

	upsertHomePageSections: editorProcedure
		.input(homePageBasePayloadSchema)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.$transaction(async tx => {
				const existing = await tx.page.findFirst({
					where: {
						OR: [{ kind: 'HOME' }, { slug: 'home' }],
					},
					orderBy: { updatedAt: 'desc' },
				})

				const pageData = {
					title: input.title,
					slug: 'home',
					kind: 'HOME' as const,
					status: input.isPublished ? ('PUBLISHED' as const) : ('DRAFT' as const),
					isPublished: input.isPublished,
					publishedAt: input.isPublished ? new Date() : null,
				}

				const page = existing
					? await tx.page.update({
						where: { id: existing.id },
						data: pageData,
					})
					: await tx.page.create({
						data: {
							...pageData,
							authorId: ctx.userId,
						},
					})

				await replacePageSections(tx, page.id, input.sections)

				const lastVersion = await tx.pageVersion.findFirst({
					where: { pageId: page.id },
					orderBy: { version: 'desc' },
				})

				await tx.pageVersion.create({
					data: {
						pageId: page.id,
						title: page.title,
						content: page.content,
						image: page.image,
						metaTitle: page.metaTitle,
						metaDesc: page.metaDesc,
						version: (lastVersion?.version ?? 0) + 1,
						createdBy: ctx.userId,
						...createPageVersionSnapshotInput({
							page,
							sections: input.sections,
						}),
					},
				})

				return tx.page.findUnique({
					where: { id: page.id },
					include: { _count: { select: { sections: true } } },
				})
			})
		}),
})
