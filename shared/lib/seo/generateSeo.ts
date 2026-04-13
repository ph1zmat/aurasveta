interface ProductSeoInput {
	name: string
	description?: string | null
	price?: number | null
	images?: string[]
	imagePath?: string | null
	brand?: string | null
	categoryName?: string | null
}

interface CategorySeoInput {
	name: string
	description?: string | null
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

export function generateProductSeo(product: ProductSeoInput) {
	const description = product.description
		? truncate(stripHtml(product.description), 160)
		: `${product.name} — купить в интернет-магазине Аура Света`

	const priceStr = product.price
		? ` по цене ${product.price.toLocaleString('ru-RU')} руб.`
		: ''

	return {
		title: `${product.name} — купить в Аура Света`,
		description: `${description}${priceStr}`,
		ogTitle: product.name,
		ogDescription: description,
		ogImage: product.imagePath ?? product.images?.[0] ?? null,
	}
}

export function generateCategorySeo(category: CategorySeoInput) {
	const description = category.description
		? truncate(stripHtml(category.description), 160)
		: `${category.name} — каталог товаров в интернет-магазине Аура Света`

	return {
		title: `${category.name} — купить в Аура Света`,
		description,
		ogTitle: category.name,
		ogDescription: description,
		ogImage: null,
	}
}

export function generatePageSeo(page: PageSeoInput) {
	const description =
		page.metaDesc ??
		(page.content ? truncate(stripHtml(page.content), 160) : null) ??
		`${page.title} — Аура Света`

	return {
		title: page.metaTitle ?? `${page.title} — Аура Света`,
		description,
		ogTitle: page.title,
		ogDescription: description,
		ogImage: page.imagePath ?? page.image ?? null,
	}
}
