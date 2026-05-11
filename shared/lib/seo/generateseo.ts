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

export function generateProductSeo(product: ProductSeoInput) {
	const description = product.description
		? truncate(stripHtml(product.description), 160)
		: `${product.name} — купить в интернет-магазине Аура Света`

	const priceStr = product.price
		? ` по цене ${product.price.toLocaleString('ru-RU')} Br.`
		: ''

	// Extract keywords from name, category, brand
	const keywordParts = [
		product.name,
		product.categoryName,
		product.brand,
		// Extract first few words from description
		product.description
			? stripHtml(product.description).split(/\s+/).slice(0, 3).join(' ')
			: null,
	]
		.filter(Boolean)
		.map(k => k!.trim().toLowerCase())

	const keywords = [...new Set(keywordParts)].join(', ')

	return {
		title: `${product.name} — купить в Мозыре`,
		description: `${description}${priceStr}`,
		keywords,
		ogTitle: product.name,
		ogDescription: description,
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

	// More commercial title: "Купить [категория] в Мозыре | каталог с ценами"
	const commercialTitle = `Купить ${category.name.toLowerCase()} в Мозыре — каталог с ценами`

	return {
		title: commercialTitle,
		description,
		keywords,
		ogTitle: category.name,
		ogDescription: description,
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
		title: page.metaTitle ?? page.title,
		description,
		keywords,
		ogTitle: page.title,
		ogDescription: description,
		ogImage: resolveStorageFileUrl(page.imagePath ?? page.image),
	}
}
