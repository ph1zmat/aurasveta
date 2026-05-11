import { describe, expect, it, vi } from 'vitest'
import { BULK_BATCH_SIZE } from '@/lib/seo/domain/rules'

vi.mock('@/lib/prisma', () => ({
	prisma: {},
}))

vi.mock('@/lib/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () => null),
		},
	},
}))

async function loadCallerTools() {
	const [{ createCallerFactory }, { seoRouter }] = await Promise.all([
		import('@/lib/trpc/init'),
		import('@/lib/trpc/routers/seo'),
	])
	return { createCallerFactory, seoRouter }
}

type SeoFindManyArgs = { where?: { targetType?: string } }
type SeoUpsertArgs = {
	where: { targetType_targetId: { targetType: string; targetId: string } }
	create: {
		targetType: string
		targetId: string
		title?: string | null
		description?: string | null
		keywords?: string | null
		ogTitle?: string | null
		ogDescription?: string | null
		ogImage?: string | null
		canonicalUrl?: string | null
		noIndex?: boolean
	}
	update: Partial<SeoUpsertArgs['create']>
}
type SeoDeleteManyArgs = { where: { targetType: string; targetId: string } }
type ImportOperationCreateArgs = {
	data: {
		type: string
		count?: number
		status?: string
		meta?: Record<string, unknown> | null
	}
}
type ImportOperationFindManyArgs = {
	where?: {
		type?: { startsWith?: string; in?: string[] }
		createdAt?: { gte?: Date }
	}
	take?: number
	select?: Record<string, boolean>
}

function createAdminCtx(overrides?: Partial<Record<string, unknown>>) {
	const store = {
		seoRows: [] as Array<{
			targetType: string
			targetId: string
			title: string | null
			description: string | null
			keywords: string | null
			ogTitle: string | null
			ogDescription: string | null
			ogImage: string | null
			canonicalUrl: string | null
			noIndex: boolean
		}>,
		importOperations: [] as Array<{
			id: string
			type: string
			count: number
			status: string
			meta: Record<string, unknown> | null
			createdAt: Date
		}>,
	}

	const prisma = {
		seoMetadata: {
			findMany: vi.fn(async ({ where }: SeoFindManyArgs = {}) => {
				const targetType = where?.targetType
				return targetType
					? store.seoRows.filter(r => r.targetType === targetType)
					: store.seoRows
			}),
			upsert: vi.fn(async ({ where, create, update }: SeoUpsertArgs) => {
				const idx = store.seoRows.findIndex(
					r =>
						r.targetType === where.targetType_targetId.targetType &&
						r.targetId === where.targetType_targetId.targetId,
				)
				if (idx >= 0) {
					store.seoRows[idx] = {
						...store.seoRows[idx],
						...update,
					}
					return store.seoRows[idx]
				}
				store.seoRows.push(create)
				return create
			}),
			deleteMany: vi.fn(async ({ where }: SeoDeleteManyArgs) => {
				const before = store.seoRows.length
				store.seoRows = store.seoRows.filter(
					r => !(r.targetType === where.targetType && r.targetId === where.targetId),
				)
				return { count: before - store.seoRows.length }
			}),
			groupBy: vi.fn(async () => []),
		},
		importOperation: {
			create: vi.fn(async ({ data }: ImportOperationCreateArgs) => {
				const row = {
					id: `op-${store.importOperations.length + 1}`,
					type: data.type,
					count: data.count ?? 0,
					status: data.status ?? 'COMPLETED',
					meta: (data.meta ?? null) as Record<string, unknown> | null,
					createdAt: new Date(),
				}
				store.importOperations.unshift(row)
				return row
			}),
			findMany: vi.fn(async ({ where, take, select }: ImportOperationFindManyArgs = {}) => {
				let rows = [...store.importOperations]
				if (where?.type?.startsWith) {
					rows = rows.filter(row => row.type.startsWith(where.type.startsWith))
				}
				if (where?.type?.in) {
					rows = rows.filter(row => where.type.in.includes(row.type))
				}
				if (where?.createdAt?.gte) {
					rows = rows.filter(row => row.createdAt >= where.createdAt.gte)
				}
				rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				if (typeof take === 'number') rows = rows.slice(0, take)
				if (!select) return rows
				return rows.map(row => {
					const selected: Record<string, unknown> = {}
					for (const key of Object.keys(select)) {
						if (select[key]) selected[key] = row[key as keyof typeof row]
					}
					return selected
				})
			}),
		},
		product: {
			findMany: vi.fn(async () => [
				{
					id: 'p1',
					name: 'Люстра Aurora',
					description: 'Красивая люстра',
					price: 100,
					brand: 'Aura',
					metaTitle: null,
					metaDesc: null,
					images: [{ url: 'https://aurasveta.by/img/p1.jpg' }],
				},
			]),
		},
		category: { findMany: vi.fn(async () => []) },
		page: { findMany: vi.fn(async () => []) },
		...(overrides ?? {}),
	}

	return {
		ctx: {
			prisma,
			session: { user: { id: 'admin-1', role: 'ADMIN' } },
			userId: 'admin-1',
		},
		prisma,
		store,
	}
}

describe('seoRouter bulk integration', () => {
	it('preview показывает изменения, а apply применяет их', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const preview = await caller.bulkGeneratePreview({
			targetType: 'product',
			mode: 'strict',
			limit: 10,
		})
		expect(preview.total).toBe(1)
		expect(preview.affected).toBe(1)

		const apply = await caller.bulkGenerateApply({
			targetType: 'product',
			mode: 'strict',
			limit: 10,
		})
		expect(apply.applied).toBe(1)
		expect(apply.errors).toBe(0)
		expect(store.seoRows.length).toBe(1)
	}, 10000)

	it('повторный apply идемпотентен (изменений не добавляет)', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		await caller.bulkGenerateApply({ targetType: 'product', mode: 'strict', limit: 10 })
		const firstCount = store.seoRows.length

		const second = await caller.bulkGenerateApply({
			targetType: 'product',
			mode: 'strict',
			limit: 10,
		})

		expect(second.applied).toBe(0)
		expect(second.skipped).toBe(1)
		expect(store.seoRows.length).toBe(firstCount)
	})

	it('bulk apply возвращает cursor и обрабатывает несколько батчей', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const productRows = [
			{
				id: 'p-1',
				name: 'Люстра 1',
				description: 'Описание 1',
				price: 100,
				brand: 'Brand',
				metaTitle: null,
				metaDesc: null,
				images: [{ url: 'https://aurasveta.by/img/p-1.jpg' }],
			},
			{
				id: 'p-2',
				name: 'Люстра 2',
				description: 'Описание 2',
				price: 200,
				brand: 'Brand',
				metaTitle: null,
				metaDesc: null,
				images: [{ url: 'https://aurasveta.by/img/p-2.jpg' }],
			},
			{
				id: 'p-3',
				name: 'Люстра 3',
				description: 'Описание 3',
				price: 300,
				brand: 'Brand',
				metaTitle: null,
				metaDesc: null,
				images: [{ url: 'https://aurasveta.by/img/p-3.jpg' }],
			},
		]
		const { ctx, store } = createAdminCtx({
			product: {
				findMany: vi.fn(
					async ({
						where,
						take,
					}: {
						where?: { id?: { gt?: string; in?: string[]; notIn?: string[] } }
						take?: number
					} = {}) => {
					const sorted = [...productRows].sort((a, b) => a.id.localeCompare(b.id))
					let rows = sorted
					const idFilter = where?.id
					if (idFilter?.gt) {
						rows = rows.filter((item) => item.id > idFilter.gt!)
					}
					if (idFilter?.in?.length) {
						rows = rows.filter((item) => idFilter.in?.includes(item.id))
					}
					if (idFilter?.notIn?.length) {
						rows = rows.filter((item) => !idFilter.notIn?.includes(item.id))
					}
					return rows.slice(0, take ?? rows.length)
					},
				),
			},
		})
		const caller = createCallerFactory(seoRouter)(ctx as never)

		const first = await caller.bulkGenerateApply({ targetType: 'product', mode: 'strict', limit: 2 })
		expect(first.applied).toBe(2)
		expect(first.hasMore).toBe(true)
		expect(first.nextCursor).toBe('p-2')

		const second = await caller.bulkGenerateApply({
			targetType: 'product',
			mode: 'strict',
			limit: 2,
			cursor: first.nextCursor ?? undefined,
		})

		expect(second.applied).toBe(1)
		expect(second.hasMore).toBe(false)
		expect(second.nextCursor).toBeNull()
		expect(store.seoRows.length).toBe(3)
	})

	it('ограничение ролей соблюдается (non-admin forbidden)', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx } = createAdminCtx()
		const caller = createCallerFactory(seoRouter)({
			...ctx,
			session: { user: { id: 'u1', role: 'EDITOR' } },
			userId: 'u1',
			} as never)

		await expect(
			caller.bulkGeneratePreview({ targetType: 'product', mode: 'strict', limit: 10 }),
		).rejects.toMatchObject({ code: 'FORBIDDEN' })
	})

	it('batch limit валидируется схемой ввода', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		await expect(
			caller.bulkGeneratePreview({
				targetType: 'product',
				mode: 'strict',
				limit: BULK_BATCH_SIZE + 1,
			}),
		).rejects.toMatchObject({ code: 'BAD_REQUEST' })
	})

	it('weekly triage decision логируется и попадает в журнал', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			seoMetadata: {
				findMany: vi.fn(async () => [
					{
						targetType: 'product',
						targetId: 'p-1',
						title: null,
						description: 'Есть описание',
						keywords: null,
						ogTitle: null,
						ogDescription: null,
						ogImage: 'https://aurasveta.by/img/p-1.jpg',
						canonicalUrl: 'https://aurasveta.by/product/p-1',
						noIndex: false,
					},
				]),
				groupBy: vi.fn(async () => []),
			},
		})
		const caller = createCallerFactory(seoRouter)({
			...ctx,
			session: { user: { id: 'admin-1', role: 'ADMIN', email: 'admin@aurasveta.by', name: 'SEO Admin' } },
			} as never)

			await caller.logWeeklyTriageDecision({
			zone: 'product',
			decision: 'safe-bulk-fix',
			bulkMode: 'strict',
		})

		expect(store.importOperations[0]?.type).toBe('seo-weekly-triage-decision')

		const journal = await caller.weeklyActionJournal({ limit: 5 })
		expect(journal.items).toHaveLength(1)
		expect(journal.items[0]).toMatchObject({
			type: 'seo-weekly-triage-decision',
			zone: 'product',
			decision: 'safe-bulk-fix',
			bulkMode: 'strict',
			operatorName: 'SEO Admin',
		})
	})

	it('follow-up queue показывает overdue задачу и позволяет review/defer', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			seoMetadata: {
				findMany: vi.fn(async () => [
					{
						targetType: 'product',
						targetId: 'p-1',
						title: null,
						description: 'Есть описание',
						keywords: null,
						ogTitle: null,
						ogDescription: null,
						ogImage: 'https://aurasveta.by/img/p-1.jpg',
						canonicalUrl: 'https://aurasveta.by/product/p-1',
						noIndex: false,
					},
				]),
				groupBy: vi.fn(async () => []),
			},
		})
		const caller = createCallerFactory(seoRouter)({
			...ctx,
			session: { user: { id: 'admin-1', role: 'ADMIN', email: 'admin@aurasveta.by', name: 'SEO Admin' } },
			} as never)

		await caller.logWeeklyTriageDecision({
			zone: 'product',
			decision: 'manual-review',
		})

		const decisionRow = store.importOperations[0]
		if (!decisionRow?.meta) throw new Error('Expected decision row meta')
		decisionRow.meta.followUpAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

		const queue = await caller.weeklyFollowUpQueue({ limit: 10 })
		expect(queue.summary.overdue).toBe(1)
		expect(queue.items[0]).toMatchObject({
			state: 'overdue',
			decision: 'manual-review',
		})

		const deferred = await caller.logWeeklyFollowUpReview({
			decisionId: decisionRow.id,
			outcome: 'deferred',
		})
		expect(deferred.logged).toBe(true)
		expect(deferred.followUpAt).toBeTruthy()

		const deferredQueue = await caller.weeklyFollowUpQueue({ limit: 10 })
		expect(deferredQueue.items[0]?.state).toBe('upcoming')

		const reviewed = await caller.logWeeklyFollowUpReview({
			decisionId: decisionRow.id,
			outcome: 'reviewed',
		})
		expect(reviewed.logged).toBe(true)

		const afterReviewQueue = await caller.weeklyFollowUpQueue({ limit: 10 })
		expect(afterReviewQueue.items).toHaveLength(0)
	})

	it('snippet suggestions preview возвращает read-only рекомендации с логом preview', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			seoMetadata: {
				findMany: vi.fn(async () => [
					{
						targetType: 'product',
						targetId: 'p1',
						title: null,
						description: null,
						ogImage: 'https://aurasveta.by/img/p1.jpg',
						canonicalUrl: 'https://aurasveta.by/product/p1',
						noIndex: false,
						updatedAt: new Date(),
					},
				]),
			},
			product: {
				findMany: vi.fn(async () => [
					{
						id: 'p1',
						name: 'Люстра Aurora',
						description: 'Современная люстра для гостиной.',
						brand: 'Aura',
						slug: 'aurora',
					},
				]),
			},
		})
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const preview = await caller.snippetSuggestionsPreview({
			targetType: 'product',
			filter: 'all',
			provider: 'google-search-console',
			includeExternal: false,
			limit: 5,
		})

		expect(preview.source).toBe('rule')
		expect(preview.items).toHaveLength(1)
		expect(preview.items[0]).toMatchObject({
			targetType: 'product',
			targetId: 'p1',
			risk: 'low',
			source: 'rule',
		})
		expect(store.importOperations[0]?.type).toBe('seo-snippet-suggestions-preview')
	})

	it('snippet suggestions preview в hybrid режиме возвращает source=hybrid и метрики применения', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			seoMetadata: {
				findMany: vi.fn(async () => [
					{
						targetType: 'product',
						targetId: 'p1',
						title: null,
						description: null,
						ogImage: 'https://aurasveta.by/img/p1.jpg',
						canonicalUrl: 'https://aurasveta.by/product/p1',
						noIndex: false,
						updatedAt: new Date(),
					},
				]),
			},
			product: {
				findMany: vi.fn(async () => [
					{
						id: 'p1',
						name: 'Люстра Aurora',
						description: 'Современная люстра для гостиной и спальни.',
						brand: 'Aura',
						slug: 'aurora',
					},
				]),
			},
		})
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const preview = await caller.snippetSuggestionsPreview({
			targetType: 'product',
			filter: 'all',
			provider: 'google-search-console',
			includeExternal: false,
			mode: 'hybrid',
			aiProvider: 'stub-gpt',
			limit: 5,
		})

		expect(preview.source).toBe('hybrid')
		expect(preview.mode).toBe('hybrid')
		expect(preview.aiProvider).toBe('stub-gpt')
		expect(preview.summary.hybridApplied).toBe(1)
		expect(preview.items[0]).toMatchObject({
			targetType: 'product',
			targetId: 'p1',
			source: 'hybrid',
		})
		expect(preview.items[0]?.reasons.join(' ')).toContain('AI:')

		expect(store.importOperations[0]?.type).toBe('seo-snippet-suggestions-preview')
		expect(store.importOperations[0]?.meta).toMatchObject({
			mode: 'hybrid',
			source: 'hybrid',
			aiProvider: 'stub-gpt',
		})
	})

	it('snippet suggestions preview в rule-scored режиме возвращает score breakdown и метрику selected', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			seoMetadata: {
				findMany: vi.fn(async () => [
					{
						targetType: 'product',
						targetId: 'p1',
						title: null,
						description: null,
						ogImage: 'https://aurasveta.by/img/p1.jpg',
						canonicalUrl: 'https://aurasveta.by/product/p1',
						noIndex: false,
						updatedAt: new Date(),
					},
				]),
			},
			product: {
				findMany: vi.fn(async () => [
					{
						id: 'p1',
						name: 'Люстра Aurora',
						description: 'Современная люстра для гостиной и спальни.',
						brand: 'Aura',
						slug: 'aurora',
					},
				]),
			},
		})
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const preview = await caller.snippetSuggestionsPreview({
			targetType: 'product',
			filter: 'all',
			provider: 'google-search-console',
			includeExternal: false,
			mode: 'rule-scored',
			limit: 5,
		})

		expect(preview.source).toBe('rule-scored')
		expect(preview.mode).toBe('rule-scored')
		expect(preview.summary.ruleScoredSelected).toBe(1)
		expect(preview.items[0]).toMatchObject({
			targetType: 'product',
			targetId: 'p1',
			source: 'rule',
			scoring: {
				strategy: 'rule-scored',
			},
		})
		expect(preview.items[0]?.reasons.join(' ')).toContain('Rule-scored: выбран вариант')

		expect(store.importOperations[0]?.type).toBe('seo-snippet-suggestions-preview')
		expect(store.importOperations[0]?.meta).toMatchObject({
			mode: 'rule-scored',
			source: 'rule-scored',
			aiProvider: null,
		})
	})

	it('cannibalization preview возвращает read-only кандидатов и логирует запуск', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const preview = await caller.cannibalizationPreview({
			provider: 'google-search-console',
			minImpressions: 100,
			maxPosition: 25,
			confidence: 'all',
			limit: 5,
		})

		expect(preview.provider).toBe('google-search-console')
		expect(preview.items.length).toBeGreaterThan(0)
		expect(preview.items[0]).toMatchObject({
			query: expect.any(String),
			urls: expect.any(Array),
			confidence: expect.stringMatching(/high|medium/),
		})
		expect(store.importOperations[0]?.type).toBe('seo-cannibalization-preview')
	})

	it('stale content queue preview возвращает read-only очередь и логирует запуск', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx({
			product: {
				findMany: vi.fn(async () => [
					{
						id: 'p1',
						name: 'Люстра Aurora',
						slug: 'lustra-aurora',
						updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
					},
				]),
			},
			category: { findMany: vi.fn(async () => []) },
			page: { findMany: vi.fn(async () => []) },
		})
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const queue = await caller.staleContentQueuePreview({
			provider: 'google-search-console',
			targetType: 'all',
			minAgeDays: 30,
			minImpressions: 100,
			minImpressionsGrowthPct: 20,
			minCtrDropPct: 15,
			minWeakPosition: 10,
			limit: 8,
		})

		expect(queue.totalQueue).toBeGreaterThan(0)
		expect(queue.items[0]).toMatchObject({
			targetType: expect.stringMatching(/product|category|page/),
			priority: expect.stringMatching(/P1|P2/),
		})
		expect(store.importOperations[0]?.type).toBe('seo-stale-content-preview')
	})

	it('snippet trial decision логируется и появляется в trial journal', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx, store } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		const result = await caller.logSnippetTrialDecision({
			targetType: 'product',
			mode: 'rule-scored',
			variant: 'commercial',
			windowDays: 14,
			baselineCtr: 0.018,
			candidateCtr: 0.0216,
			impressions: 1200,
			outcome: 'promote',
			note: 'Рост CTR подтверждён на P1 товарах',
		})

		expect(result.logged).toBe(true)
		expect(result.mode).toBe('rule-scored')
		expect(result.outcome).toBe('promote')
		expect(result.deltaCtrPct).not.toBeNull()

		expect(store.importOperations[0]?.type).toBe('seo-snippet-trial-decision')
		expect(store.importOperations[0]?.meta).toMatchObject({
			action: 'snippetTrialDecision',
			mode: 'rule-scored',
			variant: 'commercial',
			outcome: 'promote',
		})

		const journal = await caller.snippetTrialJournal({ limit: 5 })
		expect(journal.items).toHaveLength(1)
		expect(journal.items[0]).toMatchObject({
			mode: 'rule-scored',
			variant: 'commercial',
			outcome: 'promote',
			targetType: 'product',
			impressions: 1200,
		})
	})

	it('snippet trial journal поддерживает фильтры и CSV export по выбранному срезу', async () => {
		const { createCallerFactory, seoRouter } = await loadCallerTools()
		const { ctx } = createAdminCtx()
			const caller = createCallerFactory(seoRouter)(ctx as never)

		await caller.logSnippetTrialDecision({
			targetType: 'product',
			mode: 'rule-scored',
			variant: 'delivery',
			windowDays: 14,
			baselineCtr: 0.02,
			candidateCtr: 0.023,
			impressions: 800,
			outcome: 'promote',
		})

		await caller.logSnippetTrialDecision({
			targetType: 'category',
			mode: 'hybrid',
			variant: 'hybrid',
			windowDays: 14,
			baselineCtr: 0.017,
			candidateCtr: 0.016,
			impressions: 600,
			outcome: 'reject',
		})

		const filtered = await caller.snippetTrialJournal({
			limit: 10,
			mode: 'rule-scored',
			outcome: 'promote',
			targetType: 'product',
		})

		expect(filtered.items).toHaveLength(1)
		expect(filtered.items[0]).toMatchObject({
			mode: 'rule-scored',
			outcome: 'promote',
			targetType: 'product',
		})

		const exportResult = await caller.snippetTrialExportCsv({
			mode: 'rule-scored',
			outcome: 'promote',
			targetType: 'product',
			limit: 50,
		})

		expect(exportResult.count).toBe(1)
		expect(exportResult.csv).toContain('rule-scored')
		expect(exportResult.csv).toContain('promote')
	})
})
