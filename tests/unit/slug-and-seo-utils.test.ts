import { describe, expect, it, vi } from 'vitest'
import { ensureUniqueSlug, generateSlug } from '@/shared/lib/generateSlug'
import { seoToMetadata } from '@/lib/seo/getMetadata'

vi.mock('@/lib/prisma', () => ({
	prisma: {
		seoMetadata: {
			findUnique: vi.fn(),
		},
	},
}))

describe('generateSlug', () => {
	it('транслитерирует кириллицу и нормализует строку', () => {
		expect(generateSlug('Люстра Хрустальная 2026')).toBe(
			'lyustra-khrustalnaya-2026',
		)
	})

	it('удаляет лишние разделители и обрезает края', () => {
		expect(generateSlug(' ---  Test___Slug   --- ')).toBe('test-slug')
	})

	it('ограничивает длину 100 символами', () => {
		const input = `Товар ${'а'.repeat(200)}`
		const slug = generateSlug(input)
		expect(slug.length).toBeLessThanOrEqual(100)
	})
})

describe('ensureUniqueSlug', () => {
	it('возвращает base slug если он свободен', async () => {
		const slug = await ensureUniqueSlug('Торшер Modern', async () => false)
		expect(slug).toBe('torsher-modern')
	})

	it('добавляет числовой суффикс для занятых slug', async () => {
		const taken = new Set(['bra', 'bra-1'])
		const slug = await ensureUniqueSlug('Бра', async candidate => taken.has(candidate))
		expect(slug).toBe('bra-2')
	})
})

describe('seoToMetadata', () => {
	it('преобразует seo объект в Next Metadata', () => {
		const metadata = seoToMetadata({
			title: 'Каталог',
			description: 'Описание',
			ogTitle: 'OG Каталог',
			ogDescription: 'OG Описание',
			ogImage: 'https://example.com/og.jpg',
			canonicalUrl: 'https://example.com/catalog',
			noIndex: true,
			keywords: 'лампы,свет',
		})

		expect(metadata.title).toBe('Каталог')
		expect(metadata.openGraph?.title).toBe('OG Каталог')
		expect(metadata.openGraph?.images).toEqual(['https://example.com/og.jpg'])
		expect(metadata.alternates?.canonical).toBe('https://example.com/catalog')
		expect(metadata.robots).toEqual({ index: false, follow: false })
	})

	it('использует fallback поля при отсутствии OG/optional значений', () => {
		const metadata = seoToMetadata({
			title: 'Страница',
			description: null,
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: null,
			noIndex: false,
			keywords: null,
		})

		expect(metadata.openGraph?.title).toBe('Страница')
		expect(metadata.openGraph?.images).toBeUndefined()
		expect(metadata.alternates).toBeUndefined()
		expect(metadata.robots).toBeUndefined()
	})
})