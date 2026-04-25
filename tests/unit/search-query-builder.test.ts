import { describe, it, expect } from 'vitest'

// Replicated parameterized query-building logic from lib/trpc/routers/search.ts
// Tests pure filter clause assembly without DB or Prisma deps.

type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'newest'

interface SearchFilters {
	minPrice?: number
	maxPrice?: number
	inStock?: boolean
}

function buildSearchQuery(
	query: string,
	categorySlug: string | undefined,
	filters: SearchFilters | undefined,
	sortBy: SortBy,
	limit: number,
	offset: number,
): { filterClause: string; params: unknown[]; orderClause: string } {
	let orderClause: string
	switch (sortBy) {
		case 'price_asc':
			orderClause = `p."price" ASC NULLS LAST`
			break
		case 'price_desc':
			orderClause = `p."price" DESC NULLS LAST`
			break
		case 'newest':
			orderClause = `p."created_at" DESC`
			break
		default:
			orderClause = `rank DESC`
	}

	const params: unknown[] = [query] // $1 = query
	let paramIndex = 2
	let filterClause = ''

	if (categorySlug) {
		filterClause += ` AND c."slug" = $${paramIndex}`
		params.push(categorySlug)
		paramIndex++
	}
	if (filters?.minPrice !== undefined) {
		filterClause += ` AND p."price" >= $${paramIndex}`
		params.push(filters.minPrice)
		paramIndex++
	}
	if (filters?.maxPrice !== undefined) {
		filterClause += ` AND p."price" <= $${paramIndex}`
		params.push(filters.maxPrice)
		paramIndex++
	}
	if (filters?.inStock === true) {
		filterClause += ` AND p."stock" > 0`
	}

	params.push(limit + 1) // limit param
	paramIndex++
	params.push(offset) // offset param

	return { filterClause, params, orderClause }
}

// ────────────────────────────────────────────────────────────────
// ORDER BY clause
// ────────────────────────────────────────────────────────────────
describe('buildSearchQuery – ORDER BY', () => {
	it('defaults to rank DESC for "relevance"', () => {
		const { orderClause } = buildSearchQuery('test', undefined, undefined, 'relevance', 12, 0)
		expect(orderClause).toBe('rank DESC')
	})

	it('returns price ASC for "price_asc"', () => {
		const { orderClause } = buildSearchQuery('test', undefined, undefined, 'price_asc', 12, 0)
		expect(orderClause).toBe('p."price" ASC NULLS LAST')
	})

	it('returns price DESC for "price_desc"', () => {
		const { orderClause } = buildSearchQuery('test', undefined, undefined, 'price_desc', 12, 0)
		expect(orderClause).toBe('p."price" DESC NULLS LAST')
	})

	it('returns created_at DESC for "newest"', () => {
		const { orderClause } = buildSearchQuery('test', undefined, undefined, 'newest', 12, 0)
		expect(orderClause).toBe('p."created_at" DESC')
	})
})

// ────────────────────────────────────────────────────────────────
// Category filter
// ────────────────────────────────────────────────────────────────
describe('buildSearchQuery – category filter', () => {
	it('adds category clause when categorySlug provided', () => {
		const { filterClause, params } = buildSearchQuery(
			'lamp',
			'ceiling',
			undefined,
			'relevance',
			12,
			0,
		)
		expect(filterClause).toContain(`c."slug" = $2`)
		expect(params[1]).toBe('ceiling')
	})

	it('does not add category clause when categorySlug is undefined', () => {
		const { filterClause } = buildSearchQuery('lamp', undefined, undefined, 'relevance', 12, 0)
		expect(filterClause).not.toContain('slug')
	})
})

// ────────────────────────────────────────────────────────────────
// Price filters
// ────────────────────────────────────────────────────────────────
describe('buildSearchQuery – price filters', () => {
	it('adds minPrice clause at $2 when no category', () => {
		const { filterClause, params } = buildSearchQuery(
			'lamp',
			undefined,
			{ minPrice: 100 },
			'relevance',
			12,
			0,
		)
		expect(filterClause).toContain(`p."price" >= $2`)
		expect(params[1]).toBe(100)
	})

	it('adds maxPrice clause after minPrice', () => {
		const { filterClause, params } = buildSearchQuery(
			'lamp',
			undefined,
			{ minPrice: 100, maxPrice: 500 },
			'relevance',
			12,
			0,
		)
		expect(filterClause).toContain(`p."price" >= $2`)
		expect(filterClause).toContain(`p."price" <= $3`)
		expect(params[1]).toBe(100)
		expect(params[2]).toBe(500)
	})

	it('adds maxPrice at $2 when no category and no minPrice', () => {
		const { filterClause, params } = buildSearchQuery(
			'lamp',
			undefined,
			{ maxPrice: 500 },
			'relevance',
			12,
			0,
		)
		expect(filterClause).toContain(`p."price" <= $2`)
		expect(params[1]).toBe(500)
	})

	it('shifts param indices when category precedes price', () => {
		const { filterClause, params } = buildSearchQuery(
			'lamp',
			'ceiling',
			{ minPrice: 100 },
			'relevance',
			12,
			0,
		)
		// $2 = category, $3 = minPrice
		expect(filterClause).toContain(`c."slug" = $2`)
		expect(filterClause).toContain(`p."price" >= $3`)
		expect(params[1]).toBe('ceiling')
		expect(params[2]).toBe(100)
	})
})

// ────────────────────────────────────────────────────────────────
// inStock filter
// ────────────────────────────────────────────────────────────────
describe('buildSearchQuery – inStock filter', () => {
	it('adds stock > 0 clause when inStock=true', () => {
		const { filterClause } = buildSearchQuery(
			'lamp',
			undefined,
			{ inStock: true },
			'relevance',
			12,
			0,
		)
		expect(filterClause).toContain(`p."stock" > 0`)
	})

	it('does not add stock clause when inStock=false', () => {
		const { filterClause } = buildSearchQuery(
			'lamp',
			undefined,
			{ inStock: false },
			'relevance',
			12,
			0,
		)
		expect(filterClause).not.toContain('stock')
	})

	it('does not affect param indices (stock uses literal, not param)', () => {
		const { params } = buildSearchQuery(
			'lamp',
			undefined,
			{ inStock: true },
			'relevance',
			10,
			0,
		)
		// params: [query, limit+1, offset]
		expect(params).toHaveLength(3)
		expect(params[1]).toBe(11) // limit+1
		expect(params[2]).toBe(0)  // offset
	})
})

// ────────────────────────────────────────────────────────────────
// Params array correctness
// ────────────────────────────────────────────────────────────────
describe('buildSearchQuery – params array', () => {
	it('always has query as first param', () => {
		const { params } = buildSearchQuery('test', undefined, undefined, 'relevance', 12, 0)
		expect(params[0]).toBe('test')
	})

	it('appends limit+1 and offset at the end', () => {
		const { params } = buildSearchQuery('test', undefined, undefined, 'relevance', 12, 24)
		expect(params[params.length - 2]).toBe(13) // limit+1
		expect(params[params.length - 1]).toBe(24) // offset
	})

	it('no extra params when no filters', () => {
		const { params } = buildSearchQuery('test', undefined, undefined, 'relevance', 12, 0)
		// [query, limit+1, offset]
		expect(params).toHaveLength(3)
	})

	it('correct param count with all filters', () => {
		const { params } = buildSearchQuery(
			'test',
			'category-slug',
			{ minPrice: 100, maxPrice: 500 },
			'relevance',
			12,
			0,
		)
		// [query, categorySlug, minPrice, maxPrice, limit+1, offset]
		expect(params).toHaveLength(6)
	})
})
