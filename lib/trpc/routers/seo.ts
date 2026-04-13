import { z } from 'zod'
import { createTRPCRouter, adminProcedure, editorProcedure } from '../init'

const seoInput = z.object({
	targetType: z.enum(['product', 'category', 'page']),
	targetId: z.string(),
	title: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	keywords: z.string().nullable().optional(),
	ogTitle: z.string().nullable().optional(),
	ogDescription: z.string().nullable().optional(),
	ogImage: z.string().nullable().optional(),
	canonicalUrl: z.string().nullable().optional(),
	noIndex: z.boolean().optional(),
})

export const seoRouter = createTRPCRouter({
	getByTarget: editorProcedure
		.input(
			z.object({
				targetType: z.string(),
				targetId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.prisma.seoMetadata.findUnique({
				where: {
					targetType_targetId: {
						targetType: input.targetType,
						targetId: input.targetId,
					},
				},
			})
		}),

	update: editorProcedure.input(seoInput).mutation(async ({ ctx, input }) => {
		const { targetType, targetId, ...data } = input

		return ctx.prisma.seoMetadata.upsert({
			where: {
				targetType_targetId: { targetType, targetId },
			},
			create: {
				targetType,
				targetId,
				title: data.title ?? null,
				description: data.description ?? null,
				keywords: data.keywords ?? null,
				ogTitle: data.ogTitle ?? null,
				ogDescription: data.ogDescription ?? null,
				ogImage: data.ogImage ?? null,
				canonicalUrl: data.canonicalUrl ?? null,
				noIndex: data.noIndex ?? false,
			},
			update: {
				title: data.title ?? null,
				description: data.description ?? null,
				keywords: data.keywords ?? null,
				ogTitle: data.ogTitle ?? null,
				ogDescription: data.ogDescription ?? null,
				ogImage: data.ogImage ?? null,
				canonicalUrl: data.canonicalUrl ?? null,
				noIndex: data.noIndex ?? false,
			},
		})
	}),

	listAll: adminProcedure
		.input(
			z
				.object({
					targetType: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return ctx.prisma.seoMetadata.findMany({
				where: input?.targetType ? { targetType: input.targetType } : undefined,
				orderBy: { updatedAt: 'desc' },
			})
		}),
})
