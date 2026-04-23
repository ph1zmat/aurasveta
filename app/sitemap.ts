import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE_URL = 'https://aurasveta.by'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	await connection()

	const [products, categories, pages] = await Promise.all([
		prisma.product.findMany({
			where: { isActive: true },
			select: { slug: true, updatedAt: true },
		}),
		prisma.category.findMany({
			select: { slug: true, updatedAt: true },
		}),
		prisma.page.findMany({
			where: { isPublished: true },
			select: { slug: true, updatedAt: true },
		}),
	])

	const staticPages: MetadataRoute.Sitemap = [
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

	const productPages: MetadataRoute.Sitemap = products.map(p => ({
		url: `${BASE_URL}/product/${p.slug}`,
		lastModified: p.updatedAt,
		changeFrequency: 'weekly' as const,
		priority: 0.8,
	}))

	const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
		url: `${BASE_URL}/catalog/${c.slug}`,
		lastModified: c.updatedAt,
		changeFrequency: 'weekly' as const,
		priority: 0.7,
	}))

	const cmsPages: MetadataRoute.Sitemap = pages.map(p => ({
		url: `${BASE_URL}/pages/${p.slug}`,
		lastModified: p.updatedAt,
		changeFrequency: 'monthly' as const,
		priority: 0.5,
	}))

	return [...staticPages, ...categoryPages, ...productPages, ...cmsPages]
}
