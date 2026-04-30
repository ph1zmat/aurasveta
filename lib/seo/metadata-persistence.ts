import type { Prisma, PrismaClient } from '@prisma/client'
import type { SeoFieldsInput, SeoTargetType } from '@/shared/types/seo'

type DbClient = PrismaClient | Prisma.TransactionClient

export interface NormalizedSeoFields {
	title: string | null
	description: string | null
	keywords: string | null
	ogTitle: string | null
	ogDescription: string | null
	ogImage: string | null
	canonicalUrl: string | null
	noIndex: boolean
}

function normalizeNullableString(value: string | null | undefined) {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

export function normalizeSeoFields(input?: SeoFieldsInput | null): NormalizedSeoFields {
	return {
		title: normalizeNullableString(input?.title),
		description: normalizeNullableString(input?.description),
		keywords: normalizeNullableString(input?.keywords),
		ogTitle: normalizeNullableString(input?.ogTitle),
		ogDescription: normalizeNullableString(input?.ogDescription),
		ogImage: normalizeNullableString(input?.ogImage),
		canonicalUrl: normalizeNullableString(input?.canonicalUrl),
		noIndex: input?.noIndex ?? false,
	}
}

export function mergeSeoFields(
	base?: SeoFieldsInput | null,
	override?: SeoFieldsInput | null,
): NormalizedSeoFields {
	const normalizedBase = normalizeSeoFields(base)
	const normalizedOverride = normalizeSeoFields(override)

	return {
		title: normalizedOverride.title ?? normalizedBase.title,
		description: normalizedOverride.description ?? normalizedBase.description,
		keywords: normalizedOverride.keywords ?? normalizedBase.keywords,
		ogTitle: normalizedOverride.ogTitle ?? normalizedBase.ogTitle,
		ogDescription:
			normalizedOverride.ogDescription ?? normalizedBase.ogDescription,
		ogImage: normalizedOverride.ogImage ?? normalizedBase.ogImage,
		canonicalUrl:
			normalizedOverride.canonicalUrl ?? normalizedBase.canonicalUrl,
		noIndex: override?.noIndex ?? normalizedBase.noIndex,
	}
}

export function hasMeaningfulSeoFields(input: NormalizedSeoFields) {
	return Boolean(
		input.title ??
			input.description ??
			input.keywords ??
			input.ogTitle ??
			input.ogDescription ??
			input.ogImage ??
			input.canonicalUrl ??
			input.noIndex,
	)
}

function readStringValue(record: Record<string, unknown>, key: string) {
	const value = record[key]
	if (typeof value === 'string') return value
	if (Array.isArray(value)) {
		return value.filter(item => typeof item === 'string').join(', ')
	}
	return null
}

export function pageLegacySeoToFields(args: {
	seo?: Record<string, unknown> | null
	metaTitle?: string | null
	metaDesc?: string | null
}): NormalizedSeoFields {
	const record = args.seo ?? {}
	return normalizeSeoFields({
		title: readStringValue(record, 'title') ?? args.metaTitle ?? null,
		description:
			readStringValue(record, 'description') ?? args.metaDesc ?? null,
		keywords: readStringValue(record, 'keywords'),
		ogTitle: readStringValue(record, 'ogTitle'),
		ogDescription: readStringValue(record, 'ogDescription'),
		ogImage: readStringValue(record, 'ogImage'),
		canonicalUrl: readStringValue(record, 'canonicalUrl'),
		noIndex: typeof record.noIndex === 'boolean' ? record.noIndex : false,
	})
}

export async function upsertSeoMetadata(
	db: DbClient,
	args: {
		targetType: SeoTargetType
		targetId: string
		fields: SeoFieldsInput | NormalizedSeoFields | null | undefined
	},
) {
	const normalized = normalizeSeoFields(args.fields)

	if (!hasMeaningfulSeoFields(normalized)) {
		await db.seoMetadata.deleteMany({
			where: {
				targetType: args.targetType,
				targetId: args.targetId,
			},
		})
		return null
	}

	return db.seoMetadata.upsert({
		where: {
			targetType_targetId: {
				targetType: args.targetType,
				targetId: args.targetId,
			},
		},
		create: {
			targetType: args.targetType,
			targetId: args.targetId,
			...normalized,
		},
		update: normalized,
	})
}