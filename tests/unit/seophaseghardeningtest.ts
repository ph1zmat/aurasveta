import { describe, expect, it } from 'vitest'
import {
	buildFaqSchema,
	extractFaqItemsFromSections,
} from '@/lib/seo/schema/builders/faq'
import { buildOrganizationSchema } from '@/lib/seo/schema/builders/organization'
import { buildWebSiteSchema } from '@/lib/seo/schema/builders/website'
import { buildBreadcrumbSchema } from '@/lib/seo/schema/builders/breadcrumb'
import { validateSchema } from '@/lib/seo/schema/validate'

describe('phase G hardening', () => {
	it('FAQ: строит schema для валидных FAQ items из секций', () => {
		const faqItems = extractFaqItemsFromSections([
			{
				type: 'faq',
				config: {
					items: [
						{ question: '  Есть доставка? ', answer: ' Да, по Беларуси.  ' },
					],
				},
			},
		])

		const payload = buildFaqSchema(faqItems)
		expect(payload).not.toBeNull()
		if (!payload) throw new Error('FAQ schema should exist')

		expect(validateSchema('FAQPage', payload).ok).toBe(true)
		expect(payload).toEqual(
			expect.objectContaining({
				mainEntity: [
					expect.objectContaining({
						name: 'Есть доставка?',
						acceptedAnswer: expect.objectContaining({ text: 'Да, по Беларуси.' }),
					}),
				],
			}),
		)
	})

	it('FAQ: не строит schema при отсутствии валидных пар или отсутствии faq-секций', () => {
		const onlyInvalid = extractFaqItemsFromSections([
			{ type: 'faq', config: { items: [{ question: ' ', answer: 'ok' }] } },
			{ type: 'hero', config: { title: 'Без FAQ' } },
		])

		expect(onlyInvalid).toEqual([])
		expect(buildFaqSchema(onlyInvalid)).toBeNull()
		expect(buildFaqSchema([])).toBeNull()
	})

	it('FAQ: безопасно игнорирует частично битые FAQ items', () => {
		const items = extractFaqItemsFromSections([
			{
				type: 'faq',
				config: {
					items: [
						{ question: 'Q1', answer: 'A1' },
						{ question: 'Q2', answer: '' },
						{ question: 42, answer: 'A3' },
						null,
					],
				},
			},
		])

		expect(items).toEqual([{ question: 'Q1', answer: 'A1' }])
	})

	it('Organization: фильтрует пустые поля и невалидные social links', () => {
		const payload = buildOrganizationSchema({
			phone: '   ',
			additionalPhone: ' +375291112233 ',
			email: '   ',
			address: '   ',
			city: null,
			postalCode: '   ',
			workingHours: {},
			socialLinks: [
				{ platform: 'instagram', url: ' https://instagram.com/aura ' },
				{ platform: 'vk', url: 'javascript:alert(1)' },
				{ platform: 'broken', url: 'not-a-url' },
			],
			logoUrl: '/images/logo.png',
			faviconUrl: null,
		})

		expect(validateSchema('Organization', payload).ok).toBe(true)
		expect(payload).toEqual(
			expect.objectContaining({
				sameAs: ['https://instagram.com/aura'],
				telephone: '+375291112233',
			}),
		)
		expect(payload).not.toHaveProperty('email')
		expect(payload).not.toHaveProperty('address')
		expect(payload).toEqual(
			expect.objectContaining({
				logo: expect.objectContaining({
					url: 'https://aurasveta.by/images/logo.png',
				}),
			}),
		)
	})

	it('WebSite: фиксирует SearchAction контракт', () => {
		const payload = buildWebSiteSchema()

		expect(validateSchema('WebSite', payload).ok).toBe(true)
		expect(payload).toEqual(
			expect.objectContaining({
				'@type': 'WebSite',
				potentialAction: expect.objectContaining({
					'@type': 'SearchAction',
					target: expect.objectContaining({
						urlTemplate:
							'https://aurasveta.by/search?q={search_term_string}',
					}),
					'query-input': 'required name=search_term_string',
				}),
			}),
		)
	})

	it('Breadcrumb: корректно нормализует href и оставляет последний crumb без item', () => {
		const payload = buildBreadcrumbSchema([
			{ name: 'Главная', href: '/' },
			{ name: 'Каталог', href: 'catalog' },
			{ name: 'Люстры', href: 'https://aurasveta.by/catalog/lyustry' },
			{ name: 'Подвесные' },
		])

		expect(validateSchema('BreadcrumbList', payload).ok).toBe(true)

		const list = payload.itemListElement as Array<Record<string, unknown>>
		expect(list[0]?.item).toBe('https://aurasveta.by/')
		expect(list[1]?.item).toBe('https://aurasveta.by/catalog')
		expect(list[2]?.item).toBe('https://aurasveta.by/catalog/lyustry')
		expect(list[3]).not.toHaveProperty('item')
	})
})
