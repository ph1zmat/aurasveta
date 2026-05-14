import { describe, expect, it } from 'vitest'
import { buildProductSchema } from '@/lib/seo/schema/builders/product'
import { buildBreadcrumbSchema } from '@/lib/seo/schema/builders/breadcrumb'
import { buildOrganizationSchema } from '@/lib/seo/schema/builders/organization'
import { buildWebSiteSchema } from '@/lib/seo/schema/builders/website'
import { buildFaqSchema } from '@/lib/seo/schema/builders/faq'
import { buildCategoryItemListSchema } from '@/lib/seo/schema/builders/itemlist'
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
			shippingPolicy: {
				countryCode: 'BY',
				currency: 'BYN',
				shippingRate: 10,
				minTransitDays: 2,
				maxTransitDays: 5,
			},
			returnPolicy: {
				returnPolicyCategory: 'FINITE_WINDOW',
				merchantReturnDays: 14,
				returnMethod: 'BY_MAIL',
				returnFees: 'BUYER_PAYS',
			},
			warrantyPolicy: {
				durationMonths: 12,
				warrantyScope: 'MANUFACTURER',
			},
		})

		const result = validateSchema('Product', payload)
		expect(result.ok).toBe(true)
		expect(result.errors).toEqual([])
		expect(result.warnings).toEqual([])
		expect(payload).toEqual(
			expect.objectContaining({
				offers: expect.objectContaining({
					shippingDetails: expect.any(Object),
					hasMerchantReturnPolicy: expect.any(Object),
					hasWarrantyPromise: expect.any(Object),
				}),
				aggregateRating: expect.objectContaining({
					bestRating: 5,
					worstRating: 1,
				}),
			}),
		)
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

	it('маппит condition в корректный itemCondition', () => {
		const payload = buildProductSchema({
			name: 'Люстра после восстановления',
			images: ['https://aurasveta.by/images/2.jpg'],
			price: 99.9,
			inStock: true,
			url: 'https://aurasveta.by/product/refurbished-test',
			condition: 'REFURBISHED',
		})

		expect(payload).toEqual(
			expect.objectContaining({
				offers: expect.objectContaining({
					itemCondition: 'https://schema.org/RefurbishedCondition',
				}),
			}),
		)
	})

	it('блокирует synthetic priceValidUntil без DB-контракта', () => {
		const payload = {
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: 'Synthetic offer',
			offers: {
				'@type': 'Offer',
				price: '100.00',
				priceCurrency: 'BYN',
				availability: 'https://schema.org/InStock',
				url: 'https://aurasveta.by/product/synthetic-offer',
				priceValidUntil: '2099-12-31',
			},
		}

		const result = validateSchema('Product', payload)
		expect(result.ok).toBe(false)
		expect(result.errors.map(e => e.code)).toContain('SYNTHETIC_FIELD')
	})

	it('строит и валидирует ItemList schema с warning на отсутствующие изображения', () => {
		const payload = buildCategoryItemListSchema({
			name: 'Категория Бра',
			url: 'https://aurasveta.by/catalog/bra',
			items: [
				{
					name: 'Бра Test 1',
					url: 'https://aurasveta.by/product/test-1',
					imageUrl: 'https://aurasveta.by/images/test-1.jpg',
					price: 100,
				},
				{
					name: 'Бра Test 2',
					url: 'https://aurasveta.by/product/test-2',
					price: 80,
				},
			],
		})

		const result = validateSchema('ItemList', payload)
		expect(result.ok).toBe(true)
		expect(result.errors).toEqual([])
		expect(result.warnings.map(w => w.code)).toContain('ITEMLIST_MISSING_IMAGE')
	})

	it('не добавляет synthetic priceValidUntil без явного DB-backed источника', () => {
		const payload = buildProductSchema({
			name: 'Люстра без validity date',
			images: ['https://aurasveta.by/images/3.jpg'],
			price: 129.99,
			inStock: true,
			url: 'https://aurasveta.by/product/no-valid-until',
		})

		expect(payload).toEqual(
			expect.objectContaining({
				offers: expect.not.objectContaining({
					priceValidUntil: expect.anything(),
				}),
			}),
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
			postalCode: '247760',
			workingHours: {},
			socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/aura' }],
			logoUrl: '/images/logo.png',
			faviconUrl: null,
		})
		const site = buildWebSiteSchema()

		expect(validateSchema('Organization', org).ok).toBe(true)
		expect(validateSchema('WebSite', site).ok).toBe(true)
		expect(org).toEqual(
			expect.objectContaining({
				email: 'info@aurasveta.by',
				sameAs: ['https://instagram.com/aura'],
			}),
		)
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
