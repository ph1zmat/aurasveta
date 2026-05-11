import { normalizeSeoFields, type NormalizedSeoFields } from '../metadatapersistence'
import type { SeoGenerationMode } from './types'
import { CANONICAL_BASE_URL, TRACKED_QUERY_PARAMS } from './rules'

/**
 * Нормализует canonical URL:
 * - Удаляет трекинговые параметры
 * - Гарантирует абсолютный URL от CANONICAL_BASE_URL
 * - Возвращает null если URL пустой или невалидный
 */
export function normalizeCanonical(url: string | null | undefined): string | null {
	if (!url) return null

	let parsed: URL
	try {
		// Если относительный — резолвим через базовый домен
		parsed = new URL(url, CANONICAL_BASE_URL)
	} catch {
		return null
	}

	// Удаляем трекинговые параметры
	for (const param of TRACKED_QUERY_PARAMS) {
		parsed.searchParams.delete(param)
	}

	// Нормализуем к продакшен-домену (убираем www, http → https)
	parsed.hostname = parsed.hostname.replace(/^www\./, '')
	parsed.protocol = 'https:'

	return parsed.toString()
}

/**
 * Объединяет авто-сгенерированные поля с существующим override из БД
 * в соответствии с выбранным режимом генерации.
 *
 * strict:        берём из auto только те поля, где existing = null
 * safe-overwrite: перезаписываем поле из auto, если existing совпадает с auto
 *                  (значит пользователь не менял его) или если existing = null
 * force:         полностью перезаписываем из auto
 */
export function mergeWithMode(
	auto: Partial<NormalizedSeoFields>,
	existing: NormalizedSeoFields | null,
	mode: SeoGenerationMode,
): NormalizedSeoFields {
	const normalizedAuto = normalizeSeoFields(auto)

	if (!existing) {
		// Нет override — всегда используем auto
		return normalizedAuto
	}

	if (mode === 'force') {
		return normalizedAuto
	}

	if (mode === 'strict') {
		// Берём auto только для null полей в existing
		return normalizeSeoFields({
			title: existing.title ?? normalizedAuto.title,
			description: existing.description ?? normalizedAuto.description,
			keywords: existing.keywords ?? normalizedAuto.keywords,
			ogTitle: existing.ogTitle ?? normalizedAuto.ogTitle,
			ogDescription: existing.ogDescription ?? normalizedAuto.ogDescription,
			ogImage: existing.ogImage ?? normalizedAuto.ogImage,
			canonicalUrl: existing.canonicalUrl ?? normalizedAuto.canonicalUrl,
			noIndex: existing.noIndex,
		})
	}

	// safe-overwrite: перезаписываем поле только если existing == auto (не кастомизировано)
	function safeField<T extends string | null>(
		existingVal: T,
		autoVal: T,
	): T {
		if (existingVal === null || existingVal === autoVal) return autoVal
		return existingVal
	}

	return normalizeSeoFields({
		title: safeField(existing.title, normalizedAuto.title),
		description: safeField(existing.description, normalizedAuto.description),
		keywords: safeField(existing.keywords, normalizedAuto.keywords),
		ogTitle: safeField(existing.ogTitle, normalizedAuto.ogTitle),
		ogDescription: safeField(existing.ogDescription, normalizedAuto.ogDescription),
		ogImage: safeField(existing.ogImage, normalizedAuto.ogImage),
		canonicalUrl: safeField(existing.canonicalUrl, normalizedAuto.canonicalUrl),
		// noIndex никогда не перезаписываем автоматически в safe-overwrite
		noIndex: existing.noIndex,
	})
}
