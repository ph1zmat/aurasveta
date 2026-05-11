import type { NormalizedSeoFields } from '../metadatapersistence'
import type { SeoAuditFlag, SeoScore } from './types'
import { SEO_RULES } from './rules'

/**
 * Вычисляет SEO-аудит по нормализованным полям.
 * Результат: набор флагов и итоговая оценка 0–100.
 */
export function computeSeoAudit(fields: NormalizedSeoFields): SeoScore {
	const flags: SeoAuditFlag[] = []

	// --- title ---
	if (!fields.title) {
		flags.push({
			code: 'TITLE_MISSING',
			severity: 'error',
			message: 'Заголовок title отсутствует',
		})
	} else if (fields.title.length < SEO_RULES.title.min) {
		flags.push({
			code: 'TITLE_TOO_SHORT',
			severity: 'warning',
			message: `Заголовок слишком короткий (${fields.title.length} < ${SEO_RULES.title.min})`,
		})
	} else if (fields.title.length > SEO_RULES.title.max) {
		flags.push({
			code: 'TITLE_TOO_LONG',
			severity: 'warning',
			message: `Заголовок слишком длинный (${fields.title.length} > ${SEO_RULES.title.max})`,
		})
	}

	// --- description ---
	if (!fields.description) {
		flags.push({
			code: 'DESC_MISSING',
			severity: 'error',
			message: 'Мета-описание отсутствует',
		})
	} else if (fields.description.length < SEO_RULES.description.min) {
		flags.push({
			code: 'DESC_TOO_SHORT',
			severity: 'warning',
			message: `Описание слишком короткое (${fields.description.length} < ${SEO_RULES.description.min})`,
		})
	} else if (fields.description.length > SEO_RULES.description.max) {
		flags.push({
			code: 'DESC_TOO_LONG',
			severity: 'warning',
			message: `Описание слишком длинное (${fields.description.length} > ${SEO_RULES.description.max})`,
		})
	}

	// --- og:image ---
	if (!fields.ogImage) {
		flags.push({
			code: 'NO_OG_IMAGE',
			severity: 'info',
			message: 'OG-изображение не задано',
		})
	}

	// --- noindex ---
	if (fields.noIndex) {
		flags.push({
			code: 'NOINDEX_ACTIVE',
			severity: 'info',
			message: 'Страница закрыта от индексации (noindex)',
		})
	}

	// --- score ---
	let score = 100
	for (const flag of flags) {
		if (flag.code === 'TITLE_MISSING') score -= 25
		else if (flag.code === 'TITLE_TOO_SHORT' || flag.code === 'TITLE_TOO_LONG') score -= 10
		else if (flag.code === 'DESC_MISSING') score -= 25
		else if (flag.code === 'DESC_TOO_SHORT' || flag.code === 'DESC_TOO_LONG') score -= 10
		else if (flag.code === 'NO_OG_IMAGE') score -= 10
		// noindex — инфо, не снижает рейтинг
	}

	return { score: Math.max(0, score), flags }
}
