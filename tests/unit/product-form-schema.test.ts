import { describe, it, expect } from 'vitest'
import { productFormSchema } from '@/app/admin/products/product-form.schema'

describe('productFormSchema', () => {
	const validBase = {
		name: 'Aura Lamp',
		slug: 'aura-lamp',
		description: 'Beautiful lamp',
		price: '1000',
		compareAtPrice: '',
		stock: '10',
		sku: 'LAMP-001',
		rootCategoryId: 'root-cat-1',
		subcategoryId: 'sub-cat-1',
		brand: 'Aura',
		brandCountry: '',
		isActive: true,
		images: [],
		properties: [],
		seo: {
			title: 'Aura Lamp',
			description: 'Best lamp ever',
			keywords: 'lamp, light',
			ogTitle: '',
			ogDescription: '',
			ogImage: '',
			canonicalUrl: '',
			noIndex: false,
		},
	}

	it('validates correct data', () => {
		const result = productFormSchema.safeParse(validBase)
		expect(result.success).toBe(true)
	})

	it('fails on empty name', () => {
		const result = productFormSchema.safeParse({ ...validBase, name: '   ' })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path[0] === 'name')).toBe(true)
		}
	})

	it('fails on negative price', () => {
		const result = productFormSchema.safeParse({ ...validBase, price: '-100' })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path[0] === 'price')).toBe(true)
		}
	})

	it('fails on negative stock', () => {
		const result = productFormSchema.safeParse({ ...validBase, stock: '-5' })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path[0] === 'stock')).toBe(true)
		}
	})

	it('preserves properties array', () => {
		const withProps = {
			...validBase,
			properties: [{ propertyId: 'p1', propertyValueId: 'v1' }],
		}
		const result = productFormSchema.safeParse(withProps)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.properties).toHaveLength(1)
		}
	})

	it('preserves seo object', () => {
		const withSeo = {
			...validBase,
			seo: {
				title: 'Custom Title',
				description: 'Custom Desc',
				keywords: 'key1, key2',
				ogTitle: 'OG Title',
				ogDescription: 'OG Desc',
				ogImage: 'https://example.com/og.jpg',
				canonicalUrl: 'https://example.com/canonical',
				noIndex: true,
			},
		}
		const result = productFormSchema.safeParse(withSeo)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.seo.title).toBe('Custom Title')
			expect(result.data.seo.noIndex).toBe(true)
		}
	})
})
