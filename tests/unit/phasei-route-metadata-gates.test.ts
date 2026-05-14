import { describe, expect, it, vi, beforeEach } from 'vitest'

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/aurasveta_test'

const {
	categoryGetBySlugMock,
	getMetadataForCategoryMock,
	seoToMetadataMock,
	getProductBySlugMock,
	getMetadataForProductMock,
	seoToProductMetadataMock,
	getProductImageUrlMock,
} = vi.hoisted(() => ({
	categoryGetBySlugMock: vi.fn(),
	getMetadataForCategoryMock: vi.fn(),
	seoToMetadataMock: vi.fn(),
	getProductBySlugMock: vi.fn(),
	getMetadataForProductMock: vi.fn(),
	seoToProductMetadataMock: vi.fn(),
	getProductImageUrlMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/trpc/server', () => ({
	trpc: {
		categories: {
			getBySlug: categoryGetBySlugMock,
		},
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/seo/getmetadata', () => ({
	getMetadataForCategory: getMetadataForCategoryMock,
	seoToMetadata: seoToMetadataMock,
	getMetadataForProduct: getMetadataForProductMock,
	seoToProductMetadata: seoToProductMetadataMock,
}))

vi.mock('@/entities/product/api/productservice', () => ({
	getProductBySlug: getProductBySlugMock,
	getProductSpecGroups: vi.fn(async () => []),
}))

vi.mock('@/shared/lib/productutils', () => ({
	getProductImageUrl: getProductImageUrlMock,
	normalizeProductImages: vi.fn((images: Array<{ url: string }>) => images ?? []),
}))

beforeEach(() => {
	vi.resetModules()
	categoryGetBySlugMock.mockReset()
	getMetadataForCategoryMock.mockReset()
	seoToMetadataMock.mockReset()
	getProductBySlugMock.mockReset()
	getMetadataForProductMock.mockReset()
	seoToProductMetadataMock.mockReset()
	getProductImageUrlMock.mockReset()
})

describe('phase I: route metadata release gates', () => {
	it('catalog generateMetadata ставит noindex для URL с активными query params', async () => {
		categoryGetBySlugMock.mockResolvedValue({
			id: 'cat1',
			name: 'Бра',
			description: 'Категория бра',
		})
		getMetadataForCategoryMock.mockResolvedValue({
			title: 'Бра',
			description: 'Категория бра',
			keywords: null,
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: null,
			noIndex: false,
		})
		seoToMetadataMock.mockReturnValue({
			title: 'Бра',
			alternates: { canonical: 'https://aurasveta.by/catalog/bra' },
		})

		const catalogPageModule = await import('@/app/catalog/[slug]/page')
		const metadata = await catalogPageModule.generateMetadata({
			params: Promise.resolve({ slug: 'bra' }),
			searchParams: Promise.resolve({ minPrice: '100' }),
		})

		expect(metadata.alternates?.canonical).toBe('https://aurasveta.by/catalog/bra')
		expect(metadata.robots).toEqual({ index: false, follow: true })
	}, 120000)

	it('catalog generateMetadata не ставит noindex для canonical category URL', async () => {
		categoryGetBySlugMock.mockResolvedValue({
			id: 'cat2',
			name: 'Люстры',
			description: null,
		})
		getMetadataForCategoryMock.mockResolvedValue({
			title: 'Люстры',
			description: null,
			keywords: null,
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: null,
			noIndex: false,
		})
		seoToMetadataMock.mockReturnValue({
			title: 'Люстры',
			alternates: { canonical: 'https://aurasveta.by/catalog/lyustry' },
		})

		const catalogPageModule = await import('@/app/catalog/[slug]/page')
		const metadata = await catalogPageModule.generateMetadata({
			params: Promise.resolve({ slug: 'lyustry' }),
			searchParams: Promise.resolve({}),
		})

		expect(metadata.alternates?.canonical).toBe('https://aurasveta.by/catalog/lyustry')
		expect(metadata.robots).toBeUndefined()
	}, 20000)

	it('product generateMetadata отдает product-specific canonical и meta signals', async () => {
		getProductBySlugMock.mockResolvedValue({
			id: 'prod-1',
			slug: 'lampa-test',
			name: 'Лампа Test',
			description: 'Описание',
			metaTitle: null,
			metaDesc: null,
			price: 123.45,
			images: [{ url: 'https://aurasveta.by/images/lamp.jpg' }],
			brand: 'Aura',
			inStock: true,
		})
		getMetadataForProductMock.mockResolvedValue({
			title: 'Лампа Test',
			description: 'Описание',
			keywords: null,
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			canonicalUrl: null,
			noIndex: false,
		})
		getProductImageUrlMock.mockReturnValue('https://aurasveta.by/images/lamp.jpg')
		seoToProductMetadataMock.mockReturnValue({
			title: 'Лампа Test',
			alternates: { canonical: 'https://aurasveta.by/product/lampa-test' },
			other: {
				'product:price:amount': '123.45',
				'product:availability': 'https://schema.org/InStock',
			},
		})

		const productPageModule = await import('@/app/product/[slug]/page')
		const metadata = await productPageModule.generateMetadata({
			params: Promise.resolve({ slug: 'lampa-test' }),
		})

		expect(getMetadataForProductMock).toHaveBeenCalledOnce()
		expect(seoToProductMetadataMock).toHaveBeenCalledOnce()
		expect(metadata.alternates?.canonical).toBe('https://aurasveta.by/product/lampa-test')
		expect(metadata.other).toEqual(
			expect.objectContaining({
				'product:price:amount': '123.45',
				'product:availability': 'https://schema.org/InStock',
			}),
		)
	}, 20000)
})
