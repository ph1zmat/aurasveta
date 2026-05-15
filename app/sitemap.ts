import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'

const BASE_URL = 'https://aurasveta.by'

function toAbsoluteUrl(value: string): string {
	if (/^https?:\/\//i.test(value)) return value
	return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	try {
		const [products, categories, pages] = await Promise.all([
			prisma.product.findMany({
				where: { isActive: true },
				select: {
					id: true,
					slug: true,
					updatedAt: true,
					images: {
						select: { url: true, isMain: true, order: true },
						orderBy: [
							{ isMain: 'desc' },
							{ order: 'asc' },
							{ createdAt: 'asc' },
						],
						take: 15,
					},
				},
			}),
			prisma.category.findMany({
				select: { id: true, slug: true, updatedAt: true },
			}),
			prisma.page.findMany({
				where: { isPublished: true },
				select: { id: true, slug: true, updatedAt: true },
			}),
		])

		const noIndexRows = await prisma.seoMetadata.findMany({
			where: {
				noIndex: true,
				targetType: { in: ['product', 'category', 'page'] },
			},
			select: {
				targetType: true,
				targetId: true,
			},
		})

		const noIndexProducts = new Set(
			noIndexRows
				.filter(row => row.targetType === 'product')
				.map(row => row.targetId),
		)
		const noIndexCategories = new Set(
			noIndexRows
				.filter(row => row.targetType === 'category')
				.map(row => row.targetId),
		)
		const noIndexPages = new Set(
			noIndexRows
				.filter(row => row.targetType === 'page')
				.map(row => row.targetId),
		)

		const filteredProducts = products.filter(
			product => !noIndexProducts.has(product.id),
		)
		const filteredCategories = categories.filter(
			category => !noIndexCategories.has(category.id),
		)
		const filteredPages = pages.filter(page => !noIndexPages.has(page.id))

		// Защита: Google лимит — 50 000 URL. Оставляем запас до 45 000.
		const MAX_URLS = 45_000
		let totalUrls = 2 + filteredProducts.length + filteredCategories.length + filteredPages.length
		let truncatedProducts = filteredProducts
		if (totalUrls > MAX_URLS) {
			const allowedProducts = MAX_URLS - 2 - filteredCategories.length - filteredPages.length
			truncatedProducts = filteredProducts.slice(0, Math.max(0, allowedProducts))
			console.warn(
				`[sitemap] URL limit exceeded: ${totalUrls}. Truncated products to ${truncatedProducts.length}. Consider splitting into sitemap index.`,
			)
		}

		const staticLastModified = [
			...truncatedProducts.map(product => product.updatedAt),
			...filteredCategories.map(category => category.updatedAt),
			...filteredPages.map(page => page.updatedAt),
		].reduce<Date>((latest, current) => {
			return current > latest ? current : latest
		}, new Date(0))

		const normalizedStaticLastModified =
			staticLastModified.getTime() > 0 ? staticLastModified : new Date()

		const staticPages: MetadataRoute.Sitemap = [
			{
				url: BASE_URL,
				lastModified: normalizedStaticLastModified,
				changeFrequency: 'daily',
				priority: 1,
			},
			{
				url: `${BASE_URL}/catalog`,
				lastModified: normalizedStaticLastModified,
				changeFrequency: 'daily',
				priority: 0.9,
			},
		]

		const productPages: MetadataRoute.Sitemap = truncatedProducts.map(
			product => {
				const images = product.images
					.map(image => resolveStorageFileUrl(image.url))
					.filter((value): value is string => Boolean(value))
					.map(toAbsoluteUrl)

				return {
					url: `${BASE_URL}/product/${product.slug}`,
					lastModified: product.updatedAt,
					changeFrequency: 'weekly' as const,
					priority: 0.8,
					images: images.length > 0 ? images : undefined,
				}
			},
		)

		const categoryPages: MetadataRoute.Sitemap = filteredCategories.map(
			category => ({
				url: `${BASE_URL}/catalog/${category.slug}`,
				lastModified: category.updatedAt,
				changeFrequency: 'weekly' as const,
				priority: 0.7,
			}),
		)

		const cmsPages: MetadataRoute.Sitemap = filteredPages.map(
			page => ({
				url: `${BASE_URL}/${page.slug}`,
				lastModified: page.updatedAt,
				changeFrequency: 'monthly' as const,
				priority: 0.5,
			}),
		)

		return [...staticPages, ...categoryPages, ...productPages, ...cmsPages]
	} catch (error) {
		logDatabaseFallback('sitemap.fallback', error)
		return [
			{
				url: BASE_URL,
				lastModified: new Date(),
				changeFrequency: 'daily',
				priority: 1,
			},
			{
				url: `${BASE_URL}/catalog`,
				lastModified: new Date(),
				changeFrequency: 'daily',
				priority: 0.9,
			},
		]
	}
}
