import { describe, expect, it } from 'vitest'
import { buildProductSchema } from '@/lib/seo/schema/builders/product'
import { buildBreadcrumbSchema } from '@/lib/seo/schema/builders/breadcrumb'
import { buildOrganizationSchema } from '@/lib/seo/schema/builders/organization'
import { buildWebSiteSchema } from '@/lib/seo/schema/builders/website'
import { buildFaqSchema } from '@/lib/seo/schema/builders/faq'
import { validateSchema } from '@/lib/seo/schema/validate'

describe('SEO schema builders + validator', () => {
	it('строит и валидирует Product schema', () => {
		const payload = buildProductSchema({
			name: 'Люстра Test',
			description: 'Описание',
			price: 199.99,
			images: ['https://aurasveta.by/images/1.jpg'],
			sku: 'SKU-1',
			brand: 'BrandX',
			inStock: true,
			rating: 4.8,
			reviewsCount: 10,
			url: 'https://aurasveta.by/product/test',
		})

		const result = validateSchema('Product', payload)
		expect(result.ok).toBe(true)
		expect(result.errors).toEqual([])
		expect(result.warnings).toEqual([])
	})

	it('даёт предупреждения для Product без offers/image', () => {
		const payload = buildProductSchema({
			name: 'Люстра без цены',
			images: [],
			inStock: true,
			url: 'https://aurasveta.by/product/no-price',
		})

		const result = validateSchema('Product', payload)
		expect(result.ok).toBe(true)
		expect(result.warnings.map(w => w.code)).toEqual(
			expect.arrayContaining(['MISSING_OFFERS', 'MISSING_IMAGE']),
		)
	})

	it('строит и валидирует BreadcrumbList', () => {
		const payload = buildBreadcrumbSchema([
			{ name: 'Главная', href: '/' },
			{ name: 'Каталог', href: '/catalog' },
			{ name: 'Люстры' },
		])

		const result = validateSchema('BreadcrumbList', payload)
		expect(result.ok).toBe(true)
		expect(result.errors).toEqual([])
	})

	it('строит и валидирует Organization + WebSite', () => {
		const org = buildOrganizationSchema({
			phone: '+375291112233',
			additionalPhone: null,
			email: 'info@aurasveta.by',
			address: 'ул. Пример, 1',
			city: 'Мозырь',
			workingHours: {},
			socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/aura' }],
			logoUrl: '/images/logo.png',
			faviconUrl: null,
		})
		const site = buildWebSiteSchema()

		expect(validateSchema('Organization', org).ok).toBe(true)
		expect(validateSchema('WebSite', site).ok).toBe(true)
	})

	it('строит FAQPage только из валидных Q/A пар', () => {
		const payload = buildFaqSchema([
			{ question: '  Есть доставка?  ', answer: 'Да, по Беларуси.' },
			{ question: ' ', answer: 'Пустой вопрос' },
		])

		expect(payload).not.toBeNull()
		if (!payload) throw new Error('FAQ payload should exist')

		const result = validateSchema('FAQPage', payload)
		expect(result.ok).toBe(true)
		expect((payload.mainEntity as Array<unknown>).length).toBe(1)
	})

	it('возвращает ошибку для неизвестного schema type', () => {
		const result = validateSchema('UnknownType', { '@type': 'UnknownType' })
		expect(result.ok).toBe(false)
		expect(result.errors[0]?.code).toBe('UNKNOWN_TYPE')
	})
})
