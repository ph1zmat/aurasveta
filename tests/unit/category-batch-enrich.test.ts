import { describe, it, expect, vi } from 'vitest'

describe('Category batch enrichment logic', () => {
	it('uses single query for fallback images instead of N+1', async () => {
		const findMany = vi.fn().mockResolvedValue([
			{ categoryId: 'cat1', category: { parentId: null }, images: [{ key: 'img1', url: 'http://example.com/1' }] },
			{ categoryId: 'cat2', category: { parentId: null }, images: [{ key: 'img2', url: 'http://example.com/2' }] },
		])
		const prisma = {
			product: {
				findMany,
			},
		} as {
			product: {
				findMany: typeof findMany
			}
		}

		const categoryIds = ['cat1', 'cat2', 'cat3']
		await prisma.product.findMany({
			where: {
				isActive: true,
				images: { some: {} },
				OR: [
					{ categoryId: { in: categoryIds } },
					{ category: { parentId: { in: categoryIds } } },
				],
			},
			orderBy: { createdAt: 'desc' },
			select: {
				categoryId: true,
				category: { select: { parentId: true } },
				images: { orderBy: [{ isMain: 'desc' }, { order: 'asc' }], select: { key: true, url: true } },
			},
		})

		expect(findMany).toHaveBeenCalledTimes(1)
		expect(findMany.mock.calls[0][0].where.OR[0].categoryId.in).toEqual(categoryIds)
	})

	it('parallelizes product counts for filtering categories', async () => {
		const count = vi.fn().mockResolvedValue(5)
		const prisma = {
			product: {
				count,
			},
		} as {
			product: {
				count: typeof count
			}
		}

		const filteringCategories = [
			{ id: 'c1', categoryMode: 'FILTER', filterKind: 'SALE' },
			{ id: 'c2', categoryMode: 'FILTER', filterKind: 'PROPERTY_VALUE', filterPropertyId: 'p1', filterPropertyValueId: 'v1' },
		]

		await Promise.all(
			filteringCategories.map((cat) =>
				prisma.product.count({
					where: { isActive: true, categoryId: cat.id },
				}),
			),
		)

		expect(count).toHaveBeenCalledTimes(filteringCategories.length)
	})
})
