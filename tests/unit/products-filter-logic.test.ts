import { describe, it, expect } from 'vitest'

// Replicated filter-building logic from lib/trpc/routers/products-router.ts
// Tests the pure business logic (Prisma-agnostic) patterns.

const TRUE_VALUES = ['true', '1', 'yes', 'да']

// ── buildCategoryWhere ─────────────────────────────────────────
interface CategoryChild {
	id: string
}

function buildCategoryWhere(
	categoryId: string,
	includeChildren: boolean,
	children: CategoryChild[],
) {
	if (!includeChildren || children.length === 0) {
		return { categoryId }
	}
	return {
		OR: [
			{ categoryId },
			{ categoryId: { in: children.map(c => c.id) } },
		],
	}
}

// ── buildPriceFilter ───────────────────────────────────────────
function buildPriceFilter(
	minPrice: number | undefined,
	maxPrice: number | undefined,
): Record<string, number> | undefined {
	if (minPrice === undefined && maxPrice === undefined) return undefined
	const filter: Record<string, number> = {}
	if (minPrice !== undefined) filter.gte = minPrice
	if (maxPrice !== undefined) filter.lte = maxPrice
	return filter
}

// ── buildSortOrder ─────────────────────────────────────────────
type SortBy = 'price-asc' | 'price-desc' | 'name' | 'newest' | 'rating'

function buildSortOrder(sortBy: SortBy | undefined) {
	switch (sortBy) {
		case 'price-asc':
			return { price: 'asc' }
		case 'price-desc':
			return { price: 'desc' }
		case 'name':
			return { name: 'asc' }
		case 'newest':
			return { createdAt: 'desc' }
		case 'rating':
			return { rating: 'desc' }
		default:
			return { createdAt: 'desc' }
	}
}

// ── buildPropertyFilter ────────────────────────────────────────
function buildPropertyFilters(
	properties: Record<string, string | string[]> | undefined,
) {
	if (!properties) return []
	const andConditions: object[] = []

	for (const [slug, rawValue] of Object.entries(properties)) {
		const slugValues = (Array.isArray(rawValue) ? rawValue : [rawValue]).filter(
			v => v?.trim(),
		)
		if (slugValues.length > 0) {
			andConditions.push({
				properties: {
					some: {
						property: { slug },
						propertyValue: { slug: { in: slugValues } },
					},
				},
			})
		}
	}

	return andConditions
}

// ────────────────────────────────────────────────────────────────
// TRUE_VALUES
// ────────────────────────────────────────────────────────────────
describe('TRUE_VALUES constant', () => {
	it('contains english truthy words', () => {
		expect(TRUE_VALUES).toContain('true')
		expect(TRUE_VALUES).toContain('1')
		expect(TRUE_VALUES).toContain('yes')
	})

	it('contains Russian truthy word', () => {
		expect(TRUE_VALUES).toContain('да')
	})

	it('has exactly 4 values', () => {
		expect(TRUE_VALUES).toHaveLength(4)
	})
})

// ────────────────────────────────────────────────────────────────
// buildCategoryWhere
// ────────────────────────────────────────────────────────────────
describe('buildCategoryWhere', () => {
	it('returns simple categoryId filter when includeChildren=false', () => {
		const result = buildCategoryWhere('cat-1', false, [{ id: 'child-1' }])
		expect(result).toEqual({ categoryId: 'cat-1' })
	})

	it('returns simple categoryId filter when children array is empty', () => {
		const result = buildCategoryWhere('cat-1', true, [])
		expect(result).toEqual({ categoryId: 'cat-1' })
	})

	it('returns OR filter when includeChildren=true with children', () => {
		const result = buildCategoryWhere('cat-1', true, [
			{ id: 'child-1' },
			{ id: 'child-2' },
		])
		expect(result).toEqual({
			OR: [
				{ categoryId: 'cat-1' },
				{ categoryId: { in: ['child-1', 'child-2'] } },
			],
		})
	})

	it('includes all child ids in the IN clause', () => {
		const children = [
			{ id: 'a' },
			{ id: 'b' },
			{ id: 'c' },
		]
		const result = buildCategoryWhere('parent', true, children) as {
			OR: Array<{ categoryId: string | { in: string[] } }>
		}
		const inClause = result.OR[1].categoryId as { in: string[] }
		expect(inClause.in).toEqual(['a', 'b', 'c'])
	})
})

// ────────────────────────────────────────────────────────────────
// buildPriceFilter
// ────────────────────────────────────────────────────────────────
describe('buildPriceFilter', () => {
	it('returns undefined when both prices are undefined', () => {
		expect(buildPriceFilter(undefined, undefined)).toBeUndefined()
	})

	it('returns gte-only filter when only minPrice provided', () => {
		expect(buildPriceFilter(100, undefined)).toEqual({ gte: 100 })
	})

	it('returns lte-only filter when only maxPrice provided', () => {
		expect(buildPriceFilter(undefined, 500)).toEqual({ lte: 500 })
	})

	it('returns both gte and lte when both prices provided', () => {
		expect(buildPriceFilter(100, 500)).toEqual({ gte: 100, lte: 500 })
	})

	it('handles zero as valid minPrice', () => {
		expect(buildPriceFilter(0, undefined)).toEqual({ gte: 0 })
	})
})

// ────────────────────────────────────────────────────────────────
// buildSortOrder
// ────────────────────────────────────────────────────────────────
describe('buildSortOrder', () => {
	it('sorts by price asc', () => {
		expect(buildSortOrder('price-asc')).toEqual({ price: 'asc' })
	})

	it('sorts by price desc', () => {
		expect(buildSortOrder('price-desc')).toEqual({ price: 'desc' })
	})

	it('sorts by name asc', () => {
		expect(buildSortOrder('name')).toEqual({ name: 'asc' })
	})

	it('sorts by newest (createdAt desc)', () => {
		expect(buildSortOrder('newest')).toEqual({ createdAt: 'desc' })
	})

	it('sorts by rating desc', () => {
		expect(buildSortOrder('rating')).toEqual({ rating: 'desc' })
	})

	it('defaults to createdAt desc for undefined sortBy', () => {
		expect(buildSortOrder(undefined)).toEqual({ createdAt: 'desc' })
	})
})

// ────────────────────────────────────────────────────────────────
// buildPropertyFilters
// ────────────────────────────────────────────────────────────────
describe('buildPropertyFilters', () => {
	it('returns empty array for undefined properties', () => {
		expect(buildPropertyFilters(undefined)).toEqual([])
	})

	it('returns empty array for empty properties object', () => {
		expect(buildPropertyFilters({})).toEqual([])
	})

	it('builds a single property filter', () => {
		const result = buildPropertyFilters({ color: 'red' })
		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({
			properties: {
				some: {
					property: { slug: 'color' },
					propertyValue: { slug: { in: ['red'] } },
				},
			},
		})
	})

	it('builds filter with multiple values for single property', () => {
		const result = buildPropertyFilters({ color: ['red', 'blue'] })
		expect(result).toHaveLength(1)
		const filter = result[0] as {
			properties: { some: { propertyValue: { slug: { in: string[] } } } }
		}
		expect(filter.properties.some.propertyValue.slug.in).toEqual(['red', 'blue'])
	})

	it('builds filters for multiple properties', () => {
		const result = buildPropertyFilters({ color: 'red', size: 'large' })
		expect(result).toHaveLength(2)
	})

	it('skips empty string values', () => {
		const result = buildPropertyFilters({ color: '' })
		expect(result).toEqual([])
	})

	it('skips whitespace-only values', () => {
		const result = buildPropertyFilters({ color: '   ' })
		expect(result).toEqual([])
	})

	it('filters empty strings from array values', () => {
		const result = buildPropertyFilters({ color: ['red', '', 'blue'] })
		expect(result).toHaveLength(1)
		const filter = result[0] as {
			properties: { some: { propertyValue: { slug: { in: string[] } } } }
		}
		expect(filter.properties.some.propertyValue.slug.in).toEqual(['red', 'blue'])
	})
})
