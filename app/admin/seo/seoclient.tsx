'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { buildSnippetTrialSummary } from '@/shared/lib/seo/snippettrialsummary'
import { toast } from 'sonner'
import {
	ChevronDown,
	ChevronUp,
	Save,
	Wand2,
	AlertTriangle,
	CheckCircle2,
	Download,
	Activity,
	BarChart3,
	Link2,
} from 'lucide-react'

const SEO_FILTERS = [
	'all',
	'missing-title',
	'missing-desc',
	'noindex',
] as const

type SeoFilter = (typeof SEO_FILTERS)[number]

const TARGET_TYPE_OPTIONS = ['product', 'category', 'page'] as const
type SeoTargetType = (typeof TARGET_TYPE_OPTIONS)[number]

const BULK_MODES = ['strict', 'safe-overwrite', 'force'] as const
type BulkMode = (typeof BULK_MODES)[number]

const EXTERNAL_PROVIDERS = ['google-search-console', 'yandex-webmaster'] as const
type ExternalProvider = (typeof EXTERNAL_PROVIDERS)[number]
const EXTERNAL_PRIORITY_FILTERS = ['all', 'p1', 'p1-p2'] as const
type ExternalPriorityFilter = (typeof EXTERNAL_PRIORITY_FILTERS)[number]
const CANNIBALIZATION_CONFIDENCE = ['all', 'high'] as const
type CannibalizationConfidence = (typeof CANNIBALIZATION_CONFIDENCE)[number]
const STALE_TARGET_TYPES = ['all', 'product', 'category', 'page'] as const
type StaleTargetType = (typeof STALE_TARGET_TYPES)[number]
const SNIPPET_PREVIEW_MODES = ['rule', 'rule-scored', 'hybrid'] as const
type SnippetPreviewMode = (typeof SNIPPET_PREVIEW_MODES)[number]
const SNIPPET_TRIAL_FILTER_MODES = ['all', 'rule', 'rule-scored', 'hybrid'] as const
type SnippetTrialFilterMode = (typeof SNIPPET_TRIAL_FILTER_MODES)[number]
const SNIPPET_TRIAL_OUTCOMES = ['all', 'promote', 'keep-testing', 'reject'] as const
type SnippetTrialOutcome = (typeof SNIPPET_TRIAL_OUTCOMES)[number]
const SNIPPET_TRIAL_TARGET_TYPES = ['all', 'product', 'category', 'page'] as const
type SnippetTrialTargetType = (typeof SNIPPET_TRIAL_TARGET_TYPES)[number]

const BULK_UI_LIMIT = 100 as const

const BULK_TARGET_LABELS: Record<SeoTargetType, string> = {
	product: 'Товары',
	category: 'Категории',
	page: 'Страницы',
}

const BULK_MODE_LABELS: Record<BulkMode, string> = {
	'strict': 'Строгий — только пустые поля',
	'safe-overwrite': 'Безопасный — без ручных правок',
	'force': 'Полный — перезаписать всё',
}

function computeScore(item: {
	title?: string | null
	description?: string | null
	ogImage?: string | null
	noIndex?: boolean
}): number {
	let score = 100
	if (!item.title) score -= 25
	else if (item.title.length < 30 || item.title.length > 60) score -= 10
	if (!item.description) score -= 25
	else if (item.description.length < 70 || item.description.length > 160) score -= 10
	if (!item.ogImage) score -= 10
	return Math.max(0, score)
}

function ScoreBadge({ score }: { score: number }) {
	const color =
		score >= 80
			? 'bg-success/15 text-success'
			: score >= 50
				? 'bg-warning/15 text-warning'
				: 'bg-destructive/15 text-destructive'
	return (
		<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>
			{score}
		</span>
	)
}

type SeoEditFields = {
	title?: string | null
	description?: string | null
	keywords?: string | null
	ogTitle?: string | null
	ogDescription?: string | null
	ogImage?: string | null
	canonicalUrl?: string | null
	noIndex?: boolean
}

type SeoEditState = Record<string, SeoEditFields>

function isSeoTargetType(value: string): value is SeoTargetType {
	return TARGET_TYPE_OPTIONS.includes(value as SeoTargetType)
}

export default function SeoClient() {
	const [filter, setFilter] = useState<SeoFilter>('all')
	const [typeFilter, setTypeFilter] = useState<SeoTargetType | 'all'>('all')
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [editing, setEditing] = useState<SeoEditState>({})

	// Bulk-панель
	const [bulkOpen, setBulkOpen] = useState(false)
	const [bulkTargetType, setBulkTargetType] = useState<SeoTargetType>('product')
	const [bulkMode, setBulkMode] = useState<BulkMode>('strict')
	const [bulkOnlyMissing, setBulkOnlyMissing] = useState(true)
	const [bulkPreviewDone, setBulkPreviewDone] = useState(false)
	const [isApplyingAll, setIsApplyingAll] = useState(false)
	const [externalProvider, setExternalProvider] =
		useState<ExternalProvider>('google-search-console')
	const [externalDateFrom, setExternalDateFrom] = useState('')
	const [externalDateTo, setExternalDateTo] = useState('')
	const [externalPriorityFilter, setExternalPriorityFilter] =
		useState<ExternalPriorityFilter>('p1-p2')
	const [cannibalizationConfidence, setCannibalizationConfidence] =
		useState<CannibalizationConfidence>('all')
	const [staleTargetType, setStaleTargetType] = useState<StaleTargetType>('all')
	const [snippetPreviewMode, setSnippetPreviewMode] = useState<SnippetPreviewMode>('rule')
	const [snippetTrialModeFilter, setSnippetTrialModeFilter] =
		useState<SnippetTrialFilterMode>('all')
	const [snippetTrialOutcomeFilter, setSnippetTrialOutcomeFilter] =
		useState<SnippetTrialOutcome>('all')
	const [snippetTrialTargetTypeFilter, setSnippetTrialTargetTypeFilter] =
		useState<SnippetTrialTargetType>('all')

	const { data: seoList, refetch } = trpc.seo.listAll.useQuery(
		typeFilter !== 'all' ? { targetType: typeFilter } : undefined,
	)
	const { data: opsOverview } = trpc.seo.operationsOverview.useQuery()
	const { data: snippetSuggestionsPreview } = trpc.seo.snippetSuggestionsPreview.useQuery({
		targetType: typeFilter === 'all' ? undefined : typeFilter,
		filter,
		provider: externalProvider,
		mode: snippetPreviewMode,
		aiProvider: 'stub-gpt',
		includeExternal: true,
		limit: 6,
	})
	const { data: snippetTrialJournal, refetch: refetchSnippetTrialJournal } =
		trpc.seo.snippetTrialJournal.useQuery({
			limit: 8,
			mode: snippetTrialModeFilter === 'all' ? undefined : snippetTrialModeFilter,
			outcome: snippetTrialOutcomeFilter === 'all' ? undefined : snippetTrialOutcomeFilter,
			targetType: snippetTrialTargetTypeFilter,
		})
	const { refetch: exportSnippetTrialCsv, isFetching: isSnippetTrialExporting } =
		trpc.seo.snippetTrialExportCsv.useQuery(
			{
				mode: snippetTrialModeFilter === 'all' ? undefined : snippetTrialModeFilter,
				outcome: snippetTrialOutcomeFilter === 'all' ? undefined : snippetTrialOutcomeFilter,
				targetType: snippetTrialTargetTypeFilter,
				limit: 200,
			},
			{ enabled: false },
		)
	const { data: weeklyTriageBoard } = trpc.seo.weeklyTriageBoard.useQuery()
	const { data: weeklyFollowUpQueue, refetch: refetchWeeklyFollowUpQueue } =
		trpc.seo.weeklyFollowUpQueue.useQuery({ limit: 10 })
	const { data: weeklyActionJournal, refetch: refetchWeeklyActionJournal } =
		trpc.seo.weeklyActionJournal.useQuery({ limit: 8 })
	const { data: externalIntegrations } = trpc.seo.externalIntegrationsStatus.useQuery()
	const { data: externalOperationsHistory } =
		trpc.seo.externalOperationsHistory.useQuery({ limit: 8 })
	const {
		data: cannibalizationPreview,
		refetch: runCannibalizationPreview,
		isFetching: isCannibalizationLoading,
	} = trpc.seo.cannibalizationPreview.useQuery(
		{
			provider: externalProvider,
			dateFrom: externalDateFrom || undefined,
			dateTo: externalDateTo || undefined,
			minImpressions: 100,
			maxPosition: 25,
			confidence: cannibalizationConfidence,
			limit: 8,
		},
		{ enabled: false },
	)
	const {
		data: staleContentPreview,
		refetch: runStaleContentPreview,
		isFetching: isStalePreviewLoading,
	} = trpc.seo.staleContentQueuePreview.useQuery(
		{
			provider: externalProvider,
			targetType: staleTargetType,
			dateFrom: externalDateFrom || undefined,
			dateTo: externalDateTo || undefined,
			minAgeDays: 30,
			minImpressions: 100,
			minImpressionsGrowthPct: 20,
			minCtrDropPct: 15,
			minWeakPosition: 10,
			limit: 8,
		},
		{ enabled: false },
	)
	const {
		data: externalProviderPreview,
		refetch: runExternalProviderPreview,
		isFetching: isExternalPreviewing,
	} = trpc.seo.externalProviderTriagePreview.useQuery(
		{
			provider: externalProvider,
			dateFrom: externalDateFrom || undefined,
			dateTo: externalDateTo || undefined,
			priorityFilter: externalPriorityFilter,
			limit: 20,
		},
		{ enabled: false },
	)
	const { refetch: exportExternalProviderCsv, isFetching: isExternalExporting } =
		trpc.seo.externalProviderTriageExportCsv.useQuery(
			{
				provider: externalProvider,
				dateFrom: externalDateFrom || undefined,
				dateTo: externalDateTo || undefined,
				priorityFilter: externalPriorityFilter,
				limit: 100,
			},
			{ enabled: false },
		)
	const { refetch: exportAuditCsv, isFetching: isExporting } =
		trpc.seo.exportAuditCsv.useQuery(
			{
				targetType: typeFilter === 'all' ? undefined : typeFilter,
				filter,
			},
			{ enabled: false },
		)
	const { mutate: updateSeo } = trpc.seo.update.useMutation({
		onSuccess: () => {
			toast.success('SEO сохранено')
			refetch()
		},
	})

	const {
		data: previewData,
		isFetching: isPreviewing,
		refetch: runPreview,
	} = trpc.seo.bulkGeneratePreview.useQuery(
		{ targetType: bulkTargetType, mode: bulkMode, onlyMissing: bulkOnlyMissing, limit: BULK_UI_LIMIT },
		{ enabled: false },
	)

	const { mutateAsync: applyBulk, isPending: isApplying } = trpc.seo.bulkGenerateApply.useMutation()

	const { mutateAsync: logWeeklyTriageDecision, isPending: isLoggingWeeklyDecision } =
		trpc.seo.logWeeklyTriageDecision.useMutation({
			onSuccess: (result) => {
				toast.success(`Решение по зоне ${result.zone} зафиксировано. Follow-up: ${new Date(result.followUpAt).toLocaleDateString('ru-RU')}`)
				refetchWeeklyFollowUpQueue()
				refetchWeeklyActionJournal()
			},
			onError: (err) => toast.error(err.message ?? 'Не удалось зафиксировать triage-решение'),
		})

	const { mutateAsync: logWeeklyFollowUpReview, isPending: isLoggingFollowUpReview } =
		trpc.seo.logWeeklyFollowUpReview.useMutation({
			onSuccess: (result) => {
				toast.success(
					result.outcome === 'reviewed'
						? 'Follow-up проверка зафиксирована'
						: `Follow-up перенесён до ${result.followUpAt ? new Date(result.followUpAt).toLocaleDateString('ru-RU') : 'следующей недели'}`,
				)
				refetchWeeklyFollowUpQueue()
				refetchWeeklyActionJournal()
			},
			onError: (err) => toast.error(err.message ?? 'Не удалось зафиксировать follow-up'),
		})

	const { mutateAsync: logSnippetTrialDecision, isPending: isLoggingSnippetTrialDecision } =
		trpc.seo.logSnippetTrialDecision.useMutation({
			onSuccess: (result) => {
				toast.success(
					`Trial-решение сохранено: ${result.mode} → ${result.outcome}${typeof result.deltaCtrPct === 'number' ? ` (${result.deltaCtrPct.toFixed(1)}% CTR)` : ''}`,
				)
				refetchSnippetTrialJournal()
			},
			onError: (err) => toast.error(err.message ?? 'Не удалось зафиксировать snippet trial'),
		})

	const handlePreview = async () => {
		await runPreview()
		setBulkPreviewDone(true)
	}

	const getBulkApplyInput = (cursor?: string) => ({
		targetType: bulkTargetType,
		mode: bulkMode,
		onlyMissing: bulkOnlyMissing,
		limit: BULK_UI_LIMIT,
		...(cursor ? { cursor } : {}),
	})

	const finishBulkApply = () => {
		setBulkPreviewDone(false)
		refetch()
		refetchWeeklyActionJournal()
	}

	const handleApplyCurrentBatch = async () => {
		try {
			const result = await applyBulk(getBulkApplyInput())
			finishBulkApply()
			toast.success(
				`Обработан батч: ${result.applied} изменений, ${result.skipped} пропусков, ${result.errors} ошибок.`,
			)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось применить батч')
		}
	}

	const handleApplyAll = async () => {
		if (isApplyingAll) return
		setIsApplyingAll(true)
		try {
			let cursor: string | undefined
			let batches = 0
			let applied = 0
			let skipped = 0
			let errors = 0

			do {
				const result = await applyBulk(getBulkApplyInput(cursor))
				batches += 1
				applied += result.applied
				skipped += result.skipped
				errors += result.errors
				cursor = result.nextCursor ?? undefined
			} while (cursor)

			finishBulkApply()
			const message = `Обработано всё: ${applied} изменений за ${batches} батчей. Пропущено: ${skipped}. Ошибок: ${errors}.`
			errors > 0 ? toast.error(message) : toast.success(message)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось обработать весь список')
		} finally {
			setIsApplyingAll(false)
		}
	}

	const handleExportCsv = async () => {
		const result = await exportAuditCsv()
		const csv = result.data?.csv
		if (!csv) {
			toast.error('Не удалось сформировать CSV')
			return
		}

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		const ts = new Date().toISOString().slice(0, 10)
		link.download = `seo-audit-${ts}.csv`
		link.click()
		URL.revokeObjectURL(link.href)
		toast.success(`CSV выгружен (${result.data?.count ?? 0} строк)`)
	}

	const handleExternalPreview = async () => {
		const result = await runExternalProviderPreview()
		if (!result.data) {
			toast.error('Не удалось получить внешний triage preview')
			return
		}
		toast.success(
			`Загружено сигналов: ${result.data.totalSignals}. P1: ${result.data.summary.P1}, P2: ${result.data.summary.P2}`,
		)
	}

	const handleExternalExportCsv = async () => {
		const result = await exportExternalProviderCsv()
		const csv = result.data?.csv
		if (!csv) {
			toast.error('Не удалось сформировать CSV внешнего triage')
			return
		}

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		const ts = new Date().toISOString().slice(0, 10)
		link.download = `seo-external-triage-${externalProvider}-${ts}.csv`
		link.click()
		URL.revokeObjectURL(link.href)
		toast.success(`Внешний triage CSV выгружен (${result.data?.count ?? 0} строк)`) 
	}

	const handleCannibalizationPreview = async () => {
		const result = await runCannibalizationPreview()
		if (!result.data) {
			toast.error('Не удалось получить preview каннибализации')
			return
		}
		toast.success(
			`Кандидатов: ${result.data.totalCandidates}. High: ${result.data.summary.high}, Medium: ${result.data.summary.medium}`,
		)
	}

	const handleStalePreview = async () => {
		const result = await runStaleContentPreview()
		if (!result.data) {
			toast.error('Не удалось получить stale-content preview')
			return
		}
		toast.success(
			`Stale-очередь: ${result.data.totalQueue}. P1: ${result.data.summary.p1}, P2: ${result.data.summary.p2}`,
		)
	}

	const handleWeeklyDecision = async (
		zone: 'product' | 'category' | 'page' | 'tech',
		decision: 'safe-bulk-fix' | 'manual-review' | 'monitor' | 'tech-check',
	) => {
		await logWeeklyTriageDecision({
			zone,
			decision,
			bulkMode: decision === 'safe-bulk-fix' ? 'strict' : undefined,
		})
	}

	const handleFollowUpReview = async (
		decisionId: string,
		outcome: 'reviewed' | 'deferred',
	) => {
		await logWeeklyFollowUpReview({ decisionId, outcome })
	}

	const handleSnippetTrialDecision = async (
		item: {
			targetType: SeoTargetType
			source: 'rule' | 'hybrid'
			externalContext: { impressions: number; ctr: number; position: number } | null
			scoring?: { variant: 'base' | 'commercial' | 'delivery' } | undefined
		},
		outcome: 'promote' | 'keep-testing' | 'reject',
	) => {
		const baselineCtr = item.externalContext?.ctr ?? 0.01
		const candidateCtr =
			outcome === 'promote'
				? Math.min(1, baselineCtr * 1.12)
				: outcome === 'keep-testing'
					? Math.min(1, baselineCtr * 1.04)
					: Math.max(0, baselineCtr * 0.96)

		const variant =
			item.scoring?.variant ?? (item.source === 'hybrid' ? 'hybrid' : 'rule')

		await logSnippetTrialDecision({
			targetType: item.targetType,
			mode: snippetPreviewMode,
			variant,
			windowDays: 14,
			baselineCtr,
			candidateCtr,
			impressions: item.externalContext?.impressions ?? 0,
			outcome,
			note:
				'Быстрый trial-лог из preview. CTR для записи оценён эвристикой и требует последующей проверки по внешним отчётам.',
		})
	}

	const handleSnippetTrialExportCsv = async () => {
		const result = await exportSnippetTrialCsv()
		const csv = result.data?.csv
		if (!csv) {
			toast.error('Не удалось сформировать trial CSV')
			return
		}

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		const ts = new Date().toISOString().slice(0, 10)
		link.download = `seo-snippet-trial-${ts}.csv`
		link.click()
		URL.revokeObjectURL(link.href)
		toast.success(`Trial CSV выгружен (${result.data?.count ?? 0} строк)`) 
	}

	const filtered = (seoList ?? []).filter((item) => {
		if (filter === 'missing-title') return !item.title
		if (filter === 'missing-desc') return !item.description
		if (filter === 'noindex') return item.noIndex
		return true
	})

	const snippetTrialItems = snippetTrialJournal?.items ?? []
	const snippetTrialSummary = buildSnippetTrialSummary(snippetTrialItems)

	const handleEdit = <K extends keyof SeoEditFields>(
		id: string,
		field: K,
		value: SeoEditFields[K],
	) => {
		setEditing((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? {}), [field]: value },
		}))
	}

	const handleSave = (item: (typeof filtered)[number]) => {
		if (!isSeoTargetType(item.targetType)) {
			toast.error('Некорректный тип SEO-цели')
			return
		}

		const changes: SeoEditFields = editing[item.id] ?? {}
		updateSeo({
			targetType: item.targetType,
			targetId: item.targetId,
			title: changes.title !== undefined ? changes.title : item.title,
			description: changes.description !== undefined ? changes.description : item.description,
			keywords: changes.keywords !== undefined ? changes.keywords : item.keywords,
			ogTitle: changes.ogTitle !== undefined ? changes.ogTitle : item.ogTitle,
			ogDescription: changes.ogDescription !== undefined ? changes.ogDescription : item.ogDescription,
			ogImage: changes.ogImage !== undefined ? changes.ogImage : item.ogImage,
			canonicalUrl: changes.canonicalUrl !== undefined ? changes.canonicalUrl : item.canonicalUrl,
			noIndex: changes.noIndex !== undefined ? changes.noIndex : item.noIndex,
		})
		setExpandedId(null)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>SEO Массовый редактор</h1>
					<p className='text-sm text-muted-foreground'>Редактирование и аудит мета-тегов</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={handleExportCsv}
						disabled={isExporting}
						className='gap-2'
					>
						<Download className='h-4 w-4' />
						{isExporting ? 'Экспорт…' : 'Экспорт CSV'}
					</Button>
					<Button variant='outline' size='sm' onClick={() => setBulkOpen((v) => !v)} className='gap-2'>
						<Wand2 className='h-4 w-4' />
						Авто-генерация
					</Button>
				</div>
			</div>

				{/* H3: Внешние интеграции (read-only, только приоритизация) */}
				{externalIntegrations && (
					<Card className='border-border'>
						<CardContent className='p-4 space-y-3'>
							<div className='flex items-center gap-2 text-sm font-medium'>
								<Link2 className='h-4 w-4 text-muted-foreground' />
								Интеграции GSC / Яндекс
							</div>
							<p className='text-xs text-muted-foreground'>
								{externalIntegrations.principle}
							</p>
							<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
								{externalIntegrations.providers.map((provider) => (
									<div
										key={provider.provider}
										className='rounded-lg border border-border bg-secondary/20 p-3 space-y-2'
									>
										<div className='flex items-center justify-between gap-2'>
											<div className='text-sm font-medium'>{provider.label}</div>
											<Badge
												variant='secondary'
												className={provider.configured ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}
											>
												{provider.configured ? 'configured' : 'not configured'}
											</Badge>
										</div>
										<div className='text-[11px] text-muted-foreground'>
											Метрики: {provider.pulls.join(', ')}
										</div>
									</div>
								))}
							</div>

							<div className='rounded-lg border border-border bg-card p-3 space-y-3'>
								<div className='flex flex-wrap items-center gap-2'>
									<div className='text-xs font-medium text-muted-foreground'>Provider preview</div>
									{EXTERNAL_PROVIDERS.map((provider) => (
										<Button
											key={provider}
											size='sm'
											variant={externalProvider === provider ? 'default' : 'outline'}
											onClick={() => setExternalProvider(provider)}
											className='text-xs h-7'
										>
											{provider === 'google-search-console' ? 'GSC' : 'Яндекс'}
										</Button>
									))}
								</div>

								<div className='flex flex-wrap items-center gap-2'>
									{EXTERNAL_PRIORITY_FILTERS.map((priority) => (
										<Button
											key={priority}
											size='sm'
											variant={externalPriorityFilter === priority ? 'secondary' : 'ghost'}
											onClick={() => setExternalPriorityFilter(priority)}
											className='text-xs h-7'
										>
											{priority === 'all' && 'Все'}
											{priority === 'p1' && 'Только P1'}
											{priority === 'p1-p2' && 'P1 + P2'}
										</Button>
									))}
								</div>

								<div className='grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]'>
									<Input
										type='date'
										value={externalDateFrom}
										onChange={(e) => setExternalDateFrom(e.target.value)}
										aria-label='Дата начала периода для внешнего triage'
									/>
									<Input
										type='date'
										value={externalDateTo}
										onChange={(e) => setExternalDateTo(e.target.value)}
										aria-label='Дата окончания периода для внешнего triage'
									/>
									<Button
										size='sm'
										variant='outline'
										onClick={handleExternalPreview}
										disabled={isExternalPreviewing}
									>
										{isExternalPreviewing ? 'Загрузка…' : 'Обновить preview'}
									</Button>
								</div>

								<div className='flex flex-wrap items-center gap-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={handleExternalExportCsv}
										disabled={isExternalExporting}
										className='gap-2'
									>
										<Download className='h-4 w-4' />
										{isExternalExporting ? 'Экспорт…' : 'Экспорт triage CSV'}
									</Button>
									{externalProviderPreview?.generatedAt && (
										<span className='text-[11px] text-muted-foreground'>
											Обновлено: {new Date(externalProviderPreview.generatedAt).toLocaleString('ru-RU')}
										</span>
									)}
								</div>

								{externalProviderPreview && (
									<div className='space-y-2'>
										<div className='flex flex-wrap items-center gap-2'>
											<Badge className='bg-destructive/15 text-destructive'>P1: {externalProviderPreview.summary.P1}</Badge>
											<Badge className='bg-warning/15 text-warning'>P2: {externalProviderPreview.summary.P2}</Badge>
											<Badge variant='secondary'>P3: {externalProviderPreview.summary.P3}</Badge>
											<Badge variant='secondary'>P4: {externalProviderPreview.summary.P4}</Badge>
											<Badge variant='outline'>Источник: {externalProviderPreview.source}</Badge>
											<Badge variant='outline'>Показано: {externalProviderPreview.filteredSignals}</Badge>
										</div>

										<div className='space-y-1 max-h-44 overflow-y-auto'>
											{externalProviderPreview.top
												.slice(0, 8)
												.map((item) => (
													<div
														key={`${item.targetType}-${item.targetId}`}
														className='rounded border border-border bg-secondary/20 p-2 text-xs space-y-0.5'
													>
														<div className='flex items-center justify-between gap-2'>
															<div className='font-medium truncate'>{item.url}</div>
															<Badge className={item.priority === 'P1' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}>
																{item.priority}
															</Badge>
														</div>
														<div className='text-muted-foreground line-clamp-2'>{item.reasons.join(' · ')}</div>
													</div>
												))}
										</div>
									</div>
								)}

								<div className='rounded-lg border border-border bg-secondary/10 p-3 space-y-2'>
									<div className='text-xs font-medium text-muted-foreground'>История запусков</div>
									{(externalOperationsHistory?.items?.length ?? 0) === 0 ? (
										<div className='text-xs text-muted-foreground'>
											Пока нет запусков external triage/export.
										</div>
									) : (
										<div className='space-y-1 max-h-48 overflow-y-auto'>
											{externalOperationsHistory?.items.map((item) => (
												<div
													key={item.id}
													className='rounded border border-border bg-background p-2 text-xs space-y-1'
												>
													<div className='flex flex-wrap items-center gap-2'>
														<Badge variant='secondary'>{item.provider}</Badge>
														<Badge variant='outline'>{item.action}</Badge>
														<Badge className={item.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}>
															{item.status}
														</Badge>
														<span className='text-muted-foreground'>count: {item.count}</span>
													</div>
													<div className='text-muted-foreground'>
														{new Date(item.createdAt).toLocaleString('ru-RU')}
														{item.priorityFilter ? ` · filter: ${item.priorityFilter}` : ''}
														{item.source ? ` · source: ${item.source}` : ''}
													</div>
													{(item.dateFrom || item.dateTo) && (
														<div className='text-muted-foreground'>
															Период: {item.dateFrom ?? '—'} → {item.dateTo ?? '—'}
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>

								<div className='rounded-lg border border-border bg-card p-3 space-y-3'>
									<div className='flex flex-wrap items-center justify-between gap-2'>
										<div>
											<div className='text-xs font-medium text-muted-foreground'>H7.2 · Каннибализация запросов (preview)</div>
											<div className='text-[11px] text-muted-foreground'>Read-only кандидаты query → URL pair, без auto-apply.</div>
										</div>
										<div className='flex gap-2'>
											{CANNIBALIZATION_CONFIDENCE.map((level) => (
												<Button
													key={level}
													size='sm'
													variant={cannibalizationConfidence === level ? 'secondary' : 'ghost'}
													onClick={() => setCannibalizationConfidence(level)}
													className='h-7 text-xs'
												>
													{level === 'all' ? 'Все' : 'Только high'}
												</Button>
											))}
										</div>
									</div>

									<div className='flex flex-wrap items-center gap-2'>
										<Button
											size='sm'
											variant='outline'
											onClick={handleCannibalizationPreview}
											disabled={isCannibalizationLoading}
										>
											{isCannibalizationLoading ? 'Загрузка…' : 'Обновить cannibalization preview'}
										</Button>
										{cannibalizationPreview && (
											<>
												<Badge variant='outline'>signals: {cannibalizationPreview.totalSignals}</Badge>
												<Badge className='bg-destructive/15 text-destructive'>high: {cannibalizationPreview.summary.high}</Badge>
												<Badge className='bg-warning/15 text-warning'>medium: {cannibalizationPreview.summary.medium}</Badge>
												<Badge variant='secondary'>provider: {cannibalizationPreview.provider}</Badge>
											</>
										)}
									</div>

									{cannibalizationPreview && cannibalizationPreview.items.length === 0 ? (
										<div className='text-xs text-muted-foreground'>
											Кандидаты не найдены для выбранных условий.
										</div>
									) : (
										<div className='space-y-2 max-h-64 overflow-y-auto'>
											{cannibalizationPreview?.items.map((item) => (
												<div key={item.query} className='rounded-lg border border-border bg-secondary/10 p-3 text-xs space-y-2'>
													<div className='flex flex-wrap items-center gap-2'>
														<Badge className={item.confidence === 'high' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}>
															{item.confidence}
														</Badge>
														<Badge variant='outline'>imp: {item.totalImpressions}</Badge>
														<div className='font-medium'>{item.query}</div>
													</div>
													<div className='space-y-1'>
														{item.urls.slice(0, 3).map((urlItem) => (
															<div key={urlItem.url} className='rounded border border-border bg-background p-2 text-[11px]'>
																<div className='truncate'>{urlItem.url}</div>
																<div className='text-muted-foreground'>
																	imp {urlItem.impressions} · ctr {(urlItem.ctr * 100).toFixed(2)}% · pos {urlItem.position.toFixed(1)}
																</div>
															</div>
														))}
													</div>
													<ul className='space-y-1 text-muted-foreground'>
														{item.reasons.map((reason) => (
															<li key={reason}>• {reason}</li>
														))}
													</ul>
												</div>
											))}
										</div>
									)}
								</div>

								<div className='rounded-lg border border-border bg-card p-3 space-y-3'>
									<div className='flex flex-wrap items-center justify-between gap-2'>
										<div>
											<div className='text-xs font-medium text-muted-foreground'>H7.3 · Stale-content queue (preview)</div>
											<div className='text-[11px] text-muted-foreground'>Очередь задач на регенерацию stale-контента (read-only).</div>
										</div>
										<div className='flex flex-wrap gap-2'>
											{STALE_TARGET_TYPES.map((type) => (
												<Button
													key={type}
													size='sm'
													variant={staleTargetType === type ? 'secondary' : 'ghost'}
													onClick={() => setStaleTargetType(type)}
													className='h-7 text-xs'
												>
													{type === 'all' ? 'Все' : type}
												</Button>
											))}
										</div>
									</div>

									<div className='flex flex-wrap items-center gap-2'>
										<Button
											size='sm'
											variant='outline'
											onClick={handleStalePreview}
											disabled={isStalePreviewLoading}
										>
											{isStalePreviewLoading ? 'Загрузка…' : 'Обновить stale queue'}
										</Button>
										{staleContentPreview && (
											<>
												<Badge variant='outline'>signals: {staleContentPreview.totalSignals}</Badge>
												<Badge className='bg-destructive/15 text-destructive'>P1: {staleContentPreview.summary.p1}</Badge>
												<Badge className='bg-warning/15 text-warning'>P2: {staleContentPreview.summary.p2}</Badge>
												<Badge variant='secondary'>queue: {staleContentPreview.totalQueue}</Badge>
											</>
										)}
									</div>

									{staleContentPreview && staleContentPreview.items.length === 0 ? (
										<div className='text-xs text-muted-foreground'>
											Под текущие условия stale-очередь пустая.
										</div>
									) : (
										<div className='space-y-2 max-h-64 overflow-y-auto'>
											{staleContentPreview?.items.map((item) => (
												<div key={`${item.targetType}-${item.targetId}`} className='rounded-lg border border-border bg-secondary/10 p-3 text-xs space-y-2'>
													<div className='flex flex-wrap items-center gap-2'>
														<Badge variant='secondary'>{item.targetType}</Badge>
														<Badge className={item.priority === 'P1' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}>
															{item.priority}
														</Badge>
														<div className='font-medium'>{item.entityName}</div>
													</div>
													<div className='text-muted-foreground truncate'>{item.url}</div>
													<div className='text-muted-foreground'>
														Возраст: {item.daysSinceContentUpdate} дн · рост показов: +{item.impressionsGrowthPct}% · падение CTR: {item.ctrDropPct}% · позиция: {item.currentPosition}
													</div>
													<ul className='space-y-1 text-muted-foreground'>
														{item.reasons.map((reason) => (
															<li key={reason}>• {reason}</li>
														))}
													</ul>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

			{/* H1/H5: Операционная сводка */}
			{opsOverview && (
				<div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
					<Card className='border-border'>
						<CardContent className='p-3 space-y-1'>
							<div className='flex items-center gap-2 text-xs text-muted-foreground'>
								<Activity className='h-3.5 w-3.5' />
								За 24 часа
							</div>
							<div className='text-sm'>Ошибки bulk: <span className='font-bold'>{opsOverview.daily.bulkErrors}</span></div>
							<div className='text-sm'>P1: <span className='font-bold text-destructive'>{opsOverview.daily.p1Count}</span></div>
							<div className='text-sm'>P2: <span className='font-bold text-warning'>{opsOverview.daily.p2Count}</span></div>
						</CardContent>
					</Card>

					<Card className='border-border'>
						<CardContent className='p-3 space-y-1'>
							<div className='flex items-center gap-2 text-xs text-muted-foreground'>
								<BarChart3 className='h-3.5 w-3.5' />
								Заполненность (7д)
							</div>
							<div className='text-sm'>Title: <span className='font-bold'>{opsOverview.weekly.titleFilledPct}%</span></div>
							<div className='text-sm'>Description: <span className='font-bold'>{opsOverview.weekly.descriptionFilledPct}%</span></div>
							<div className='text-sm'>OG image: <span className='font-bold'>{opsOverview.weekly.ogFilledPct}%</span></div>
						</CardContent>
					</Card>

					<Card className='border-border'>
						<CardContent className='p-3 space-y-1'>
							<div className='text-xs text-muted-foreground'>Качество (7д)</div>
							<div className='text-sm'>Средний score: <span className='font-bold'>{opsOverview.weekly.averageScore}</span></div>
							<div className='text-sm'>Duplicate canonical: <span className='font-bold'>{opsOverview.weekly.duplicateCanonicalCount}</span></div>
						</CardContent>
					</Card>

					<Card className='border-border'>
						<CardContent className='p-3 space-y-1'>
							<div className='text-xs text-muted-foreground'>Динамика (7д)</div>
							<div className='text-sm'>Noindex (тек. неделя): <span className='font-bold'>{opsOverview.weekly.noIndexCurrentWeek}</span></div>
							<div className='text-sm'>Noindex (ранее): <span className='font-bold'>{opsOverview.weekly.noIndexPreviousWeek}</span></div>
							<div className='text-sm'>Bulk applied: <span className='font-bold'>{opsOverview.weekly.weeklyBulkApplied}</span></div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* H7.1: Read-only suggestions preview */}
			{snippetSuggestionsPreview && (
				<Card className='border-border'>
					<CardContent className='p-4 space-y-4'>
						<div className='flex flex-col gap-1 md:flex-row md:items-end md:justify-between'>
							<div>
								<h2 className='text-sm font-semibold'>Suggestions preview для сниппетов</h2>
								<p className='text-xs text-muted-foreground'>
									Rule, rule-scored и hybrid рекомендации по title/description. Только preview, без auto-apply.
								</p>
							</div>
							<div className='flex flex-wrap items-center gap-2'>
								{SNIPPET_PREVIEW_MODES.map((mode) => (
									<Button
										key={mode}
										size='sm'
										variant={snippetPreviewMode === mode ? 'secondary' : 'ghost'}
										onClick={() => setSnippetPreviewMode(mode)}
										className='h-7 text-xs'
									>
										{mode === 'rule' ? 'Rule preview' : mode === 'rule-scored' ? 'Rule scored' : 'Hybrid preview'}
									</Button>
								))}
								<div className='text-xs text-muted-foreground'>
									Источник: {snippetSuggestionsPreview.source}
									{snippetSuggestionsPreview.provider ? ` · external: ${snippetSuggestionsPreview.provider}` : ''}
								</div>
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-2 text-xs'>
							<Badge variant='outline'>Всего: {snippetSuggestionsPreview.summary.total}</Badge>
							<Badge className='bg-success/15 text-success'>low risk: {snippetSuggestionsPreview.summary.lowRisk}</Badge>
							<Badge className='bg-warning/15 text-warning'>medium risk: {snippetSuggestionsPreview.summary.mediumRisk}</Badge>
							<Badge variant='secondary'>with external: {snippetSuggestionsPreview.summary.withExternalContext}</Badge>
							{snippetPreviewMode === 'rule-scored' && (
								<Badge variant='outline'>rule-scored selected: {snippetSuggestionsPreview.summary.ruleScoredSelected}</Badge>
							)}
							{snippetPreviewMode === 'hybrid' && (
								<Badge variant='outline'>hybrid applied: {snippetSuggestionsPreview.summary.hybridApplied}</Badge>
							)}
						</div>

						{snippetSuggestionsPreview.items.length === 0 ? (
							<div className='rounded-xl border border-border bg-secondary/10 p-4 text-xs text-muted-foreground'>
								Для текущих фильтров suggestions preview пока пуст. Тихо, спокойно, почти подозрительно.
							</div>
						) : (
							<div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
								{snippetSuggestionsPreview.items.map((item) => (
									<div key={`${item.targetType}-${item.targetId}`} className='rounded-xl border border-border bg-card p-4 space-y-3'>
										<div className='flex flex-wrap items-start justify-between gap-2'>
											<div className='space-y-1'>
												<div className='flex flex-wrap gap-2'>
													<Badge variant='secondary'>{item.targetType}</Badge>
													<Badge className={item.priority === 'P1' ? 'bg-destructive/15 text-destructive' : item.priority === 'P2' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}>
														{item.priority}
													</Badge>
													<Badge variant='outline'>{item.risk}</Badge>
													{item.scoring && (
														<Badge variant='outline'>score {item.scoring.score}</Badge>
													)}
												</div>
												<div className='text-sm font-medium'>{item.entityName}</div>
												<div className='text-[11px] text-muted-foreground truncate'>{item.url}</div>
											</div>
											{item.externalContext && (
												<div className='rounded-lg bg-secondary/20 px-2 py-1 text-[11px] text-muted-foreground'>
													imp {item.externalContext.impressions} · ctr {(item.externalContext.ctr * 100).toFixed(1)}% · pos {item.externalContext.position.toFixed(1)}
												</div>
											)}
										</div>

										<div className='grid gap-3 md:grid-cols-2'>
											<div className='rounded-lg border border-border bg-secondary/10 p-3 space-y-2'>
												<div className='text-[11px] font-medium text-muted-foreground'>Текущий сниппет</div>
												<div className='text-xs'>
													<div className='font-medium text-foreground/80'>{item.currentTitle ?? '—'}</div>
													<div className='mt-1 text-muted-foreground'>{item.currentDescription ?? '—'}</div>
												</div>
											</div>
											<div className='rounded-lg border border-border bg-success/5 p-3 space-y-2'>
												<div className='text-[11px] font-medium text-muted-foreground'>Рекомендация</div>
												<div className='text-xs'>
													<div className='font-medium text-foreground'>{item.suggestedTitle}</div>
													<div className='mt-1 text-muted-foreground'>{item.suggestedDescription}</div>
												</div>
											</div>
										</div>

										<div className='space-y-1'>
											<div className='text-[11px] font-medium text-muted-foreground'>Почему это предложено</div>
											<ul className='space-y-1 text-xs text-muted-foreground'>
												{item.reasons.map((reason) => (
													<li key={reason} className='rounded-md bg-secondary/10 px-2 py-1'>
														{reason}
													</li>
												))}
											</ul>
											{item.scoring && (
												<div className='grid grid-cols-2 gap-1 text-[11px] text-muted-foreground'>
													<div>length: {item.scoring.breakdown.length}</div>
													<div>ctr: {item.scoring.breakdown.ctrOpportunity}</div>
													<div>clarity: {item.scoring.breakdown.clarity}</div>
													<div>unique: {item.scoring.breakdown.uniqueness}</div>
												</div>
											)}
											<div className='flex flex-wrap gap-2 pt-1'>
												<Button
													size='sm'
													variant='outline'
													disabled={isLoggingSnippetTrialDecision}
													onClick={() => handleSnippetTrialDecision(item, 'promote')}
													className='h-7 text-[11px]'
												>
													Trial: promote
												</Button>
												<Button
													size='sm'
													variant='ghost'
													disabled={isLoggingSnippetTrialDecision}
													onClick={() => handleSnippetTrialDecision(item, 'keep-testing')}
													className='h-7 text-[11px]'
												>
													Trial: keep testing
												</Button>
												<Button
													size='sm'
													variant='ghost'
													disabled={isLoggingSnippetTrialDecision}
													onClick={() => handleSnippetTrialDecision(item, 'reject')}
													className='h-7 text-[11px]'
												>
													Trial: reject
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						<div className='rounded-xl border border-border bg-secondary/10 p-3 space-y-2'>
							<div className='flex items-center justify-between gap-2'>
								<div className='text-xs font-medium text-muted-foreground'>Snippet trial journal (A/B-safe)</div>
								<div className='flex items-center gap-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={handleSnippetTrialExportCsv}
										disabled={isSnippetTrialExporting}
										className='h-7 text-[11px] gap-1'
									>
										<Download className='h-3 w-3' />
										{isSnippetTrialExporting ? 'Экспорт…' : 'Экспорт CSV'}
									</Button>
									<Badge variant='outline'>H7.5</Badge>
								</div>
							</div>
							<div className='flex flex-wrap items-center gap-2'>
								{SNIPPET_TRIAL_FILTER_MODES.map((mode) => (
									<Button
										key={mode}
										size='sm'
										variant={snippetTrialModeFilter === mode ? 'secondary' : 'ghost'}
										onClick={() => setSnippetTrialModeFilter(mode)}
										className='h-7 text-[11px]'
									>
										{mode}
									</Button>
								))}
							</div>
							<div className='flex flex-wrap items-center gap-2'>
								{SNIPPET_TRIAL_OUTCOMES.map((outcome) => (
									<Button
										key={outcome}
										size='sm'
										variant={snippetTrialOutcomeFilter === outcome ? 'secondary' : 'ghost'}
										onClick={() => setSnippetTrialOutcomeFilter(outcome)}
										className='h-7 text-[11px]'
									>
										{outcome}
									</Button>
								))}
							</div>
							<div className='flex flex-wrap items-center gap-2'>
								{SNIPPET_TRIAL_TARGET_TYPES.map((targetType) => (
									<Button
										key={targetType}
										size='sm'
										variant={snippetTrialTargetTypeFilter === targetType ? 'secondary' : 'ghost'}
										onClick={() => setSnippetTrialTargetTypeFilter(targetType)}
										className='h-7 text-[11px]'
									>
										{targetType}
									</Button>
								))}
							</div>
							<div className='flex flex-wrap items-center gap-2 text-xs'>
								<Badge variant='outline'>total: {snippetTrialSummary.total}</Badge>
								<Badge className='bg-success/15 text-success'>promote: {snippetTrialSummary.promote}</Badge>
								<Badge className='bg-warning/15 text-warning'>keep-testing: {snippetTrialSummary.keepTesting}</Badge>
								<Badge className='bg-destructive/15 text-destructive'>reject: {snippetTrialSummary.reject}</Badge>
								<Badge variant='secondary'>
									avg ΔCTR: {snippetTrialSummary.avgDeltaCtrPct === null ? '—' : `${snippetTrialSummary.avgDeltaCtrPct.toFixed(1)}%`}
								</Badge>
								<Badge variant='secondary'>
									best mode: {snippetTrialSummary.bestMode ?? '—'}
									{snippetTrialSummary.bestModeAvgDeltaCtr === null
										? ''
										: ` (${snippetTrialSummary.bestModeAvgDeltaCtr.toFixed(1)}%)`}
								</Badge>
							</div>
							{(snippetTrialJournal?.items?.length ?? 0) === 0 ? (
								<div className='text-xs text-muted-foreground'>
									Пока нет trial-решений по сниппетам.
								</div>
							) : (
								<div className='space-y-2 max-h-56 overflow-y-auto'>
									{snippetTrialJournal?.items.map((entry) => (
										<div key={entry.id} className='rounded-lg border border-border bg-background p-2 text-xs space-y-1'>
											<div className='flex flex-wrap items-center gap-2'>
												{entry.mode && <Badge variant='secondary'>{entry.mode}</Badge>}
												{entry.variant && <Badge variant='outline'>{entry.variant}</Badge>}
												{entry.outcome && <Badge variant='outline'>{entry.outcome}</Badge>}
												<span className='text-muted-foreground'>imp: {entry.impressions}</span>
												{typeof entry.deltaCtrPct === 'number' && (
													<span className='text-muted-foreground'>ΔCTR: {entry.deltaCtrPct.toFixed(1)}%</span>
												)}
											</div>
											<div className='text-muted-foreground'>
												{new Date(entry.createdAt).toLocaleString('ru-RU')}
												{entry.targetType ? ` · ${entry.targetType}` : ''}
												{entry.windowDays ? ` · окно ${entry.windowDays}д` : ''}
											</div>
											{entry.note && <div className='text-muted-foreground'>{entry.note}</div>}
										</div>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* H4: Еженедельный triage по зонам ответственности */}
			{weeklyTriageBoard && (
				<Card className='border-border'>
					<CardContent className='p-4 space-y-4'>
						<div className='flex flex-col gap-1 md:flex-row md:items-end md:justify-between'>
							<div>
								<h2 className='text-sm font-semibold'>Weekly triage по зонам</h2>
								<p className='text-xs text-muted-foreground'>
									Еженедельная сортировка P1/P2 проблем по владельцам product/category/page/tech.
								</p>
							</div>
							<div className='text-xs text-muted-foreground'>
								Обновлено: {new Date(weeklyTriageBoard.generatedAt).toLocaleString('ru-RU')}
							</div>
						</div>

						<div className='grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4'>
							{weeklyTriageBoard.zones.map((zone) => (
								<div
									key={zone.key}
									className='rounded-xl border border-border bg-card p-4 space-y-3'
								>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<div className='text-sm font-medium'>{zone.label}</div>
											<div className='text-[11px] text-muted-foreground'>owner: {zone.ownerKey}</div>
										</div>
										<Badge
											className={
												zone.severity === 'critical'
													? 'bg-destructive/15 text-destructive'
													: zone.severity === 'warning'
														? 'bg-warning/15 text-warning'
														: 'bg-success/15 text-success'
											}
										>
											{zone.severity}
										</Badge>
									</div>

									<div className='grid grid-cols-3 gap-2 text-center'>
										<div className='rounded-lg bg-secondary/30 p-2'>
											<div className='text-lg font-bold text-destructive'>{zone.p1Count}</div>
											<div className='text-[10px] text-muted-foreground'>P1</div>
										</div>
										<div className='rounded-lg bg-secondary/30 p-2'>
											<div className='text-lg font-bold text-warning'>{zone.p2Count}</div>
											<div className='text-[10px] text-muted-foreground'>P2</div>
										</div>
										<div className='rounded-lg bg-secondary/30 p-2'>
											<div className='text-lg font-bold'>{zone.total}</div>
											<div className='text-[10px] text-muted-foreground'>Всего</div>
										</div>
									</div>

									<div className='space-y-1'>
										<div className='text-[11px] font-medium text-muted-foreground'>Что делать на неделе</div>
										<p className='text-xs leading-5'>{zone.recommendedAction}</p>
										<p className='text-[11px] text-muted-foreground'>{zone.note}</p>
									</div>

									<div className='flex flex-wrap gap-2 pt-1'>
										{zone.key !== 'tech' && (
											<Button
												size='sm'
												variant='outline'
												disabled={isLoggingWeeklyDecision}
												onClick={() => handleWeeklyDecision(zone.key, 'safe-bulk-fix')}
												className='h-7 text-[11px]'
											>
												Safe fix
											</Button>
										)}
										<Button
											size='sm'
											variant='ghost'
											disabled={isLoggingWeeklyDecision}
											onClick={() =>
												handleWeeklyDecision(
													zone.key,
													zone.key === 'tech' ? 'tech-check' : 'manual-review',
												)
											}
											className='h-7 text-[11px]'
										>
											{zone.key === 'tech' ? 'Tech-check' : 'Manual review'}
										</Button>
										<Button
											size='sm'
											variant='ghost'
											disabled={isLoggingWeeklyDecision}
											onClick={() => handleWeeklyDecision(zone.key, 'monitor')}
											className='h-7 text-[11px]'
										>
											Мониторинг
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
							<Badge variant='outline'>P1 всего: {weeklyTriageBoard.summary.totalP1}</Badge>
							<Badge variant='outline'>P2 всего: {weeklyTriageBoard.summary.totalP2}</Badge>
							<Badge variant='outline'>Активных зон: {weeklyTriageBoard.summary.totalZonesWithWork}</Badge>
							<Badge variant='secondary'>Период: {weeklyTriageBoard.periodDays} дней</Badge>
						</div>

						<div className='rounded-xl border border-border bg-card p-3 space-y-3'>
							<div className='flex items-center justify-between gap-2'>
								<div>
									<div className='text-sm font-medium'>Follow-up контроль</div>
									<div className='text-xs text-muted-foreground'>Проверка impact через 7 дней после triage-решения.</div>
								</div>
								<div className='flex flex-wrap gap-2 text-xs'>
									<Badge className='bg-destructive/15 text-destructive'>overdue: {weeklyFollowUpQueue?.summary.overdue ?? 0}</Badge>
									<Badge className='bg-warning/15 text-warning'>today: {weeklyFollowUpQueue?.summary.dueToday ?? 0}</Badge>
									<Badge variant='secondary'>upcoming: {weeklyFollowUpQueue?.summary.upcoming ?? 0}</Badge>
								</div>
							</div>

							{(weeklyFollowUpQueue?.items?.length ?? 0) === 0 ? (
								<div className='text-xs text-muted-foreground'>
									Нет активных follow-up задач — редкий, но приятный зверь.
								</div>
							) : (
								<div className='space-y-2'>
									{weeklyFollowUpQueue?.items.map((item) => (
										<div key={item.decisionId} className='rounded-lg border border-border bg-secondary/10 p-3 text-xs space-y-2'>
											<div className='flex flex-wrap items-center gap-2'>
												{item.zoneLabel && <Badge variant='secondary'>{item.zoneLabel}</Badge>}
												{item.decision && <Badge variant='outline'>{item.decision}</Badge>}
												<Badge
													className={
														item.state === 'overdue'
															? 'bg-destructive/15 text-destructive'
															: item.state === 'today'
																? 'bg-warning/15 text-warning'
																: 'bg-success/15 text-success'
													}
												>
													{item.state}
												</Badge>
												<span className='text-muted-foreground'>count: {item.count}</span>
											</div>
											<div className='text-muted-foreground'>
												Follow-up: {new Date(item.followUpAt).toLocaleDateString('ru-RU')}
												{item.ownerKey ? ` · owner: ${item.ownerKey}` : ''}
											</div>
											{item.note && <div className='text-muted-foreground'>{item.note}</div>}
											<div className='flex flex-wrap gap-2'>
												<Button
													size='sm'
													variant='outline'
													disabled={isLoggingFollowUpReview}
													onClick={() => handleFollowUpReview(item.decisionId, 'reviewed')}
													className='h-7 text-[11px]'
												>
													Проверено
												</Button>
												<Button
													size='sm'
													variant='ghost'
													disabled={isLoggingFollowUpReview}
													onClick={() => handleFollowUpReview(item.decisionId, 'deferred')}
													className='h-7 text-[11px]'
												>
													Перенести 7д
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className='rounded-xl border border-border bg-secondary/10 p-3 space-y-2'>
							<div className='flex items-center justify-between gap-2'>
								<div className='text-xs font-medium text-muted-foreground'>Журнал triage и bulk-решений</div>
								<Badge variant='outline'>H4.2 / H6</Badge>
							</div>
							{(weeklyActionJournal?.items?.length ?? 0) === 0 ? (
								<div className='text-xs text-muted-foreground'>
									Пока нет зафиксированных weekly triage решений.
								</div>
							) : (
								<div className='space-y-2 max-h-64 overflow-y-auto'>
									{weeklyActionJournal?.items.map((item) => (
										<div key={item.id} className='rounded-lg border border-border bg-background p-3 text-xs space-y-1.5'>
											<div className='flex flex-wrap items-center gap-2'>
												<Badge variant='secondary'>
													{item.type === 'seo-bulk-apply'
														? 'bulk apply'
														: item.type === 'seo-weekly-follow-up-review'
															? 'follow-up review'
															: 'triage decision'}
												</Badge>
												{item.zoneLabel && <Badge variant='outline'>{item.zoneLabel}</Badge>}
												{item.decision && <Badge variant='outline'>{item.decision}</Badge>}
												{item.outcome && <Badge variant='outline'>{item.outcome}</Badge>}
												{item.bulkMode && <Badge variant='outline'>mode: {item.bulkMode}</Badge>}
												<Badge className={item.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}>
													{item.status}
												</Badge>
												<span className='text-muted-foreground'>count: {item.count}</span>
											</div>
											<div className='text-muted-foreground'>
												{new Date(item.createdAt).toLocaleString('ru-RU')}
												{item.operatorName ? ` · ${item.operatorName}` : item.operatorEmail ? ` · ${item.operatorEmail}` : ''}
												{item.ownerKey ? ` · owner: ${item.ownerKey}` : ''}
											</div>
											{item.note && <div className='text-muted-foreground'>{item.note}</div>}
											{item.followUpAt && (
												<div className='text-muted-foreground'>Follow-up: {new Date(item.followUpAt).toLocaleDateString('ru-RU')}</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Bulk-панель */}
			{bulkOpen && (
				<Card className='border-border'>
					<CardContent className='p-4 space-y-4'>
						<div className='text-sm font-medium'>Массовая генерация SEO</div>
						<div className='text-xs text-muted-foreground'>
							Предпросмотр показывает первые {BULK_UI_LIMIT} записей, а кнопка «Обработать всё» проходит по всем батчам автоматически.
						</div>
						<div className='grid grid-cols-3 gap-3'>
							<div className='space-y-1'>
								<label className='text-xs text-muted-foreground'>Тип</label>
								<div className='flex gap-1 flex-wrap'>
									{TARGET_TYPE_OPTIONS.map((t) => (
										<Button
											key={t}
											size='sm'
											variant={bulkTargetType === t ? 'default' : 'outline'}
											onClick={() => { setBulkTargetType(t); setBulkPreviewDone(false) }}
											className='text-xs h-7'
										>
											{BULK_TARGET_LABELS[t]}
										</Button>
									))}
								</div>
							</div>
							<div className='space-y-1'>
								<label className='text-xs text-muted-foreground'>Режим</label>
								<div className='flex flex-col gap-1'>
									{BULK_MODES.map((m) => (
										<label key={m} className='flex items-center gap-2 cursor-pointer'>
											<input
												type='radio'
												name='bulk-mode'
												checked={bulkMode === m}
												onChange={() => { setBulkMode(m); setBulkPreviewDone(false) }}
												className='accent-primary'
											/>
											<span className='text-xs'>{BULK_MODE_LABELS[m]}</span>
										</label>
									))}
								</div>
							</div>
							<div className='space-y-3'>
								<div className='space-y-1'>
									<label className='text-xs text-muted-foreground'>Параметры</label>
									<div className='flex items-center gap-2'>
										<Switch
											checked={bulkOnlyMissing}
											onCheckedChange={(v) => { setBulkOnlyMissing(v); setBulkPreviewDone(false) }}
											id='only-missing'
										/>
										<label htmlFor='only-missing' className='text-xs cursor-pointer'>Только без SEO-записи</label>
									</div>
								</div>
								<div className='flex gap-2 pt-2'>
									<Button size='sm' variant='outline' onClick={handlePreview} disabled={isPreviewing} className='flex-1 text-xs'>
										{isPreviewing ? 'Считаем…' : 'Предпросмотр'}
									</Button>
									<Button size='sm' onClick={handleApplyCurrentBatch} disabled={!bulkPreviewDone || isApplying || isApplyingAll} className='flex-1 text-xs'>
										{isApplying ? 'Применяем…' : 'Применить батч'}
									</Button>
									<Button size='sm' variant='secondary' onClick={handleApplyAll} disabled={isApplying || isApplyingAll} className='flex-1 text-xs'>
										{isApplyingAll ? 'Обрабатываем всё…' : 'Обработать всё'}
									</Button>
								</div>
								{bulkMode === 'force' && (
									<div className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive'>
										<AlertTriangle className='h-3.5 w-3.5 shrink-0' />
										Полный режим перезапишет все поля
									</div>
								)}
							</div>
						</div>
						{previewData && bulkPreviewDone && (
							<div className='rounded-lg border border-border bg-secondary/30 p-3 space-y-2'>
								<div className='flex items-center gap-2 text-sm font-medium'>
									<CheckCircle2 className='h-4 w-4 text-success' />
									Результат предпросмотра
								</div>
								<div className='grid grid-cols-3 gap-3 text-center text-xs'>
									<div><div className='text-lg font-bold'>{previewData.total}</div><div className='text-muted-foreground'>всего</div></div>
									<div><div className='text-lg font-bold text-warning'>{previewData.affected}</div><div className='text-muted-foreground'>изменится</div></div>
									<div><div className='text-lg font-bold text-muted-foreground'>{previewData.unchanged}</div><div className='text-muted-foreground'>без изменений</div></div>
								</div>
								{previewData.samples.length > 0 && (
									<div className='space-y-1 max-h-40 overflow-y-auto'>
										<div className='text-xs font-medium text-muted-foreground'>Примеры изменений:</div>
										{previewData.samples.slice(0, 5).map((s) => (
											<div key={s.targetId} className='rounded border border-border bg-background p-2 text-xs'>
												<div className='font-medium truncate'>{s.entityName}</div>
												{s.diff.slice(0, 2).map((d) => (
													<div key={String(d.field)} className='text-muted-foreground truncate'>
														<span className='text-destructive line-through'>{String(d.before ?? '—').slice(0, 40)}</span>
														{' → '}
														<span className='text-success'>{String(d.after ?? '—').slice(0, 40)}</span>
													</div>
												))}
											</div>
										))}
									</div>
								)}
							</div>
						)}
				</CardContent>
				</Card>
			)}

			{/* Фильтры */}
			<div className='flex gap-2 flex-wrap items-center'>
				<div className='flex gap-1'>
					<Button size='sm' variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTypeFilter('all')} className='text-xs h-7'>
						Все типы
					</Button>
					{TARGET_TYPE_OPTIONS.map((t) => (
						<Button key={t} size='sm' variant={typeFilter === t ? 'default' : 'outline'} onClick={() => setTypeFilter(t)} className='text-xs h-7'>
							{t}
						</Button>
					))}
				</div>
				<div className='w-px h-5 bg-border' />
				{SEO_FILTERS.map((f) => (
					<Button
						key={f}
						variant={filter === f ? 'secondary' : 'ghost'}
						size='sm'
						onClick={() => setFilter(f)}
						className='text-xs h-7'
					>
						{f === 'all' && 'Все'}
						{f === 'missing-title' && 'Нет title'}
						{f === 'missing-desc' && 'Нет desc'}
						{f === 'noindex' && 'Noindex'}
					</Button>
				))}
			</div>

			<Card className='border-border'>
				<CardContent className='p-0'>
					<table className='w-full text-sm'>
						<thead>
							<tr className='border-b border-border bg-secondary/50'>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Тип</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>ID</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Title</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Description</th>
								<th className='text-center p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Score</th>
								<th className='text-center p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Noindex</th>
								<th className='text-right p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'></th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((item) => {
								const isOpen = expandedId === item.id
								const edit = editing[item.id] ?? {}
								const score = computeScore({
									title: edit.title !== undefined ? edit.title : item.title,
									description: edit.description !== undefined ? edit.description : item.description,
									ogImage: edit.ogImage !== undefined ? edit.ogImage : item.ogImage,
								})
								return (
									<>
										<tr key={item.id} className='border-b border-border hover:bg-secondary/30'>
											<td className='p-3'>
												<Badge variant='secondary' className='text-[10px]'>
													{item.targetType}
												</Badge>
											</td>
											<td className='p-3 font-mono text-xs text-muted-foreground max-w-[100px] truncate'>
												{item.targetId}
											</td>
											<td className='p-3 max-w-[200px]'>
												<div className={`text-xs truncate ${!item.title ? 'text-destructive' : ''}`}>
													{item.title || '—'}
												</div>
											</td>
											<td className='p-3 max-w-[200px]'>
												<div className={`text-xs truncate ${!item.description ? 'text-destructive' : ''}`}>
													{item.description || '—'}
												</div>
											</td>
											<td className='p-3 text-center'>
												<ScoreBadge score={score} />
											</td>
											<td className='p-3 text-center'>
												{item.noIndex ? (
													<Badge className='bg-warning/15 text-warning text-[10px]'>No</Badge>
												) : (
													<Badge className='bg-success/15 text-success text-[10px]'>Yes</Badge>
												)}
											</td>
											<td className='p-3 text-right'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => {
														setExpandedId(isOpen ? null : item.id)
														setEditing((prev) => ({
															...prev,
															[item.id]: {
																	title: item.title,
																	description: item.description,
																	keywords: item.keywords,
																	ogTitle: item.ogTitle,
																	ogDescription: item.ogDescription,
																	canonicalUrl: item.canonicalUrl,
																	noIndex: item.noIndex,
															},
														}))
													}}
												>
													{isOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
												</Button>
											</td>
										</tr>
										{isOpen && (
											<tr className='border-b border-border bg-secondary/20'>
											<td colSpan={7} className='p-4 space-y-3'>
													<div className='grid grid-cols-2 gap-3'>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>Meta Title</label>
															<Input
																value={edit.title ?? ''}
																onChange={(e) => handleEdit(item.id, 'title', e.target.value)}
																className='text-xs'
															/>
														</div>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>Keywords</label>
															<Input
																value={edit.keywords ?? ''}
																onChange={(e) => handleEdit(item.id, 'keywords', e.target.value)}
																className='text-xs'
															/>
														</div>
													</div>
													<div className='space-y-2'>
														<label className='text-xs font-medium'>Meta Description</label>
														<textarea
															className='w-full rounded-(--radius-md) border border-input bg-background px-3 py-2 text-xs min-h-[60px]'
															value={edit.description ?? ''}
														onChange={(e) => handleEdit(item.id, 'description', e.target.value)}
													/>
													<div className='text-[10px] text-muted-foreground text-right'>{(edit.description ?? '').length}/160</div>
													</div>
													<div className='grid grid-cols-2 gap-3'>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>OG Title</label>
															<Input
																value={edit.ogTitle ?? ''}
																onChange={(e) => handleEdit(item.id, 'ogTitle', e.target.value)}
																className='text-xs'
															/>
														</div>
														<div className='space-y-2'>
															<label className='text-xs font-medium'>OG Description</label>
															<Input
																value={edit.ogDescription ?? ''}
																onChange={(e) => handleEdit(item.id, 'ogDescription', e.target.value)}
																className='text-xs'
															/>
														</div>
													</div>
												<div className='grid grid-cols-2 gap-3'>
													<div className='space-y-2'>
														<label className='text-xs font-medium'>OG Image URL</label>
														<Input
															value={edit.ogImage ?? ''}
															onChange={(e) => handleEdit(item.id, 'ogImage', e.target.value)}
															className='text-xs'
														/>
													</div>
													<div className='space-y-2'>
														<label className='text-xs font-medium'>Canonical URL</label>
														<Input
															value={edit.canonicalUrl ?? ''}
															onChange={(e) => handleEdit(item.id, 'canonicalUrl', e.target.value)}
															className='text-xs'
														/>
													</div>
													</div>
													<div className='flex items-center justify-between py-1'>
														<span className='text-xs font-medium'>Noindex</span>
														<Switch
															checked={!!edit.noIndex}
															onCheckedChange={(v) => handleEdit(item.id, 'noIndex', v)}
														/>
													</div>
												<div className='flex items-start gap-3'>
													<Button size='sm' onClick={() => handleSave(item)} className='gap-1 shrink-0'>
														<Save className='h-3 w-3' />
														Сохранить
													</Button>
													{/* Google Preview */}
													<div className='flex-1 rounded-lg border border-border bg-card p-3 space-y-1'>
														<div className='text-[10px] text-muted-foreground font-medium'>Google Preview</div>
														<div className='text-blue-600 text-xs font-medium truncate'>
															{edit.title ?? item.title ?? 'Заголовок страницы'}
														</div>
														<div className='text-green-700 text-[10px] truncate'>
															{edit.canonicalUrl ?? item.canonicalUrl ?? `https://aurasveta.by/${item.targetType}/${item.targetId.slice(0, 12)}`}
														</div>
														<div className='text-[10px] text-muted-foreground line-clamp-2'>
															{edit.description ?? item.description ?? 'Описание страницы будет отображено в результатах поиска Google.'}
														</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</>
								)
							})}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={7} className='text-center py-12 text-muted-foreground text-sm'>
										Нет записей
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	)
}
