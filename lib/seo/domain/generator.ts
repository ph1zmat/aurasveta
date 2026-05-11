import {
	generateProductSeo,
	generateCategorySeo,
	generatePageSeo,
} from '@/shared/lib/seo/generateseo'
import type { NormalizedSeoFields } from '../metadatapersistence'
import type {
	SeoEntityType,
	SeoFieldDiff,
	SeoGenerationMode,
	SeoGenerationResult,
	SeoNullableValue,
} from './types'
import { computeSeoAudit } from './audit'
import { mergeWithMode } from './merge'

// ---------- Входные данные для каждого типа сущности ----------

export interface ProductEntityInput {
	id: string
	name: string
	description?: string | null
	price?: number | null
	brand?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
	images?: Array<{ url: string } | string>
}

export interface CategoryEntityInput {
	id: string
	name: string
	description?: string | null
	image?: string | null
	imagePath?: string | null
}

export interface PageEntityInput {
	id: string
	title: string
	content?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
	imagePath?: string | null
	image?: string | null
}

// ---------- Утилиты ----------

/**
 * Вычисляет diff между полями «до» и «после».
 * Возвращает только изменившиеся поля.
 */
export function computeDiff(
	before: NormalizedSeoFields | null,
	after: NormalizedSeoFields,
): SeoFieldDiff[] {
	const fields = Object.keys(after) as Array<keyof NormalizedSeoFields>
	const diffs: SeoFieldDiff[] = []

	for (const field of fields) {
		const beforeVal = (before?.[field] ?? null) as SeoNullableValue
		const afterVal = after[field] as SeoNullableValue
		if (beforeVal !== afterVal) {
			diffs.push({ field, before: beforeVal, after: afterVal })
		}
	}

	return diffs
}

// ---------- Генераторы по типу сущности ----------

export function generateProductResult(
	product: ProductEntityInput,
	existing: NormalizedSeoFields | null,
	mode: SeoGenerationMode,
): SeoGenerationResult {
	const auto = generateProductSeo({
		name: product.name,
		description: product.description,
		price: product.price,
		brand: product.brand,
		images: product.images,
	})

	// Legacy поля продукта (metaTitle/metaDesc) учитываем в auto
	const autoWithLegacy = {
		...auto,
		title: product.metaTitle ?? auto.title,
		description: product.metaDesc ?? auto.description,
	}

	const after = mergeWithMode(autoWithLegacy, existing, mode)
	const diff = computeDiff(existing, after)
	const audit = computeSeoAudit(after)

	return {
		targetType: 'product' as SeoEntityType,
		targetId: product.id,
		entityName: product.name,
		before: existing,
		after,
		diff,
		audit,
		changed: diff.length > 0,
	}
}

export function generateCategoryResult(
	category: CategoryEntityInput,
	existing: NormalizedSeoFields | null,
	mode: SeoGenerationMode,
): SeoGenerationResult {
	const auto = generateCategorySeo({
		name: category.name,
		description: category.description,
		images: category.imagePath || category.image ? [{ url: category.imagePath ?? category.image }] : undefined,
	})

	const after = mergeWithMode(auto, existing, mode)
	const diff = computeDiff(existing, after)
	const audit = computeSeoAudit(after)

	return {
		targetType: 'category' as SeoEntityType,
		targetId: category.id,
		entityName: category.name,
		before: existing,
		after,
		diff,
		audit,
		changed: diff.length > 0,
	}
}

export function generatePageResult(
	page: PageEntityInput,
	existing: NormalizedSeoFields | null,
	mode: SeoGenerationMode,
): SeoGenerationResult {
	const auto = generatePageSeo({
		title: page.title,
		content: page.content,
		metaTitle: page.metaTitle,
		metaDesc: page.metaDesc,
		imagePath: page.imagePath,
		image: page.image,
	})

	const after = mergeWithMode(auto, existing, mode)
	const diff = computeDiff(existing, after)
	const audit = computeSeoAudit(after)

	return {
		targetType: 'page' as SeoEntityType,
		targetId: page.id,
		entityName: page.title,
		before: existing,
		after,
		diff,
		audit,
		changed: diff.length > 0,
	}
}
