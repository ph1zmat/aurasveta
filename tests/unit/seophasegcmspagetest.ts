import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const { getPublishedPageRenderDataBySlugMock, getMetadataForPageMock, seoToMetadataMock } =
	vi.hoisted(() => ({
		getPublishedPageRenderDataBySlugMock: vi.fn(),
		getMetadataForPageMock: vi.fn(async () => ({
			title: 'SEO title',
			description: 'SEO description',
			keywords: null,
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: null,
			noIndex: false,
		})),
		seoToMetadataMock: vi.fn(() => ({
			title: 'SEO title',
			alternates: {},
		})),
	}))

vi.mock('@/lib/sections/publicpagedata', () => ({
	getPublishedPageRenderDataBySlug: getPublishedPageRenderDataBySlugMock,
}))

vi.mock('@/lib/seo/getmetadata', () => ({
	getMetadataForPage: getMetadataForPageMock,
	seoToMetadata: seoToMetadataMock,
}))

vi.mock('@/lib/prisma', () => ({
	prisma: {
		pageBlock: {
			findMany: vi.fn(async () => []),
		},
	},
}))

vi.mock('next/navigation', () => ({
	notFound: vi.fn(() => {
		throw new Error('NOT_FOUND')
	}),
}))

vi.mock('@/widgets/header/ui/topbar', () => ({ default: () => null }))
vi.mock('@/widgets/header/ui/headerserver', () => ({ default: () => null }))
vi.mock('@/widgets/navigation/ui/categorynav', () => ({ default: () => null }))
vi.mock('@/widgets/footer/ui/footer', () => ({ default: () => null }))
vi.mock('@/shared/ui/breadcrumbs', () => ({ default: () => null }))
vi.mock('@/shared/ui/deferredimage', () => ({ default: () => null }))
vi.mock('@/widgets/page-renderer/pagerenderer', () => ({ default: () => null }))
vi.mock('@/entities/section/ui/publicsectionrenderer', () => ({ default: () => null }))
vi.mock('@/entities/page-block/ui/publicpageblocksrenderer', () => ({ default: () => null }))

describe('phase G: CMS page metadata + FAQ schema consistency', () => {
	it('generateMetadata выставляет canonical по URL страницы при отсутствии override', async () => {
		getPublishedPageRenderDataBySlugMock.mockResolvedValueOnce({
			page: {
				id: 'pg1',
				title: 'Доставка',
				metaTitle: null,
				metaDesc: null,
				content: '<p>Контент</p>',
				imagePath: null,
				image: null,
				contentBlocks: [],
				imageUrl: null,
			},
			sections: [],
		})

		const pageModule = await import('@/app/pages/[slug]/page')
		const metadata = await pageModule.generateMetadata({
			params: Promise.resolve({ slug: 'delivery' }),
		})

		expect(metadata.alternates?.canonical).toBe(
			'https://aurasveta.by/delivery',
		)
	})

	it('рендерит FAQPage JSON-LD только когда есть валидные FAQ items', async () => {
		getPublishedPageRenderDataBySlugMock.mockResolvedValueOnce({
			page: {
				id: 'pg2',
				title: 'FAQ страница',
				metaTitle: null,
				metaDesc: null,
				content: '<p>Контент</p>',
				imagePath: null,
				image: null,
				contentBlocks: [],
				imageUrl: null,
			},
			sections: [
				{
					id: 's1',
					type: 'faq',
					config: {
						items: [
							{ question: 'Есть доставка?', answer: 'Да.' },
							{ question: ' ', answer: 'Пустой вопрос' },
						],
					},
				},
			],
		})

		const pageModule = await import('@/app/pages/[slug]/page')
		const element = await pageModule.default({
			params: Promise.resolve({ slug: 'faq-page' }),
		})
		const html = renderToStaticMarkup(element)

		expect(html).toContain('application/ld+json')
		expect(html).toContain('"@type":"FAQPage"')
		expect(html).toContain('Есть доставка?')
		expect(html).not.toContain('Пустой вопрос')
	})

	it('не рендерит FAQPage JSON-LD когда faq-секций нет', async () => {
		getPublishedPageRenderDataBySlugMock.mockResolvedValueOnce({
			page: {
				id: 'pg3',
				title: 'О компании',
				metaTitle: null,
				metaDesc: null,
				content: '<p>Контент</p>',
				imagePath: null,
				image: null,
				contentBlocks: [],
				imageUrl: null,
			},
			sections: [{ id: 'hero1', type: 'hero', config: { title: 'Hero' } }],
		})

		const pageModule = await import('@/app/pages/[slug]/page')
		const element = await pageModule.default({
			params: Promise.resolve({ slug: 'about' }),
		})
		const html = renderToStaticMarkup(element)

		expect(html).not.toContain('"@type":"FAQPage"')
	})
})
