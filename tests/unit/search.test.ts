import { describe, it, expect } from 'vitest'

// Test search query building logic and parameter handling
// The actual search uses PostgreSQL full-text with websearch_to_tsquery('russian', $1)

interface SearchFilters {
	minPrice?: number
	maxPrice?: number
	inStock?: boolean
}

interface SearchInput {
	query: string
	categorySlug?: string
	limit: number
	cursor?: number
	sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest'
	filters?: SearchFilters
}

function buildSearchQuery(input: SearchInput) {
	const { query, categorySlug, limit, cursor, sortBy, filters } = input
	const offset = cursor ?? 0

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

	const params: unknown[] = [query]
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

	const limitParam = paramIndex
	params.push(limit + 1)
	paramIndex++
	const offsetParam = paramIndex
	params.push(offset)

	return { params, filterClause, orderClause, limitParam, offsetParam }
}

describe('search – query building', () => {
	it('builds basic query with just search term', () => {
		const result = buildSearchQuery({
			query: 'люстра',
			limit: 12,
			sortBy: 'relevance',
		})

		expect(result.params[0]).toBe('люстра')
		expect(result.filterClause).toBe('')
		expect(result.orderClause).toBe('rank DESC')
		expect(result.params).toHaveLength(3) // query, limit+1, offset
		expect(result.params[1]).toBe(13) // limit + 1 for hasMore check
		expect(result.params[2]).toBe(0) // default offset
	})

	it('adds category filter with parameterized index', () => {
		const result = buildSearchQuery({
			query: 'бра',
			categorySlug: 'nastennye-svetilniki',
			limit: 12,
			sortBy: 'relevance',
		})

		expect(result.filterClause).toContain('$2')
		expect(result.params[1]).toBe('nastennye-svetilniki')
		expect(result.params).toHaveLength(4)
	})

	it('adds price range filters', () => {
		const result = buildSearchQuery({
			query: 'торшер',
			limit: 12,
			sortBy: 'price_asc',
			filters: { minPrice: 1000, maxPrice: 5000 },
		})

		expect(result.filterClause).toContain('p."price" >=')
		expect(result.filterClause).toContain('p."price" <=')
		expect(result.params).toContain(1000)
		expect(result.params).toContain(5000)
		expect(result.orderClause).toBe('p."price" ASC NULLS LAST')
	})

	it('adds inStock filter without param', () => {
		const result = buildSearchQuery({
			query: 'лампа',
			limit: 12,
			sortBy: 'relevance',
			filters: { inStock: true },
		})

		expect(result.filterClause).toContain('p."stock" > 0')
		// inStock doesn't add a param
		expect(result.params).toHaveLength(3)
	})

	it('handles all filters combined', () => {
		const result = buildSearchQuery({
			query: 'светильник',
			categorySlug: 'potolochnye',
			limit: 24,
			cursor: 24,
			sortBy: 'price_desc',
			filters: { minPrice: 500, maxPrice: 10000, inStock: true },
		})

		expect(result.params[0]).toBe('светильник')
		expect(result.filterClause).toContain('c."slug"')
		expect(result.filterClause).toContain('p."price" >=')
		expect(result.filterClause).toContain('p."price" <=')
		expect(result.filterClause).toContain('p."stock" > 0')
		expect(result.orderClause).toBe('p."price" DESC NULLS LAST')
		// Last param should be offset=24
		expect(result.params[result.params.length - 1]).toBe(24)
	})

	it('sorts by newest correctly', () => {
		const result = buildSearchQuery({
			query: 'тест',
			limit: 12,
			sortBy: 'newest',
		})

		expect(result.orderClause).toBe('p."created_at" DESC')
	})

	it('handles Russian text in query', () => {
		const queries = [
			'Люстра хрустальная',
			'бра настенное',
			'LED подсветка',
			'настольная лампа',
		]

		for (const q of queries) {
			const result = buildSearchQuery({
				query: q,
				limit: 12,
				sortBy: 'relevance',
			})
			expect(result.params[0]).toBe(q)
		}
	})

	it('uses correct param indices with category + price filters', () => {
		const result = buildSearchQuery({
			query: 'test',
			categorySlug: 'cat',
			limit: 10,
			sortBy: 'relevance',
			filters: { minPrice: 100, maxPrice: 200 },
		})

		// $1=query, $2=categorySlug, $3=minPrice, $4=maxPrice, $5=limit+1, $6=offset
		expect(result.params).toEqual(['test', 'cat', 100, 200, 11, 0])
		expect(result.limitParam).toBe(5)
		expect(result.offsetParam).toBe(6)
	})
})

describe('search – result pagination', () => {
	function paginateResults<T>(items: T[], limit: number, offset: number) {
		const hasMore = items.length > limit
		const resultItems = hasMore ? items.slice(0, limit) : items
		return {
			items: resultItems,
			nextCursor: hasMore ? offset + limit : undefined,
		}
	}

	it('returns no nextCursor when fewer items than limit', () => {
		const items = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` }))
		const result = paginateResults(items, 12, 0)
		expect(result.nextCursor).toBeUndefined()
		expect(result.items).toHaveLength(5)
	})

	it('returns nextCursor when more items than limit', () => {
		const items = Array.from({ length: 13 }, (_, i) => ({ id: `p${i}` }))
		const result = paginateResults(items, 12, 0)
		expect(result.nextCursor).toBe(12)
		expect(result.items).toHaveLength(12)
	})

	it('calculates correct nextCursor on second page', () => {
		const items = Array.from({ length: 13 }, (_, i) => ({ id: `p${i}` }))
		const result = paginateResults(items, 12, 12)
		expect(result.nextCursor).toBe(24)
	})
})
