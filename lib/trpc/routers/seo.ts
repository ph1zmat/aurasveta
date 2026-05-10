import { z } from 'zod'
import Papa from 'papaparse'
import { Prisma } from '@prisma/client'
import { createTRPCRouter, adminProcedure, editorProcedure } from '../init'
import { SeoMetadataInputSchema, SeoTargetTypeSchema } from '@/shared/types/seo'
import { normalizeSeoFields, upsertSeoMetadata } from '@/lib/seo/metadata-persistence'
import {
	generateProductResult,
	generateCategoryResult,
	generatePageResult,
} from '@/lib/seo/domain/generator'
import type { BulkPreviewResult, BulkApplyResult, SeoEntityType } from '@/lib/seo/domain/types'
import { BULK_BATCH_SIZE, BULK_SAMPLE_SIZE } from '@/lib/seo/domain/rules'
import { computeSeoAudit } from '@/lib/seo/domain/audit'
import { detectCannibalizationCandidates } from '@/lib/seo/domain/cannibalization'
import { prioritizeExternalSignal, summarizeExternalTriage } from '@/lib/seo/domain/external-triage'
import { buildSnippetSuggestion } from '@/lib/seo/domain/snippet-suggestions'
import { rankRuleScoredSnippetSuggestion } from '@/lib/seo/domain/snippet-suggestions-scored'
import { mergeHybridSnippetSuggestion } from '@/lib/seo/domain/snippet-suggestions-hybrid'
import { buildStaleContentQueue } from '@/lib/seo/domain/stale-content'
import { buildWeeklyTriageBoard } from '@/lib/seo/domain/weekly-triage'
import { fetchExternalQueryUrlSignals } from '@/lib/seo/external/cannibalization'
import { fetchExternalSignals } from '@/lib/seo/external'
import { fetchAiSnippetDrafts } from '@/lib/seo/external/snippet-ai'
import { fetchExternalStaleSignals } from '@/lib/seo/external/stale-content'

const BASE_URL = 'https://aurasveta.by'

const SeoFilterSchema = z.enum(['all', 'missing-title', 'missing-desc', 'noindex'])
const ExternalProviderSchema = z.enum(['google-search-console', 'yandex-webmaster'])
const ExternalIndexingStatusSchema = z.enum(['indexed', 'excluded', 'error', 'unknown'])
const ExternalPriorityFilterSchema = z.enum(['all', 'p1', 'p1-p2'])
const CannibalizationConfidenceSchema = z.enum(['all', 'high'])
const StaleQueueTargetTypeSchema = z.enum(['all', 'product', 'category', 'page'])
const SnippetSuggestionModeSchema = z.enum(['rule', 'rule-scored', 'hybrid'])
const AiSnippetProviderSchema = z.enum(['stub-gpt'])
const SnippetTrialOutcomeSchema = z.enum(['promote', 'keep-testing', 'reject'])
const SnippetTrialVariantSchema = z.enum(['base', 'commercial', 'delivery', 'hybrid', 'rule'])
const SnippetTrialTargetTypeSchema = z.enum(['all', 'product', 'category', 'page'])
const WeeklyTriageZoneSchema = z.enum(['product', 'category', 'page', 'tech'])
const WeeklyTriageDecisionSchema = z.enum([
	'safe-bulk-fix',
	'manual-review',
	'monitor',
	'tech-check',
])
const WeeklyFollowUpOutcomeSchema = z.enum(['reviewed', 'deferred'])
type SeoTargetType = z.infer<typeof SeoTargetTypeSchema>

function isSeoTargetType(value: string): value is SeoTargetType {
	return value === 'product' || value === 'category' || value === 'page'
}

const ExternalSignalInputSchema = z.object({
	targetType: SeoTargetTypeSchema,
	targetId: z.string(),
	url: z.string().url(),
	impressions: z.number().min(0),
	clicks: z.number().min(0),
	ctr: z.number().min(0).max(1),
	position: z.number().min(0),
	coverageErrors: z.number().min(0).int(),
	indexingStatus: ExternalIndexingStatusSchema,
})

const DateYmdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const BulkGenerateInputSchema = z.object({
	targetType: SeoTargetTypeSchema,
	mode: z.enum(['strict', 'safe-overwrite', 'force']).default('strict'),
	/** Обрабатывать только сущности без записи в SeoMetadata */
	onlyMissing: z.boolean().default(false),
	/** Ограниченный список ID (опционально) */
	ids: z.array(z.string()).optional(),
	limit: z.number().min(1).max(BULK_BATCH_SIZE).default(BULK_BATCH_SIZE),
	cursor: z.string().optional(),
})

function buildPublicUrl(
	targetType: string,
	slug: string | null | undefined,
	targetId: string,
) {
	if (!slug) return `${BASE_URL}/${targetType}/${targetId}`
	if (targetType === 'product') return `${BASE_URL}/product/${slug}`
	if (targetType === 'category') return `${BASE_URL}/catalog/${slug}`
	return `${BASE_URL}/pages/${slug}`
}

function getAuditPriority(args: {
	title: string | null
	description: string | null
	ogImage: string | null
	noIndex: boolean
	canonicalUrl: string | null
}) {
	if (!args.title || args.noIndex) return 'P1'
	if (!args.description || !args.ogImage) return 'P2'
	if (args.canonicalUrl && !/^https?:\/\//i.test(args.canonicalUrl)) return 'P2'
	return 'P3'
}

async function createSeoOperationLog(
	ctx: {
		prisma: { importOperation?: { create: (args: { data: Prisma.ImportOperationCreateInput }) => Promise<unknown> } }
		session?: { user?: { id?: string; email?: string | null; name?: string | null } } | null
	},
	data: {
		type: string
		status: string
		count: number
		meta?: Record<string, unknown>
	},
) {
	if (!ctx.prisma.importOperation?.create) return
	const operator = ctx.session?.user
	await ctx.prisma.importOperation.create({
		data: {
			type: data.type,
			status: data.status,
			count: data.count,
			meta: {
				module: 'seo',
				operatorId: operator?.id ?? null,
				operatorEmail: operator?.email ?? null,
				operatorName: operator?.name ?? null,
				...(data.meta ?? {}),
			} as Prisma.InputJsonValue,
		},
	})
}

function getJsonObjectMeta(meta: Prisma.JsonValue | null | undefined) {
	if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
		return meta as Record<string, unknown>
	}
	return {}
}

function startOfLocalDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

function rankExternalPriority(priority: 'P1' | 'P2' | 'P3' | 'P4') {
	const rank = { P1: 0, P2: 1, P3: 2, P4: 3 } as const
	return rank[priority]
}

function filterExternalPrioritizedItems<T extends { priority: 'P1' | 'P2' | 'P3' | 'P4' }>(
	items: T[],
	filter: 'all' | 'p1' | 'p1-p2',
) {
	if (filter === 'p1') return items.filter(item => item.priority === 'P1')
	if (filter === 'p1-p2') {
		return items.filter(item => item.priority === 'P1' || item.priority === 'P2')
	}
	return items
}

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

	/**
	 * H2: Экспорт SEO-аудита в CSV по текущим фильтрам экрана.
	 */
	exportAuditCsv: adminProcedure
		.input(
			z.object({
				targetType: SeoTargetTypeSchema.optional(),
				filter: SeoFilterSchema.default('all'),
			}),
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.prisma.seoMetadata.findMany({
				where: input.targetType ? { targetType: input.targetType } : undefined,
				select: {
					targetType: true,
					targetId: true,
					title: true,
					description: true,
					canonicalUrl: true,
					noIndex: true,
					ogImage: true,
					updatedAt: true,
				},
				orderBy: { updatedAt: 'desc' },
			})

			const filtered = rows.filter(item => {
				if (input.filter === 'missing-title') return !item.title
				if (input.filter === 'missing-desc') return !item.description
				if (input.filter === 'noindex') return item.noIndex
				return true
			})

			const productIds = filtered
				.filter(r => r.targetType === 'product')
				.map(r => r.targetId)
			const categoryIds = filtered
				.filter(r => r.targetType === 'category')
				.map(r => r.targetId)
			const pageIds = filtered
				.filter(r => r.targetType === 'page')
				.map(r => r.targetId)

			const [products, categories, pages] = await Promise.all([
				productIds.length
					? ctx.prisma.product.findMany({
							where: { id: { in: productIds } },
							select: { id: true, slug: true },
						})
					: [],
				categoryIds.length
					? ctx.prisma.category.findMany({
							where: { id: { in: categoryIds } },
							select: { id: true, slug: true },
						})
					: [],
				pageIds.length
					? ctx.prisma.page.findMany({
							where: { id: { in: pageIds } },
							select: { id: true, slug: true },
						})
					: [],
			])

			const productSlugMap = new Map(products.map(p => [p.id, p.slug]))
			const categorySlugMap = new Map(categories.map(c => [c.id, c.slug]))
			const pageSlugMap = new Map(pages.map(p => [p.id, p.slug]))

			const exportRows = filtered.map(item => {
				const scoreResult = computeSeoAudit(
					normalizeSeoFields({
						title: item.title,
						description: item.description,
						ogImage: item.ogImage,
						canonicalUrl: item.canonicalUrl,
						noIndex: item.noIndex,
					}),
				)

				const slug =
					item.targetType === 'product'
						? productSlugMap.get(item.targetId)
						: item.targetType === 'category'
							? categorySlugMap.get(item.targetId)
							: pageSlugMap.get(item.targetId)

				return {
					targetType: item.targetType,
					targetId: item.targetId,
					url: buildPublicUrl(item.targetType, slug, item.targetId),
					severity: getAuditPriority({
						title: item.title,
						description: item.description,
						ogImage: item.ogImage,
						noIndex: item.noIndex,
						canonicalUrl: item.canonicalUrl,
					}),
					issues: scoreResult.flags.map(f => f.code).join(',') || 'OK',
					title: item.title ?? '',
					description: item.description ?? '',
					canonical: item.canonicalUrl ?? '',
					noIndex: item.noIndex,
					score: scoreResult.score,
					updatedAt: item.updatedAt.toISOString(),
				}
			})

			const csv = Papa.unparse(exportRows, {
				header: true,
				newline: '\n',
			})

			await createSeoOperationLog(ctx, {
				type: 'seo-export',
				status: 'COMPLETED',
				count: exportRows.length,
				meta: {
					action: 'exportAuditCsv',
					targetType: input.targetType ?? 'all',
					filter: input.filter,
				},
			})

			return { csv, count: exportRows.length }
		}),

	/**
	 * H1/H4/H5: Операционная сводка SEO (daily + weekly).
	 */
	operationsOverview: adminProcedure.query(async ({ ctx }) => {
		const now = new Date()
		const oneDayAgo = new Date(now)
		oneDayAgo.setDate(oneDayAgo.getDate() - 1)
		const sevenDaysAgo = new Date(now)
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		const [seoRows, logs24h, logs7d, duplicateCanonical] = await Promise.all([
			ctx.prisma.seoMetadata.findMany({
				select: {
					title: true,
					description: true,
					ogImage: true,
					canonicalUrl: true,
					noIndex: true,
					updatedAt: true,
				},
			}),
			ctx.prisma.importOperation.findMany({
				where: {
					type: { startsWith: 'seo-' },
					createdAt: { gte: oneDayAgo },
				},
				select: { type: true, status: true },
			}),
			ctx.prisma.importOperation.findMany({
				where: {
					type: { startsWith: 'seo-' },
					createdAt: { gte: sevenDaysAgo },
				},
				select: { type: true, status: true, count: true },
			}),
			ctx.prisma.seoMetadata.groupBy({
				by: ['canonicalUrl'],
				where: { canonicalUrl: { not: null } },
				_count: { canonicalUrl: true },
			}),
		])

		const scores = seoRows.map(item =>
			computeSeoAudit(
				normalizeSeoFields({
					title: item.title,
					description: item.description,
					ogImage: item.ogImage,
					canonicalUrl: item.canonicalUrl,
					noIndex: item.noIndex,
				}),
			),
		)

		const p1Count = seoRows.filter(item => !item.title || item.noIndex).length
		const p2Count = seoRows.filter(
			item => (!!item.title && !item.noIndex) && (!item.description || !item.ogImage),
		).length

		const total = seoRows.length || 1
		const titleFilledPct =
			(Math.round((seoRows.filter(i => !!i.title).length / total) * 10000) / 100)
		const descriptionFilledPct =
			(Math.round((seoRows.filter(i => !!i.description).length / total) * 10000) / 100)
		const ogFilledPct =
			(Math.round((seoRows.filter(i => !!i.ogImage).length / total) * 10000) / 100)

		const noIndexCurrentWeek = seoRows.filter(
			item => item.noIndex && item.updatedAt >= sevenDaysAgo,
		).length
		const noIndexPreviousWeek = seoRows.filter(
			item => item.noIndex && item.updatedAt < sevenDaysAgo,
		).length

		const averageScore =
			scores.length > 0
				? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
				: 0

		const dailyBulkErrors = logs24h.filter(
			log => log.type === 'seo-bulk-apply' && log.status !== 'COMPLETED',
		).length

		const weeklyBulkApplied = logs7d
			.filter(log => log.type === 'seo-bulk-apply' && log.status === 'COMPLETED')
			.reduce((sum, log) => sum + log.count, 0)

		const duplicateCanonicalCount = duplicateCanonical.filter(
			d => (d._count.canonicalUrl ?? 0) > 1,
		).length

		return {
			daily: {
				bulkErrors: dailyBulkErrors,
				p1Count,
				p2Count,
				criticalIntegrityErrors: duplicateCanonicalCount,
			},
			weekly: {
				titleFilledPct,
				descriptionFilledPct,
				ogFilledPct,
				averageScore,
				noIndexCurrentWeek,
				noIndexPreviousWeek,
				weeklyBulkApplied,
				duplicateCanonicalCount,
			},
		}
	}),

	/**
	 * H7.1: Read-only preview рекомендаций по title/description.
	 * Не изменяет seoMetadata и работает как слой подсказок поверх audit/triage.
	 */
	snippetSuggestionsPreview: adminProcedure
		.input(
			z.object({
				targetType: SeoTargetTypeSchema.optional(),
				filter: SeoFilterSchema.default('all'),
				provider: ExternalProviderSchema.default('google-search-console'),
				mode: SnippetSuggestionModeSchema.default('rule'),
				aiProvider: AiSnippetProviderSchema.default('stub-gpt'),
				includeExternal: z.boolean().default(true),
				limit: z.number().min(1).max(25).default(8),
			}),
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.prisma.seoMetadata.findMany({
				where: input.targetType ? { targetType: input.targetType } : undefined,
				select: {
					targetType: true,
					targetId: true,
					title: true,
					description: true,
					ogImage: true,
					canonicalUrl: true,
					noIndex: true,
					updatedAt: true,
				},
				orderBy: { updatedAt: 'desc' },
			})

			const filtered = rows.filter(item => {
				if (input.filter === 'missing-title') return !item.title
				if (input.filter === 'missing-desc') return !item.description
				if (input.filter === 'noindex') return item.noIndex
				return true
			})

			const limitedRows = filtered.slice(0, Math.max(input.limit * 3, 20))

			const productIds = limitedRows.filter(r => r.targetType === 'product').map(r => r.targetId)
			const categoryIds = limitedRows.filter(r => r.targetType === 'category').map(r => r.targetId)
			const pageIds = limitedRows.filter(r => r.targetType === 'page').map(r => r.targetId)

			const [products, categories, pages, external] = await Promise.all([
				productIds.length
					? ctx.prisma.product.findMany({
							where: { id: { in: productIds } },
							select: { id: true, name: true, description: true, brand: true, slug: true },
						})
					: [],
				categoryIds.length
					? ctx.prisma.category.findMany({
							where: { id: { in: categoryIds } },
							select: { id: true, name: true, description: true, slug: true },
						})
					: [],
				pageIds.length
					? ctx.prisma.page.findMany({
							where: { id: { in: pageIds } },
							select: { id: true, title: true, content: true, slug: true },
						})
					: [],
				input.includeExternal
					? fetchExternalSignals(input.provider, { limit: Math.max(input.limit * 3, 20) })
					: Promise.resolve(null),
			])

			const productMap = new Map(products.map(item => [item.id, item]))
			const categoryMap = new Map(categories.map(item => [item.id, item]))
			const pageMap = new Map(pages.map(item => [item.id, item]))
			const externalMap = new Map(
				(external?.signals ?? []).map(signal => [
					`${signal.targetType}:${signal.targetId}`,
					{
						impressions: signal.impressions,
						ctr: signal.ctr,
						position: signal.position,
					},
				]),
			)

			const ruleSuggestions = limitedRows
				.map(item => {
					if (!isSeoTargetType(item.targetType)) return null

					const entity =
						item.targetType === 'product'
							? productMap.get(item.targetId)
							: item.targetType === 'category'
								? categoryMap.get(item.targetId)
								: pageMap.get(item.targetId)

					if (!entity) return null

					const priority = getAuditPriority({
						title: item.title,
						description: item.description,
						ogImage: item.ogImage,
						noIndex: item.noIndex,
						canonicalUrl: item.canonicalUrl,
					})

					const entityName =
						'title' in entity
							? entity.title
							: entity.name

					const entityDescription =
						'content' in entity
							? entity.content
							: entity.description

					return buildSnippetSuggestion({
						targetType: item.targetType,
						targetId: item.targetId,
						entityName,
						url: buildPublicUrl(item.targetType, entity.slug, item.targetId),
						currentTitle: item.title,
						currentDescription: item.description,
						brand:
							'brand' in entity && typeof entity.brand === 'string'
								? entity.brand
								: null,
						entityDescription,
						noIndex: item.noIndex,
						priority,
						externalContext: externalMap.get(`${item.targetType}:${item.targetId}`) ?? null,
					})
				})
				.filter((item): item is NonNullable<typeof item> => item !== null)

			const aiDraftResult =
				input.mode === 'hybrid'
					? await fetchAiSnippetDrafts({
							provider: input.aiProvider,
							limit: ruleSuggestions.length,
							items: ruleSuggestions.map(item => ({
								targetType: item.targetType,
								targetId: item.targetId,
								entityName: item.entityName,
								currentTitle: item.currentTitle,
								currentDescription: item.currentDescription,
							})),
						})
					: null

			const aiDraftMap = new Map(
				(aiDraftResult?.drafts ?? []).map(item => [
					`${item.targetType}:${item.targetId}`,
					item,
				]),
			)

			const suggestions = ruleSuggestions
				.map(item =>
					input.mode === 'hybrid'
						? mergeHybridSnippetSuggestion({
								rule: item,
								aiDraft: aiDraftMap.get(`${item.targetType}:${item.targetId}`) ?? null,
							})
						: input.mode === 'rule-scored'
							? rankRuleScoredSnippetSuggestion(item)
							: item,
				)
				.sort((a, b) => {
					const priorityDelta = rankExternalPriority(a.priority) - rankExternalPriority(b.priority)
					if (priorityDelta !== 0) return priorityDelta
					return (b.externalContext?.impressions ?? 0) - (a.externalContext?.impressions ?? 0)
				})
				.slice(0, input.limit)

			await createSeoOperationLog(ctx, {
				type: 'seo-snippet-suggestions-preview',
				status: 'COMPLETED',
				count: suggestions.length,
				meta: {
					action: 'snippetSuggestionsPreview',
					targetType: input.targetType ?? 'all',
					filter: input.filter,
					mode: input.mode,
					aiProvider: input.mode === 'hybrid' ? input.aiProvider : null,
					provider: input.includeExternal ? input.provider : null,
					includeExternal: input.includeExternal,
					source: input.mode,
				},
			})

			return {
				generatedAt: new Date().toISOString(),
				source: input.mode,
				mode: input.mode,
				aiProvider: input.mode === 'hybrid' ? input.aiProvider : null,
				provider: input.includeExternal ? input.provider : null,
				summary: {
					total: suggestions.length,
					lowRisk: suggestions.filter(item => item.risk === 'low').length,
					mediumRisk: suggestions.filter(item => item.risk === 'medium').length,
					withExternalContext: suggestions.filter(item => item.externalContext !== null).length,
					hybridApplied:
						input.mode === 'hybrid'
							? suggestions.filter(item => item.source === 'hybrid').length
							: 0,
					ruleScoredSelected:
						input.mode === 'rule-scored'
							? suggestions.filter(item => item.scoring?.strategy === 'rule-scored').length
							: 0,
				},
				items: suggestions,
			}
		}),

	/**
	 * H7.2: Read-only preview кандидатов на каннибализацию query->URL.
	 */
	cannibalizationPreview: adminProcedure
		.input(
			z.object({
				provider: ExternalProviderSchema.default('google-search-console'),
				dateFrom: DateYmdSchema.optional(),
				dateTo: DateYmdSchema.optional(),
				minImpressions: z.number().min(1).max(10000).default(100),
				maxPosition: z.number().min(1).max(100).default(25),
				confidence: CannibalizationConfidenceSchema.default('all'),
				limit: z.number().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const external = await fetchExternalQueryUrlSignals({
				provider: input.provider,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				limit: Math.max(input.limit * 3, 20),
			})

			const allCandidates = detectCannibalizationCandidates({
				signals: external.signals,
				minImpressions: input.minImpressions,
				maxPosition: input.maxPosition,
				limit: input.limit * 2,
			})

			const filtered =
				input.confidence === 'high'
					? allCandidates.filter(item => item.confidence === 'high').slice(0, input.limit)
					: allCandidates.slice(0, input.limit)

			await createSeoOperationLog(ctx, {
				type: 'seo-cannibalization-preview',
				status: 'COMPLETED',
				count: filtered.length,
				meta: {
					action: 'cannibalizationPreview',
					provider: input.provider,
					source: external.source,
					dateFrom: input.dateFrom ?? null,
					dateTo: input.dateTo ?? null,
					minImpressions: input.minImpressions,
					maxPosition: input.maxPosition,
					confidence: input.confidence,
				},
			})

			return {
				provider: input.provider,
				source: external.source,
				generatedAt: new Date().toISOString(),
				totalSignals: external.signals.length,
				totalCandidates: filtered.length,
				summary: {
					high: filtered.filter(item => item.confidence === 'high').length,
					medium: filtered.filter(item => item.confidence === 'medium').length,
				},
				items: filtered,
			}
		}),

	/**
	 * H7.3: Read-only очередь stale-content задач.
	 */
	staleContentQueuePreview: adminProcedure
		.input(
			z.object({
				provider: ExternalProviderSchema.default('google-search-console'),
				targetType: StaleQueueTargetTypeSchema.default('all'),
				dateFrom: DateYmdSchema.optional(),
				dateTo: DateYmdSchema.optional(),
				minAgeDays: z.number().min(7).max(365).default(30),
				minImpressions: z.number().min(10).max(10000).default(100),
				minImpressionsGrowthPct: z.number().min(1).max(300).default(20),
				minCtrDropPct: z.number().min(1).max(100).default(15),
				minWeakPosition: z.number().min(1).max(100).default(10),
				limit: z.number().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const external = await fetchExternalStaleSignals({
				provider: input.provider,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				limit: Math.max(input.limit * 3, 20),
			})

			const targetFilteredSignals =
				input.targetType === 'all'
					? external.signals
					: external.signals.filter(signal => signal.targetType === input.targetType)

			const productIds = targetFilteredSignals.filter(s => s.targetType === 'product').map(s => s.targetId)
			const categoryIds = targetFilteredSignals.filter(s => s.targetType === 'category').map(s => s.targetId)
			const pageIds = targetFilteredSignals.filter(s => s.targetType === 'page').map(s => s.targetId)

			const [products, categories, pages] = await Promise.all([
				productIds.length
					? ctx.prisma.product.findMany({
							where: { id: { in: productIds } },
							select: { id: true, name: true, slug: true, updatedAt: true },
						})
					: [],
				categoryIds.length
					? ctx.prisma.category.findMany({
							where: { id: { in: categoryIds } },
							select: { id: true, name: true, slug: true, updatedAt: true },
						})
					: [],
				pageIds.length
					? ctx.prisma.page.findMany({
							where: { id: { in: pageIds } },
							select: { id: true, title: true, slug: true, updatedAt: true },
						})
					: [],
			])

			const now = Date.now()
			const productMap = new Map(products.map(item => [item.id, item]))
			const categoryMap = new Map(categories.map(item => [item.id, item]))
			const pageMap = new Map(pages.map(item => [item.id, item]))

			const queue = buildStaleContentQueue({
				signals: targetFilteredSignals.map(signal => {
					const entity =
						signal.targetType === 'product'
							? productMap.get(signal.targetId)
							: signal.targetType === 'category'
								? categoryMap.get(signal.targetId)
								: pageMap.get(signal.targetId)

					const updatedAt = entity?.updatedAt ?? new Date(now - 90 * 24 * 60 * 60 * 1000)
					const daysSinceContentUpdate = Math.max(
						0,
						Math.floor((now - updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
					)

					return {
						targetType: signal.targetType,
						targetId: signal.targetId,
						entityName:
							entity
								? 'title' in entity
									? entity.title
									: entity.name
								: signal.targetId,
						url:
							entity?.slug
								? buildPublicUrl(signal.targetType, entity.slug, signal.targetId)
								: signal.url,
						currentImpressions: signal.currentImpressions,
						previousImpressions: signal.previousImpressions,
						currentCtr: signal.currentCtr,
						previousCtr: signal.previousCtr,
						currentPosition: signal.currentPosition,
						daysSinceContentUpdate,
					}
				}),
				minAgeDays: input.minAgeDays,
				minImpressions: input.minImpressions,
				minImpressionsGrowthPct: input.minImpressionsGrowthPct,
				minCtrDropPct: input.minCtrDropPct,
				minWeakPosition: input.minWeakPosition,
				limit: input.limit,
			})

			await createSeoOperationLog(ctx, {
				type: 'seo-stale-content-preview',
				status: 'COMPLETED',
				count: queue.length,
				meta: {
					action: 'staleContentQueuePreview',
					provider: input.provider,
					source: external.source,
					targetType: input.targetType,
					dateFrom: input.dateFrom ?? null,
					dateTo: input.dateTo ?? null,
					minAgeDays: input.minAgeDays,
					minImpressions: input.minImpressions,
					minImpressionsGrowthPct: input.minImpressionsGrowthPct,
					minCtrDropPct: input.minCtrDropPct,
					minWeakPosition: input.minWeakPosition,
				},
			})

			return {
				provider: input.provider,
				source: external.source,
				generatedAt: new Date().toISOString(),
				totalSignals: targetFilteredSignals.length,
				totalQueue: queue.length,
				summary: {
					p1: queue.filter(item => item.priority === 'P1').length,
					p2: queue.filter(item => item.priority === 'P2').length,
					product: queue.filter(item => item.targetType === 'product').length,
					category: queue.filter(item => item.targetType === 'category').length,
					page: queue.filter(item => item.targetType === 'page').length,
				},
				items: queue,
			}
		}),

	/**
	 * H4: Еженедельный triage по зонам ответственности.
	 * Read-only сводка для сортировки задач перед safe bulk-fix.
	 */
	weeklyTriageBoard: adminProcedure.query(async ({ ctx }) => {
		const now = new Date()
		const sevenDaysAgo = new Date(now)
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		const [seoRows, weeklyLogs, duplicateCanonical] = await Promise.all([
			ctx.prisma.seoMetadata.findMany({
				select: {
					targetType: true,
					title: true,
					description: true,
					ogImage: true,
					canonicalUrl: true,
					noIndex: true,
				},
			}),
			ctx.prisma.importOperation.findMany({
				where: {
					type: { startsWith: 'seo-' },
					createdAt: { gte: sevenDaysAgo },
				},
				select: { type: true, status: true },
			}),
			ctx.prisma.seoMetadata.groupBy({
				by: ['canonicalUrl'],
				where: { canonicalUrl: { not: null } },
				_count: { canonicalUrl: true },
			}),
		])

		const weeklyBulkErrors = weeklyLogs.filter(
			log => log.type === 'seo-bulk-apply' && log.status !== 'COMPLETED',
		).length

		const duplicateCanonicalCount = duplicateCanonical.filter(
			d => (d._count.canonicalUrl ?? 0) > 1,
		).length

		const triageSeoRows = seoRows.filter(
			(row): row is (typeof seoRows)[number] & { targetType: SeoTargetType } =>
				isSeoTargetType(row.targetType),
		)

		const board = buildWeeklyTriageBoard({
			seoRows: triageSeoRows,
			duplicateCanonicalCount,
			weeklyBulkErrors,
		})

		return {
			periodDays: 7,
			generatedAt: now.toISOString(),
			...board,
		}
	}),

	/**
	 * H4.2/H6: Фиксация triage-решений по зонам и будущей follow-up проверке.
	 */
	logWeeklyTriageDecision: adminProcedure
		.input(
			z.object({
				zone: WeeklyTriageZoneSchema,
				decision: WeeklyTriageDecisionSchema,
				note: z.string().trim().max(300).optional(),
				bulkMode: z.enum(['strict', 'safe-overwrite', 'force']).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const now = new Date()
			const sevenDaysAgo = new Date(now)
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
			const followUpAt = new Date(now)
			followUpAt.setDate(followUpAt.getDate() + 7)

			const [seoRows, weeklyLogs, duplicateCanonical] = await Promise.all([
				ctx.prisma.seoMetadata.findMany({
					select: {
						targetType: true,
						title: true,
						description: true,
						ogImage: true,
						canonicalUrl: true,
						noIndex: true,
					},
				}),
				ctx.prisma.importOperation.findMany({
					where: {
						type: { startsWith: 'seo-' },
						createdAt: { gte: sevenDaysAgo },
					},
					select: { type: true, status: true },
				}),
				ctx.prisma.seoMetadata.groupBy({
					by: ['canonicalUrl'],
					where: { canonicalUrl: { not: null } },
					_count: { canonicalUrl: true },
				}),
			])

			const weeklyBulkErrors = weeklyLogs.filter(
				log => log.type === 'seo-bulk-apply' && log.status !== 'COMPLETED',
			).length

			const duplicateCanonicalCount = duplicateCanonical.filter(
				d => (d._count.canonicalUrl ?? 0) > 1,
			).length

			const triageSeoRows = seoRows.filter(
				(row): row is (typeof seoRows)[number] & { targetType: SeoTargetType } =>
					isSeoTargetType(row.targetType),
			)

			const board = buildWeeklyTriageBoard({
				seoRows: triageSeoRows,
				duplicateCanonicalCount,
				weeklyBulkErrors,
			})

			const zone = board.zones.find(item => item.key === input.zone)
			if (!zone) {
				throw new Error('Не удалось определить зону triage')
			}

			await createSeoOperationLog(ctx, {
				type: 'seo-weekly-triage-decision',
				status: 'PLANNED',
				count: zone.total,
				meta: {
					action: 'weeklyTriageDecision',
					zone: zone.key,
					zoneLabel: zone.label,
					decision: input.decision,
					ownerKey: zone.ownerKey,
					p1Count: zone.p1Count,
					p2Count: zone.p2Count,
					bulkMode: input.bulkMode ?? null,
					note: input.note?.trim() || null,
					followUpAt: followUpAt.toISOString(),
					recommendedAction: zone.recommendedAction,
				},
			})

			return {
				logged: true,
				zone: zone.key,
				decision: input.decision,
				followUpAt: followUpAt.toISOString(),
				count: zone.total,
			}
		}),

	weeklyFollowUpQueue: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return {
					summary: { overdue: 0, dueToday: 0, upcoming: 0 },
					items: [] as Array<never>,
				}
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: {
					type: {
						in: ['seo-weekly-triage-decision', 'seo-weekly-follow-up-review'],
					},
				},
				orderBy: { createdAt: 'desc' },
				take: 200,
				select: {
					id: true,
					type: true,
					status: true,
					count: true,
					meta: true,
					createdAt: true,
				},
			})

			const decisions = rows.filter(row => row.type === 'seo-weekly-triage-decision')
			const reviews = rows.filter(row => row.type === 'seo-weekly-follow-up-review')

			const latestReviewByDecision = new Map<string, (typeof reviews)[number]>()
			for (const review of reviews) {
				const meta = getJsonObjectMeta(review.meta)
				const decisionId = typeof meta.decisionId === 'string' ? meta.decisionId : null
				if (decisionId && !latestReviewByDecision.has(decisionId)) {
					latestReviewByDecision.set(decisionId, review)
				}
			}

			const today = startOfLocalDay(new Date())
			const tomorrow = addDays(today, 1)

			const items = decisions
				.map(row => {
					const meta = getJsonObjectMeta(row.meta)
					const linkedReview = latestReviewByDecision.get(row.id)
					const reviewMeta = linkedReview ? getJsonObjectMeta(linkedReview.meta) : null
					const latestOutcome =
						reviewMeta && typeof reviewMeta.outcome === 'string' ? reviewMeta.outcome : null

					if (latestOutcome === 'reviewed') {
						return null
					}

					const followUpSource =
						reviewMeta && typeof reviewMeta.followUpAt === 'string'
							? reviewMeta.followUpAt
							: typeof meta.followUpAt === 'string'
								? meta.followUpAt
								: null

					if (!followUpSource) return null

					const dueDate = new Date(followUpSource)
					const dueDay = startOfLocalDay(dueDate)
					const state =
						dueDay < today ? 'overdue' : dueDay < tomorrow ? 'today' : 'upcoming'

					return {
						decisionId: row.id,
						zone: typeof meta.zone === 'string' ? meta.zone : null,
						zoneLabel: typeof meta.zoneLabel === 'string' ? meta.zoneLabel : null,
						decision: typeof meta.decision === 'string' ? meta.decision : null,
						ownerKey: typeof meta.ownerKey === 'string' ? meta.ownerKey : null,
						count: row.count,
						followUpAt: dueDate.toISOString(),
						state,
						note:
							reviewMeta && typeof reviewMeta.note === 'string'
								? reviewMeta.note
								: typeof meta.note === 'string'
									? meta.note
									: null,
						lastReviewOutcome: latestOutcome,
						lastReviewedAt: linkedReview?.createdAt.toISOString() ?? null,
						createdAt: row.createdAt.toISOString(),
					}
				})
				.filter((item): item is NonNullable<typeof item> => item !== null)
				.sort((a, b) => a.followUpAt.localeCompare(b.followUpAt))

			const summary = {
				overdue: items.filter(item => item.state === 'overdue').length,
				dueToday: items.filter(item => item.state === 'today').length,
				upcoming: items.filter(item => item.state === 'upcoming').length,
			}

			const limited = items.slice(0, input?.limit ?? 20)

			return {
				summary,
				items: limited,
			}
		}),

	logWeeklyFollowUpReview: adminProcedure
		.input(
			z.object({
				decisionId: z.string(),
				outcome: WeeklyFollowUpOutcomeSchema,
				note: z.string().trim().max(300).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return { logged: false as const }
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: {
					type: {
						in: ['seo-weekly-triage-decision', 'seo-weekly-follow-up-review'],
					},
				},
				orderBy: { createdAt: 'desc' },
				take: 200,
				select: {
					id: true,
					type: true,
					count: true,
					status: true,
					meta: true,
					createdAt: true,
				},
			})

			const decisionRow = rows.find(
				row => row.type === 'seo-weekly-triage-decision' && row.id === input.decisionId,
			)

			if (!decisionRow) {
				throw new Error('Не найдена исходная triage-запись для follow-up')
			}

			const decisionMeta = getJsonObjectMeta(decisionRow.meta)
			const followUpAt =
				input.outcome === 'deferred' ? addDays(new Date(), 7).toISOString() : null

			await createSeoOperationLog(ctx, {
				type: 'seo-weekly-follow-up-review',
				status: input.outcome === 'reviewed' ? 'COMPLETED' : 'DEFERRED',
				count: decisionRow.count,
				meta: {
					action: 'weeklyFollowUpReview',
					decisionId: decisionRow.id,
					zone: typeof decisionMeta.zone === 'string' ? decisionMeta.zone : null,
					zoneLabel: typeof decisionMeta.zoneLabel === 'string' ? decisionMeta.zoneLabel : null,
					ownerKey: typeof decisionMeta.ownerKey === 'string' ? decisionMeta.ownerKey : null,
					decision: typeof decisionMeta.decision === 'string' ? decisionMeta.decision : null,
					outcome: input.outcome,
					note: input.note?.trim() || null,
					followUpAt,
				},
			})

			return {
				logged: true as const,
				decisionId: decisionRow.id,
				outcome: input.outcome,
				followUpAt,
			}
		}),

	weeklyActionJournal: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(50).default(12),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return { items: [] as Array<never> }
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: {
					type: {
						in: ['seo-weekly-triage-decision', 'seo-weekly-follow-up-review', 'seo-bulk-apply'],
					},
				},
				orderBy: { createdAt: 'desc' },
				take: input?.limit ?? 12,
				select: {
					id: true,
					type: true,
					status: true,
					count: true,
					meta: true,
					createdAt: true,
				},
			})

			return {
				items: rows.map(row => {
					const meta = getJsonObjectMeta(row.meta)

					return {
						id: row.id,
						type: row.type,
						status: row.status,
						count: row.count,
						action: typeof meta.action === 'string' ? meta.action : row.type,
						zone: typeof meta.zone === 'string' ? meta.zone : null,
						zoneLabel: typeof meta.zoneLabel === 'string' ? meta.zoneLabel : null,
						decision: typeof meta.decision === 'string' ? meta.decision : null,
						outcome: typeof meta.outcome === 'string' ? meta.outcome : null,
						decisionId: typeof meta.decisionId === 'string' ? meta.decisionId : null,
						ownerKey: typeof meta.ownerKey === 'string' ? meta.ownerKey : null,
						bulkMode: typeof meta.bulkMode === 'string' ? meta.bulkMode : null,
						targetType: typeof meta.targetType === 'string' ? meta.targetType : null,
						operatorName: typeof meta.operatorName === 'string' ? meta.operatorName : null,
						operatorEmail: typeof meta.operatorEmail === 'string' ? meta.operatorEmail : null,
						note: typeof meta.note === 'string' ? meta.note : null,
						followUpAt: typeof meta.followUpAt === 'string' ? meta.followUpAt : null,
						createdAt: row.createdAt.toISOString(),
					}
				}),
			}
		}),

	/**
	 * H7.5: A/B-safe triage для сниппет-стратегий (read-only журнал решений).
	 * Не изменяет seoMetadata и не запускает apply.
	 */
	logSnippetTrialDecision: adminProcedure
		.input(
			z.object({
				targetType: SeoTargetTypeSchema.optional(),
				mode: SnippetSuggestionModeSchema,
				variant: SnippetTrialVariantSchema.optional(),
				windowDays: z.number().min(7).max(42).default(14),
				baselineCtr: z.number().min(0).max(1),
				candidateCtr: z.number().min(0).max(1),
				impressions: z.number().min(0).default(0),
				outcome: SnippetTrialOutcomeSchema,
				note: z.string().trim().max(300).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const deltaCtrPct =
				input.baselineCtr > 0
					? ((input.candidateCtr - input.baselineCtr) / input.baselineCtr) * 100
					: null

			await createSeoOperationLog(ctx, {
				type: 'seo-snippet-trial-decision',
				status: input.outcome === 'keep-testing' ? 'PLANNED' : 'COMPLETED',
				count: input.impressions,
				meta: {
					action: 'snippetTrialDecision',
					targetType: input.targetType ?? 'all',
					mode: input.mode,
					variant: input.variant ?? null,
					windowDays: input.windowDays,
					baselineCtr: input.baselineCtr,
					candidateCtr: input.candidateCtr,
					deltaCtrPct,
					outcome: input.outcome,
					note: input.note?.trim() || null,
				},
			})

			return {
				logged: true,
				mode: input.mode,
				outcome: input.outcome,
				deltaCtrPct,
			}
		}),

	snippetTrialJournal: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(50).default(12),
					mode: SnippetSuggestionModeSchema.optional(),
					outcome: SnippetTrialOutcomeSchema.optional(),
					targetType: SnippetTrialTargetTypeSchema.default('all'),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return { items: [] as Array<never> }
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: { type: { in: ['seo-snippet-trial-decision'] } },
				orderBy: { createdAt: 'desc' },
				take: Math.max((input?.limit ?? 12) * 5, 100),
				select: {
					id: true,
					type: true,
					status: true,
					count: true,
					meta: true,
					createdAt: true,
				},
			})

			const filtered = rows
				.map(row => {
					const meta = getJsonObjectMeta(row.meta)
					return {
						id: row.id,
						status: row.status,
						impressions: row.count,
						targetType: typeof meta.targetType === 'string' ? meta.targetType : null,
						mode: typeof meta.mode === 'string' ? meta.mode : null,
						variant: typeof meta.variant === 'string' ? meta.variant : null,
						windowDays: typeof meta.windowDays === 'number' ? meta.windowDays : null,
						baselineCtr: typeof meta.baselineCtr === 'number' ? meta.baselineCtr : null,
						candidateCtr: typeof meta.candidateCtr === 'number' ? meta.candidateCtr : null,
						deltaCtrPct: typeof meta.deltaCtrPct === 'number' ? meta.deltaCtrPct : null,
						outcome: typeof meta.outcome === 'string' ? meta.outcome : null,
						note: typeof meta.note === 'string' ? meta.note : null,
						createdAt: row.createdAt.toISOString(),
					}
				})
				.filter(item => {
					if (input?.mode && item.mode !== input.mode) return false
					if (input?.outcome && item.outcome !== input.outcome) return false
					if ((input?.targetType ?? 'all') !== 'all' && item.targetType !== input?.targetType) {
						return false
					}
					return true
				})
				.slice(0, input?.limit ?? 12)

			return {
				items: filtered,
			}
		}),

	snippetTrialExportCsv: adminProcedure
		.input(
			z.object({
				mode: SnippetSuggestionModeSchema.optional(),
				outcome: SnippetTrialOutcomeSchema.optional(),
				targetType: SnippetTrialTargetTypeSchema.default('all'),
				limit: z.number().min(1).max(500).default(200),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return { csv: '', count: 0, generatedAt: new Date().toISOString() }
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: { type: { in: ['seo-snippet-trial-decision'] } },
				orderBy: { createdAt: 'desc' },
				take: Math.max(input.limit * 5, 200),
				select: {
					id: true,
					status: true,
					count: true,
					meta: true,
					createdAt: true,
				},
			})

			const filtered = rows
				.map(row => {
					const meta = getJsonObjectMeta(row.meta)
					return {
						id: row.id,
						status: row.status,
						impressions: row.count,
						targetType: typeof meta.targetType === 'string' ? meta.targetType : null,
						mode: typeof meta.mode === 'string' ? meta.mode : null,
						variant: typeof meta.variant === 'string' ? meta.variant : null,
						windowDays: typeof meta.windowDays === 'number' ? meta.windowDays : null,
						baselineCtr: typeof meta.baselineCtr === 'number' ? meta.baselineCtr : null,
						candidateCtr: typeof meta.candidateCtr === 'number' ? meta.candidateCtr : null,
						deltaCtrPct: typeof meta.deltaCtrPct === 'number' ? meta.deltaCtrPct : null,
						outcome: typeof meta.outcome === 'string' ? meta.outcome : null,
						note: typeof meta.note === 'string' ? meta.note : null,
						createdAt: row.createdAt.toISOString(),
					}
				})
				.filter(item => {
					if (input.mode && item.mode !== input.mode) return false
					if (input.outcome && item.outcome !== input.outcome) return false
					if (input.targetType !== 'all' && item.targetType !== input.targetType) return false
					return true
				})
				.slice(0, input.limit)

			const generatedAt = new Date().toISOString()
			const csv = Papa.unparse(
				filtered.map(item => ({
					id: item.id,
					status: item.status,
					targetType: item.targetType ?? '',
					mode: item.mode ?? '',
					variant: item.variant ?? '',
					outcome: item.outcome ?? '',
					impressions: item.impressions,
					windowDays: item.windowDays ?? '',
					baselineCtr: item.baselineCtr ?? '',
					candidateCtr: item.candidateCtr ?? '',
					deltaCtrPct: item.deltaCtrPct ?? '',
					note: item.note ?? '',
					createdAt: item.createdAt,
					generatedAt,
				})),
				{ header: true, newline: '\n' },
			)

			await createSeoOperationLog(ctx, {
				type: 'seo-snippet-trial-export',
				status: 'COMPLETED',
				count: filtered.length,
				meta: {
					action: 'snippetTrialExportCsv',
					mode: input.mode ?? null,
					outcome: input.outcome ?? null,
					targetType: input.targetType,
					limit: input.limit,
				},
			})

			return {
				csv,
				count: filtered.length,
				generatedAt,
			}
		}),

	/**
	 * H3: Статус интеграций с внешними источниками (изолирован от bulk/apply логики).
	 */
	externalIntegrationsStatus: adminProcedure.query(async () => {
		const providers = [
			{
				provider: 'google-search-console' as const,
				label: 'Google Search Console',
				configured: Boolean(process.env.GSC_CLIENT_ID && process.env.GSC_CLIENT_SECRET),
				pulls: ['impressions', 'clicks', 'ctr', 'position', 'coverage errors', 'indexing status'],
			},
			{
				provider: 'yandex-webmaster' as const,
				label: 'Яндекс.Вебмастер',
				configured: Boolean(process.env.YANDEX_WEBMASTER_TOKEN),
				pulls: ['impressions', 'clicks', 'ctr', 'position', 'coverage errors', 'indexing status'],
			},
		]

		return {
			principle:
				'Внешние данные используются только для приоритизации задач и не запускают массовый apply напрямую.',
			providers,
		}
	}),

	/**
	 * H3.3: История запусков preview/export по внешним SEO-сигналам.
	 */
	externalOperationsHistory: adminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(50).default(10),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.prisma.importOperation?.findMany) {
				return { items: [] as Array<never> }
			}

			const rows = await ctx.prisma.importOperation.findMany({
				where: {
					type: {
						in: [
							'seo-external-provider-preview',
							'seo-external-provider-export',
							'seo-external-triage-preview',
						],
					},
				},
				orderBy: { createdAt: 'desc' },
				take: input?.limit ?? 10,
				select: {
					id: true,
					type: true,
					status: true,
					count: true,
					meta: true,
					createdAt: true,
				},
			})

			return {
				items: rows.map(row => {
					const meta = getJsonObjectMeta(row.meta)

					return {
						id: row.id,
						type: row.type,
						status: row.status,
						count: row.count,
						provider:
							typeof meta.provider === 'string' ? meta.provider : 'unknown',
						action:
							typeof meta.action === 'string' ? meta.action : row.type,
						source:
							typeof meta.source === 'string' ? meta.source : null,
						dateFrom:
							typeof meta.dateFrom === 'string' ? meta.dateFrom : null,
						dateTo:
							typeof meta.dateTo === 'string' ? meta.dateTo : null,
						priorityFilter:
							typeof meta.priorityFilter === 'string' ? meta.priorityFilter : null,
						createdAt: row.createdAt.toISOString(),
					}
				}),
			}
		}),

	/**
	 * H3: Preview-триаж внешних сигналов (без записи в БД и без изменения SEO-данных).
	 */
	externalSignalsTriagePreview: adminProcedure
		.input(
			z.object({
				provider: ExternalProviderSchema,
				signals: z.array(ExternalSignalInputSchema).max(1000),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const prioritized = input.signals
				.map(prioritizeExternalSignal)
				.sort((a, b) => {
					const rank = { P1: 0, P2: 1, P3: 2, P4: 3 } as const
					if (rank[a.priority] !== rank[b.priority]) {
						return rank[a.priority] - rank[b.priority]
					}
					return b.signal.impressions - a.signal.impressions
				})

			const top = prioritized.slice(0, input.limit)

			await createSeoOperationLog(ctx, {
				type: 'seo-external-triage-preview',
				status: 'COMPLETED',
				count: top.length,
				meta: {
					action: 'externalSignalsTriagePreview',
					provider: input.provider,
					signals: input.signals.length,
					summary: summarizeExternalTriage(prioritized),
				},
			})

			return {
				provider: input.provider,
				totalSignals: input.signals.length,
				summary: summarizeExternalTriage(prioritized),
				top,
			}
		}),

	/**
	 * H3.2: Preview triage напрямую из provider-адаптера (stub-режим),
	 * полностью read-only и изолировано от bulk apply.
	 */
	externalProviderTriagePreview: adminProcedure
		.input(
			z.object({
				provider: ExternalProviderSchema,
				dateFrom: DateYmdSchema.optional(),
				dateTo: DateYmdSchema.optional(),
				priorityFilter: ExternalPriorityFilterSchema.default('all'),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const generatedAt = new Date()
			const external = await fetchExternalSignals(input.provider, {
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				limit: input.limit,
			})

			const prioritized = external.signals
				.map(prioritizeExternalSignal)
				.sort((a, b) => {
					if (rankExternalPriority(a.priority) !== rankExternalPriority(b.priority)) {
						return rankExternalPriority(a.priority) - rankExternalPriority(b.priority)
					}
					return b.signal.impressions - a.signal.impressions
				})

			const filteredPrioritized = filterExternalPrioritizedItems(
				prioritized,
				input.priorityFilter,
			)

			await createSeoOperationLog(ctx, {
				type: 'seo-external-provider-preview',
				status: 'COMPLETED',
				count: filteredPrioritized.length,
				meta: {
					action: 'externalProviderTriagePreview',
					provider: input.provider,
					source: external.source,
					dateFrom: input.dateFrom ?? null,
					dateTo: input.dateTo ?? null,
					priorityFilter: input.priorityFilter,
					summary: summarizeExternalTriage(prioritized),
				},
			})

			return {
				provider: input.provider,
				source: external.source,
				generatedAt: generatedAt.toISOString(),
				totalSignals: prioritized.length,
				filteredSignals: filteredPrioritized.length,
				summary: summarizeExternalTriage(prioritized),
				top: filteredPrioritized.slice(0, input.limit),
			}
		}),

	/**
	 * H3.2 UX: Экспорт triage-preview внешних сигналов в CSV.
	 */
	externalProviderTriageExportCsv: adminProcedure
		.input(
			z.object({
				provider: ExternalProviderSchema,
				dateFrom: DateYmdSchema.optional(),
				dateTo: DateYmdSchema.optional(),
				priorityFilter: ExternalPriorityFilterSchema.default('all'),
				limit: z.number().min(1).max(500).default(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const generatedAt = new Date()
			const external = await fetchExternalSignals(input.provider, {
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				limit: input.limit,
			})

			const prioritized = filterExternalPrioritizedItems(
				external.signals
					.map(prioritizeExternalSignal)
					.sort((a, b) => {
						if (rankExternalPriority(a.priority) !== rankExternalPriority(b.priority)) {
							return rankExternalPriority(a.priority) - rankExternalPriority(b.priority)
						}
						return b.signal.impressions - a.signal.impressions
					}),
				input.priorityFilter,
			)

			const csv = Papa.unparse(
				prioritized.map(item => ({
					provider: input.provider,
					priority: item.priority,
					targetType: item.targetType,
					targetId: item.targetId,
					url: item.url,
					reasons: item.reasons.join(', '),
					impressions: item.signal.impressions,
					clicks: item.signal.clicks,
					ctr: item.signal.ctr,
					position: item.signal.position,
					coverageErrors: item.signal.coverageErrors,
					indexingStatus: item.signal.indexingStatus,
					generatedAt: generatedAt.toISOString(),
				})),
				{ header: true, newline: '\n' },
			)

			await createSeoOperationLog(ctx, {
				type: 'seo-external-provider-export',
				status: 'COMPLETED',
				count: prioritized.length,
				meta: {
					action: 'externalProviderTriageExportCsv',
					provider: input.provider,
					source: external.source,
					dateFrom: input.dateFrom ?? null,
					dateTo: input.dateTo ?? null,
					priorityFilter: input.priorityFilter,
				},
			})

			return {
				csv,
				count: prioritized.length,
				generatedAt: generatedAt.toISOString(),
			}
		}),

	/**
	 * Dry-run: рассчитывает что изменится при bulk-генерации, ничего не сохраняет.
	 * Возвращает агрегированную статистику + первые BULK_SAMPLE_SIZE примеров.
	 */
	bulkGeneratePreview: adminProcedure
		.input(BulkGenerateInputSchema)
		.query(async ({ ctx, input }) => {
			const { targetType, mode, onlyMissing, ids, limit, cursor } = input

			// Загружаем существующие SEO-оверрайды для данного типа
			const existingRecords = await ctx.prisma.seoMetadata.findMany({
				where: { targetType },
				select: {
					targetId: true,
					title: true,
					description: true,
					keywords: true,
					ogTitle: true,
					ogDescription: true,
					ogImage: true,
					canonicalUrl: true,
					noIndex: true,
				},
			})
			const existingMap = new Map(
				existingRecords.map(r => [
					r.targetId,
					normalizeSeoFields({
						title: r.title,
						description: r.description,
						keywords: r.keywords,
						ogTitle: r.ogTitle,
						ogDescription: r.ogDescription,
						ogImage: r.ogImage,
						canonicalUrl: r.canonicalUrl,
						noIndex: r.noIndex,
					}),
				]),
			)

			const existingIds = new Set(existingMap.keys())
			const idFilter = ids?.length ? { id: { in: ids } } : undefined
			const cursorClause = cursor ? { id: { gt: cursor } } : undefined

			let results

			if (targetType === 'product') {
				const entities = await ctx.prisma.product.findMany({
					where: {
						...idFilter,
						...(onlyMissing ? { id: { notIn: [...existingIds] } } : {}),
						...cursorClause,
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						brand: true,
						metaTitle: true,
						metaDesc: true,
						images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
					},
					orderBy: { id: 'asc' },
					take: limit,
				})

				results = entities.map(e =>
					generateProductResult(e, existingMap.get(e.id) ?? null, mode),
				)
			} else if (targetType === 'category') {
				const entities = await ctx.prisma.category.findMany({
					where: {
						...idFilter,
						...(onlyMissing ? { id: { notIn: [...existingIds] } } : {}),
						...cursorClause,
					},
					select: { id: true, name: true, description: true, image: true, imagePath: true },
					orderBy: { id: 'asc' },
					take: limit,
				})

				results = entities.map(e =>
					generateCategoryResult(e, existingMap.get(e.id) ?? null, mode),
				)
			} else {
				// page
				const entities = await ctx.prisma.page.findMany({
					where: {
						...idFilter,
						...(onlyMissing ? { id: { notIn: [...existingIds] } } : {}),
						...cursorClause,
					},
					select: {
						id: true,
						title: true,
						content: true,
						metaTitle: true,
						metaDesc: true,
						imagePath: true,
						image: true,
					},
					orderBy: { id: 'asc' },
					take: limit,
				})

				results = entities.map(e =>
					generatePageResult(e, existingMap.get(e.id) ?? null, mode),
				)
			}

			// Агрегация
			const affected = results.filter(r => r.changed).length
			const byField: BulkPreviewResult['byField'] = {}

			for (const result of results) {
				if (!result.changed) continue
				for (const diffItem of result.diff) {
					const key = diffItem.field as string
					if (!byField[key]) byField[key] = { changed: 0, emptyBefore: 0 }
					byField[key].changed++
					if (diffItem.before === null || diffItem.before === undefined || diffItem.before === '') {
						byField[key].emptyBefore++
					}
				}
			}

			const preview: BulkPreviewResult = {
				total: results.length,
				affected,
				unchanged: results.length - affected,
				byEntityType: {
					product: targetType === 'product' ? results.length : 0,
					category: targetType === 'category' ? results.length : 0,
					page: targetType === 'page' ? results.length : 0,
				} as Record<SeoEntityType, number>,
				byField,
				samples: results.filter(r => r.changed).slice(0, BULK_SAMPLE_SIZE),
			}

			return preview
		}),

	/**
	 * Apply: применяет bulk-генерацию и сохраняет изменения в БД.
	 * Работает только с adminProcedure. Батчирует по BULK_BATCH_SIZE записей.
	 */
	bulkGenerateApply: adminProcedure
		.input(BulkGenerateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const { targetType, mode, onlyMissing, ids, limit, cursor } = input

			const existingRecords = await ctx.prisma.seoMetadata.findMany({
				where: { targetType },
				select: {
					targetId: true,
					title: true,
					description: true,
					keywords: true,
					ogTitle: true,
					ogDescription: true,
					ogImage: true,
					canonicalUrl: true,
					noIndex: true,
				},
			})
			const existingMap = new Map(
				existingRecords.map(r => [
					r.targetId,
					normalizeSeoFields({
						title: r.title,
						description: r.description,
						keywords: r.keywords,
						ogTitle: r.ogTitle,
						ogDescription: r.ogDescription,
						ogImage: r.ogImage,
						canonicalUrl: r.canonicalUrl,
						noIndex: r.noIndex,
					}),
				]),
			)

			const existingIds = new Set(existingMap.keys())
			const pageIdFilter = {
				...(ids?.length ? { in: ids } : {}),
				...(onlyMissing ? { notIn: [...existingIds] } : {}),
				...(cursor ? { gt: cursor } : {}),
			}
			const pageWhere = Object.keys(pageIdFilter).length ? { id: pageIdFilter } : undefined
			const pageTake = limit + 1

			let results
			let hasMore = false
			let nextCursor: string | null = null

			if (targetType === 'product') {
				const entities = await ctx.prisma.product.findMany({
					where: {
						...(pageWhere ?? {}),
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						brand: true,
						metaTitle: true,
						metaDesc: true,
						images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
					},
					orderBy: { id: 'asc' },
					take: pageTake,
				})

				const pageEntities = entities.slice(0, limit)
				hasMore = entities.length > limit
				nextCursor = hasMore ? pageEntities.at(-1)?.id ?? null : null
				results = pageEntities.map(e =>
					generateProductResult(e, existingMap.get(e.id) ?? null, mode),
				)
			} else if (targetType === 'category') {
				const entities = await ctx.prisma.category.findMany({
					where: {
						...(pageWhere ?? {}),
					},
					select: { id: true, name: true, description: true, image: true, imagePath: true },
					orderBy: { id: 'asc' },
					take: pageTake,
				})

				const pageEntities = entities.slice(0, limit)
				hasMore = entities.length > limit
				nextCursor = hasMore ? pageEntities.at(-1)?.id ?? null : null
				results = pageEntities.map(e =>
					generateCategoryResult(e, existingMap.get(e.id) ?? null, mode),
				)
			} else {
				const entities = await ctx.prisma.page.findMany({
					where: {
						...(pageWhere ?? {}),
					},
					select: {
						id: true,
						title: true,
						content: true,
						metaTitle: true,
						metaDesc: true,
						imagePath: true,
						image: true,
					},
					orderBy: { id: 'asc' },
					take: pageTake,
				})

				const pageEntities = entities.slice(0, limit)
				hasMore = entities.length > limit
				nextCursor = hasMore ? pageEntities.at(-1)?.id ?? null : null
				results = pageEntities.map(e =>
					generatePageResult(e, existingMap.get(e.id) ?? null, mode),
				)
			}

			let applied = 0
			let skipped = 0
			let errors = 0

			for (const result of results) {
				if (!result.changed) {
					skipped++
					continue
				}
				try {
					await upsertSeoMetadata(ctx.prisma, {
						targetType: result.targetType,
						targetId: result.targetId,
						fields: result.after,
					})
					applied++
				} catch {
					errors++
				}
			}

			const status = errors > 0 ? 'PARTIAL' : 'COMPLETED'
			await createSeoOperationLog(ctx, {
				type: 'seo-bulk-apply',
				status,
				count: applied,
				meta: {
					action: 'bulkGenerateApply',
					targetType,
					mode,
					onlyMissing,
					limit,
					cursor: cursor ?? null,
					nextCursor,
					hasMore,
					skipped,
					errors,
				},
			})

			return { applied, skipped, errors, nextCursor, hasMore, processed: results.length } satisfies BulkApplyResult
		}),
})
