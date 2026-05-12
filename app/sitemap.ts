import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'

const BASE_URL = 'https://aurasveta.by'

type SitemapEntity = {
	id: string
	slug: string
	updatedAt: Date
}

type SitemapProductEntity = SitemapEntity & {
	images: Array<{
		url: string
		isMain: boolean
		order: number
	}>
}

function toAbsoluteUrl(value: string): string {
	if (/^https?:\/\//i.test(value)) return value
	return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	await connection()

	const [products, categories, pages] = await Promise.all([
		prisma.product.findMany({
			where: { isActive: true },
			select: {
				id: true,
				slug: true,
				updatedAt: true,
				images: {
					select: { url: true, isMain: true, order: true },
					orderBy: [{ isMain: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
					take: 5,
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

	const filteredProducts = products.filter(product => !noIndexProducts.has(product.id))
	const filteredCategories = categories.filter(
		category => !noIndexCategories.has(category.id),
	)
	const filteredPages = pages.filter(page => !noIndexPages.has(page.id))

	const staticLastModified = [
		...filteredProducts.map(product => product.updatedAt),
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

	const productPages: MetadataRoute.Sitemap = filteredProducts.map(
		(product: SitemapProductEntity) => {
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

	const categoryPages: MetadataRoute.Sitemap = filteredCategories.map((category: SitemapEntity) => ({
		url: `${BASE_URL}/catalog/${category.slug}`,
		lastModified: category.updatedAt,
		changeFrequency: 'weekly' as const,
		priority: 0.7,
	}))

	const cmsPages: MetadataRoute.Sitemap = filteredPages.map((page: SitemapEntity) => ({
		url: `${BASE_URL}/pages/${page.slug}`,
		lastModified: page.updatedAt,
		changeFrequency: 'monthly' as const,
		priority: 0.5,
	}))

	return [
		...staticPages,
		...categoryPages,
		...productPages,
		...cmsPages,
	]
}
