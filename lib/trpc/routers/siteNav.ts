import { TRPCError } from '@trpc/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createTRPCRouter, baseProcedure, editorProcedure } from '../init'

const navZoneSchema = z.enum(['HEADER', 'FOOTER'])

const navItemInputSchema = z.object({
	pageId: z.string().min(1),
	labelOverride: z.string().trim().max(120).nullable().optional(),
	isActive: z.boolean().default(true),
})

const trimOrNull = (value: string | null | undefined): string | null => {
	if (typeof value !== 'string') {
		return null
	}
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

const ensurePublishedPage = async (
	ctx: {
		prisma: {
			page: {
				findUnique: (
					args: {
						where: { id: string }
						select: { id: true; isPublished: true }
					},
				) => Promise<{ id: string; isPublished: boolean } | null>
			}
		}
	},
	pageId: string,
) => {
	const page = await ctx.prisma.page.findUnique({
		where: { id: pageId },
		select: { id: true, isPublished: true },
	})

	if (!page || !page.isPublished) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message:
				'Можно привязать только опубликованную страницу. Опубликуйте страницу и повторите попытку.',
		})
	}
}

export const siteNavRouter = createTRPCRouter({
	getPublicByZone: baseProcedure
		.input(z.object({ zone: navZoneSchema }))
		.query(async ({ ctx, input }) => {
			const items = await ctx.prisma.siteNavItem.findMany({
				where: {
					zone: input.zone,
					isActive: true,
					page: { isPublished: true },
				},
				orderBy: { order: 'asc' },
				include: {
					page: {
						select: {
							id: true,
							title: true,
							slug: true,
						},
					},
				},
			})

			return items.map(item => ({
				id: item.id,
				pageId: item.pageId,
				label: item.labelOverride ?? item.page.title,
				href: `/${item.page.slug}`,
				order: item.order,
			}))
		}),

	getEditorState: editorProcedure
		.input(z.object({ zone: navZoneSchema }))
		.query(async ({ ctx, input }) => {
			const [items, pages] = await Promise.all([
				ctx.prisma.siteNavItem.findMany({
					where: { zone: input.zone },
					orderBy: { order: 'asc' },
					include: {
						page: {
							select: {
								id: true,
								title: true,
								slug: true,
								isPublished: true,
							},
						},
					},
				}),
				ctx.prisma.page.findMany({
					where: { isPublished: true },
					orderBy: [{ title: 'asc' }, { slug: 'asc' }],
					select: {
						id: true,
						title: true,
						slug: true,
					},
				}),
			])

			return {
				items: items.map(item => ({
					id: item.id,
					zone: item.zone,
					pageId: item.pageId,
					labelOverride: item.labelOverride,
					isActive: item.isActive,
					order: item.order,
					page: {
						id: item.page.id,
						title: item.page.title,
						slug: item.page.slug,
					},
				})),
				pages,
			}
		}),

	upsertItem: editorProcedure
		.input(
			z.object({
				id: z.string().optional(),
				zone: navZoneSchema,
				order: z.number().int().min(0).default(0),
				...navItemInputSchema.shape,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensurePublishedPage(ctx, input.pageId)

			if (input.id) {
				const duplicate = await ctx.prisma.siteNavItem.findFirst({
					where: {
						zone: input.zone,
						pageId: input.pageId,
						id: { not: input.id },
					},
					select: { id: true },
				})

				if (duplicate) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Эта страница уже добавлена в выбранную зону.',
					})
				}

				const result = await ctx.prisma.siteNavItem.update({
					where: { id: input.id },
					data: {
						zone: input.zone,
						pageId: input.pageId,
						order: input.order,
						isActive: input.isActive,
						labelOverride: trimOrNull(input.labelOverride),
					},
				})
				revalidatePath('/', 'layout')
				revalidatePath('/admin/navigation')
				return result
			}

			const existing = await ctx.prisma.siteNavItem.findUnique({
				where: {
					zone_pageId: {
						zone: input.zone,
						pageId: input.pageId,
					},
				},
				select: { id: true },
			})

			if (existing) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Эта страница уже добавлена в выбранную зону.',
				})
			}

			const result = await ctx.prisma.siteNavItem.create({
				data: {
					zone: input.zone,
					pageId: input.pageId,
					order: input.order,
					isActive: input.isActive,
					labelOverride: trimOrNull(input.labelOverride),
				},
			})
			revalidatePath('/', 'layout')
			revalidatePath('/admin/navigation')
			return result
		}),

	removeItem: editorProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.prisma.siteNavItem.delete({
				where: { id: input.id },
			})
			revalidatePath('/', 'layout')
			revalidatePath('/admin/navigation')
			return result
		}),

	reorder: editorProcedure
		.input(
			z.object({
				zone: navZoneSchema,
				items: z.array(
					z.object({
						id: z.string(),
						order: z.number().int().min(0),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updates = input.items.map(({ id, order }) =>
				ctx.prisma.siteNavItem.updateMany({
					where: { id, zone: input.zone },
					data: { order },
				}),
			)
			await ctx.prisma.$transaction(updates)
			revalidatePath('/', 'layout')
			revalidatePath('/admin/navigation')
			return { ok: true }
		}),

	replaceZone: editorProcedure
		.input(
			z.object({
				zone: navZoneSchema,
				items: z.array(navItemInputSchema),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const seenPageIds = new Set<string>()
			for (const item of input.items) {
				if (seenPageIds.has(item.pageId)) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Одна и та же страница не может быть добавлена дважды в одной зоне.',
					})
				}
				seenPageIds.add(item.pageId)
			}

			await Promise.all(input.items.map(item => ensurePublishedPage(ctx, item.pageId)))

			await ctx.prisma.$transaction(async tx => {
				await tx.siteNavItem.deleteMany({ where: { zone: input.zone } })
				if (input.items.length > 0) {
					await tx.siteNavItem.createMany({
						data: input.items.map((item, index) => ({
							zone: input.zone,
							pageId: item.pageId,
							labelOverride: trimOrNull(item.labelOverride),
							isActive: item.isActive,
							order: index,
						})),
					})
				}
			})

			revalidatePath('/', 'layout')
			revalidatePath('/admin/navigation')
			return { ok: true }
		}),
})
