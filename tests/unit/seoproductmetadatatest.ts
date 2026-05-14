import { describe, expect, it } from 'vitest'

describe('seoToProductMetadata', () => {
	it('формирует product-specific OG и product:* meta поля', async () => {
		process.env.DATABASE_URL ??=
			'postgresql://test:test@localhost:5432/aurasveta_test'
		const { seoToProductMetadata } = await import('@/lib/seo/getmetadata')
		const metadata = seoToProductMetadata(
			{
				title: 'Тестовый товар',
				description: 'Описание',
				ogTitle: null,
				ogDescription: null,
				ogImage: null,
				canonicalUrl: null,
				noIndex: false,
				keywords: null,
			},
			{
				canonicalUrl: 'https://aurasveta.by/product/test',
				imageUrl: 'https://aurasveta.by/images/test.jpg',
				price: 123.45,
				inStock: true,
				currency: 'BYN',
			},
		)

		expect(metadata.alternates?.canonical).toBe(
			'https://aurasveta.by/product/test',
		)
		expect(metadata.other).toEqual(
			expect.objectContaining({
				'og:type': 'product',
				'product:price:amount': '123.45',
				'product:price:currency': 'BYN',
				'product:availability': 'https://schema.org/InStock',
			}),
		)
	})

	it('не добавляет synthetic price meta, когда цены нет', async () => {
		process.env.DATABASE_URL ??=
			'postgresql://test:test@localhost:5432/aurasveta_test'
		const { seoToProductMetadata } = await import('@/lib/seo/getmetadata')
		const metadata = seoToProductMetadata(
			{
				title: 'Тестовый товар без цены',
				description: 'Описание',
				ogTitle: null,
				ogDescription: null,
				ogImage: null,
				canonicalUrl: null,
				noIndex: false,
				keywords: null,
			},
			{
				canonicalUrl: 'https://aurasveta.by/product/no-price',
				imageUrl: null,
				price: null,
				inStock: false,
			},
		)

		expect(metadata.other).toEqual(
			expect.objectContaining({
				'og:type': 'product',
				'product:availability': 'https://schema.org/OutOfStock',
			}),
		)
		expect(metadata.other).not.toEqual(
			expect.objectContaining({
				'product:price:amount': expect.anything(),
			}),
		)
	})
})
