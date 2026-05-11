import { describe, expect, it, vi } from 'vitest'
import robots from '@/app/robots'
import { seoToMetadata } from '@/lib/seo/getmetadata'

vi.mock('next/server', () => ({
	connection: vi.fn(async () => undefined),
}))

const { productFindMany, categoryFindMany, pageFindMany } = vi.hoisted(() => ({
	productFindMany: vi.fn(async () => [
		{ slug: 'product-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') },
	]),
	categoryFindMany: vi.fn(async () => [
		{ slug: 'cat-1', updatedAt: new Date('2026-01-02T00:00:00.000Z') },
	]),
	pageFindMany: vi.fn(async () => [
		{ slug: 'delivery', updatedAt: new Date('2026-01-03T00:00:00.000Z') },
	]),
}))

vi.mock('@/lib/prisma', () => ({
	prisma: {
		product: { findMany: productFindMany },
		category: { findMany: categoryFindMany },
		page: { findMany: pageFindMany },
	},
}))

describe('SEO route smoke', () => {
	it('robots.txt policy корректна', () => {
		const result = robots()
		expect(result.rules).toEqual([{ userAgent: '*', allow: '/' }])
		expect(result.sitemap).toBe('https://aurasveta.by/sitemap.xml')
	})

	it('seoToMetadata правильно выставляет canonical и noindex robots', () => {
		const metadata = seoToMetadata({
			title: 'Тест',
			description: 'Описание',
			keywords: 'test',
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: 'https://aurasveta.by/catalog/test',
			noIndex: true,
		})

		expect(metadata.alternates?.canonical).toBe('https://aurasveta.by/catalog/test')
		expect(metadata.robots).toEqual({ index: false, follow: false })
	})

	it('sitemap включает static + динамические URL', async () => {
		const sitemapModule = await import('@/app/sitemap')
		const entries = await sitemapModule.default()

		const urls = entries.map(item => item.url)
		expect(urls).toContain('https://aurasveta.by')
		expect(urls).toContain('https://aurasveta.by/catalog')
		expect(urls).toContain('https://aurasveta.by/product/product-1')
		expect(urls).toContain('https://aurasveta.by/catalog/cat-1')
		expect(urls).toContain('https://aurasveta.by/pages/delivery')
	})
})
