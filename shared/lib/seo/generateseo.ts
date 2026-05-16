import type { ProductImage } from '@/shared/types/product'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'

interface ProductSeoInput {
	name: string
	description?: string | null
	price?: number | null
	images?: Array<string | Pick<ProductImage, 'url'> | { url?: string | null }>
	brand?: string | null
	categoryName?: string | null
}

interface CategorySeoInput {
	name: string
	description?: string | null
	images?: Array<string | Pick<ProductImage, 'url'> | { url?: string | null }>
}

interface PageSeoInput {
	title: string
	content?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
	imagePath?: string | null
	image?: string | null
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text
	return text.slice(0, maxLength - 3).trimEnd() + '...'
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function getFirstImage(images: ProductSeoInput['images']): string | null {
	for (const image of images ?? []) {
		if (typeof image === 'string') {
			const value = resolveStorageFileUrl(image)
			if (value) return value
			continue
		}

		const value = resolveStorageFileUrl(image?.url)
		if (value) return value
	}

	return null
}

function smartTitle(parts: string[], maxLen: number): string {
	const separator = ' | '
	for (let i = parts.length; i > 0; i--) {
		const shortened = parts.slice(0, i).join(separator)
		if (shortened.length <= maxLen) return shortened
	}
	return truncate(parts[0], maxLen)
}

export function generateProductSeo(product: ProductSeoInput) {
	const price = product.price ?? null
	const hasPrice = price !== null && price > 0

	// --- TITLE ---
	const titleParts: string[] = [
		product.name,
		product.categoryName || 'светильник',
	]
	if (hasPrice) {
		titleParts.push(`${price.toLocaleString('ru-RU')} Br`)
	}
	titleParts.push('Аура Света')

	const title = smartTitle(titleParts, 65)

	// --- DESCRIPTION ---
	const baseDesc = product.description
		? truncate(stripHtml(product.description), 130)
		: `${product.name} — ${product.categoryName || 'светильник'}`

	const priceStr = hasPrice
		? `за ${price.toLocaleString('ru-RU')} Br`
		: 'по выгодной цене'

	const description = truncate(
		`${baseDesc} ${priceStr}. Доставка 1–3 дня по Мозыру и Беларуси. ` +
			`Шоурум в центре города. Гарантия. Закажите онлайн!`,
		158,
	)

	// --- KEYWORDS --- (без slug-артефактов)
	const seen = new Set<string>()
	const keywordParts: string[] = []
	for (const part of [
		product.name,
		product.categoryName,
		product.brand,
		'купить',
		'цена',
		'Мозырь',
		'Беларусь',
	]) {
		if (!part) continue
		const clean = part
			.trim()
			.toLowerCase()
			.replace(/\b[a-z]+-\d+[a-z-]*\b/gi, '')
			.replace(/\s+/g, ' ')
			.trim()
		if (clean && !seen.has(clean) && clean.length > 1) {
			seen.add(clean)
			keywordParts.push(clean)
		}
	}
	const keywords = keywordParts.join(', ')

	// --- OG ---
	const ogTitle = `${product.name} — ${product.brand || 'Аура Света'}`
	const ogDescription = truncate(
		`${product.name}. ${priceStr}. Доставка по РБ.`,
		200,
	)

	return {
		title,
		description,
		keywords,
		ogTitle,
		ogDescription,
		ogImage: getFirstImage(product.images),
	}
}

export function generateCategorySeo(category: CategorySeoInput) {
	const description = category.description
		? truncate(stripHtml(category.description), 160)
		: `${category.name} в Мозыре — каталог с актуальными ценами в Br, консультацией и доставкой по Беларуси.`

	// Enhanced keywords: category + location + commercial intent
	const keywordParts = [
		category.name,
		'мозырь', // geo
		'купить', // commercial intent
		'каталог', // type signal
		// Extract first few words from description
		category.description
			? stripHtml(category.description).split(/\s+/).slice(0, 3).join(' ')
			: null,
	]
		.filter(Boolean)
		.map(k => k!.trim().toLowerCase())

	const keywords = [...new Set(keywordParts)].join(', ')

	const title = smartTitle(
		[`Купить ${category.name.toLowerCase()} в Мозыре`, 'каталог с ценами', 'Аура Света'],
		65,
	)

	const categoryDescription = truncate(
		`${description}. Актуальные цены в Br. Доставка по Мозыру и РБ. ` +
			`Консультация по выбору. Шоурум в центре города.`,
		158,
	)

	return {
		title,
		description: categoryDescription,
		keywords,
		ogTitle: category.name,
		ogDescription: categoryDescription,
		ogImage: getFirstImage(category.images),
	}
}

export function generatePageSeo(page: PageSeoInput) {
	const description =
		page.metaDesc ??
		(page.content ? truncate(stripHtml(page.content), 160) : null) ??
		`${page.title} — Аура Света`

	// Extract keywords from title and content
	const keywordParts = [
		page.title,
		// Extract first few words from content
		page.content
			? stripHtml(page.content).split(/\s+/).slice(0, 3).join(' ')
			: null,
	]
		.filter(Boolean)
		.map(k => k!.trim().toLowerCase())

	const keywords = [...new Set(keywordParts)].join(', ')

	return {
		title: page.metaTitle ?? `${page.title} — Аура Света`,
		description,
		keywords,
		ogTitle: page.title,
		ogDescription: description,
		ogImage: resolveStorageFileUrl(page.imagePath ?? page.image),
	}
}
