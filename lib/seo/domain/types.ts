import type { NormalizedSeoFields } from '../metadatapersistence'

// ---------- Базовые перечисления ----------

export type SeoEntityType = 'product' | 'category' | 'page'

/**
 * strict        — заполняет только пустые поля, не перезаписывает существующие.
 * safe-overwrite — перезаписывает поле, только если текущее значение совпадает
 *                  с тем, что автогенерация дала бы сейчас (т.е. пользователь
 *                  не менял его вручную).
 * force         — полная перезапись авто-значениями.
 */
export type SeoGenerationMode = 'strict' | 'safe-overwrite' | 'force'

// ---------- Аудит ----------

export type SeoAuditFlagCode =
	| 'TITLE_MISSING'
	| 'TITLE_TOO_SHORT'
	| 'TITLE_TOO_LONG'
	| 'DESC_MISSING'
	| 'DESC_TOO_SHORT'
	| 'DESC_TOO_LONG'
	| 'NO_OG_IMAGE'
	| 'NOINDEX_ACTIVE'

export interface SeoAuditFlag {
	code: SeoAuditFlagCode
	severity: 'error' | 'warning' | 'info'
	message: string
}

export interface SeoScore {
	/** 0–100: итоговая оценка SEO-заполненности записи */
	score: number
	flags: SeoAuditFlag[]
}

// ---------- Diff ----------

export type SeoNullableValue = string | boolean | null | undefined

export interface SeoFieldDiff {
	field: keyof NormalizedSeoFields
	before: SeoNullableValue
	after: SeoNullableValue
}

// ---------- Результат генерации ----------

export interface SeoGenerationResult {
	targetType: SeoEntityType
	targetId: string
	entityName: string
	/** Поля из SeoMetadata в БД до генерации (null если записи нет) */
	before: NormalizedSeoFields | null
	/** Поля после применения режима генерации */
	after: NormalizedSeoFields
	diff: SeoFieldDiff[]
	audit: SeoScore
	changed: boolean
}

// ---------- Bulk операции ----------

export interface BulkPreviewResult {
	total: number
	affected: number
	unchanged: number
	byEntityType: Record<SeoEntityType, number>
	byField: Record<string, { changed: number; emptyBefore: number }>
	/** Первые N изменённых записей для предпросмотра в UI */
	samples: SeoGenerationResult[]
}

export interface BulkApplyResult {
	applied: number
	skipped: number
	errors: number
	/** Следующий курсор для продолжения батчевой обработки, если она ещё не завершена */
	nextCursor?: string | null
	/** Есть ли ещё батчи после текущего */
	hasMore?: boolean
	/** Сколько записей было обработано в текущем батче */
	processed?: number
}
