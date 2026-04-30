import { z } from 'zod'
import { createTRPCRouter, adminProcedure, editorProcedure } from '../init'
import { SeoMetadataInputSchema, SeoTargetTypeSchema } from '@/shared/types/seo'

export const seoRouter = createTRPCRouter({
	getByTarget: editorProcedure
		.input(
			z.object({
				targetType: SeoTargetTypeSchema,
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

	update: editorProcedure
		.input(SeoMetadataInputSchema)
		.mutation(async ({ ctx, input }) => {
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
