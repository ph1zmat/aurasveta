import { describe, expect, it } from 'vitest'
import { buildCategoryItemListSchema } from '@/lib/seo/schema/builders/itemlist'

describe('buildCategoryItemListSchema', () => {
	it('строит ItemList по реальным товарам в правильном порядке', () => {
		const payload = buildCategoryItemListSchema({
			name: 'Бра',
			url: 'https://aurasveta.by/catalog/bra',
			items: [
				{
					name: 'Бра Test 1',
					url: 'https://aurasveta.by/product/test-1',
					imageUrl: 'https://aurasveta.by/images/test-1.jpg',
					price: 199.99,
					priceCurrency: 'BYN',
				},
				{
					name: 'Бра Test 2',
					url: 'https://aurasveta.by/product/test-2',
					price: null,
				},
			],
		})

		expect(payload).toEqual(
			expect.objectContaining({
				'@type': 'ItemList',
				numberOfItems: 2,
			}),
		)

		const entries = payload.itemListElement as Array<Record<string, unknown>>
		expect(entries).toHaveLength(2)
		expect(entries[0]).toEqual(
			expect.objectContaining({
				position: 1,
			}),
		)
		expect(entries[1]).toEqual(
			expect.objectContaining({
				position: 2,
			}),
		)

		const firstItem = entries[0]?.item as Record<string, unknown>
		expect(firstItem.offers).toEqual(
			expect.objectContaining({
				price: '199.99',
				priceCurrency: 'BYN',
			}),
		)

		const secondItem = entries[1]?.item as Record<string, unknown>
		expect(secondItem.offers).toBeUndefined()
	})
})
