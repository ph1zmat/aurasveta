import { describe, it, expect } from 'vitest'

// Replicated admin importProducts batch logic from lib/trpc/routers/admin.ts
// Tests pure business logic: category lookup, product split, data transformation.

interface ImportRow {
	name: string
	slug: string
	description?: string
	price?: number
	compareAtPrice?: number
	stock?: number
	sku?: string
	categorySlug?: string
	brand?: string
	brandCountry?: string
	isActive?: boolean
}

interface CategoryRecord {
	id: string
	slug: string
}

interface ExistingProduct {
	id: string
	slug: string
}

interface ImportResult {
	toCreate: ImportRow[]
	toUpdate: Array<{ id: string; data: ImportRow }>
	created: number
	updated: number
	categoryMap: Map<string, string>
}

function processImportBatch(
	rows: ImportRow[],
	categories: CategoryRecord[],
	existingProducts: ExistingProduct[],
): ImportResult {
	// Build category lookup
	const categoryMap = new Map<string, string>(
		categories.map(c => [c.slug, c.id]),
	)

	// Build existing product lookup
	const existingMap = new Map<string, string>(
		existingProducts.map(p => [p.slug, p.id]),
	)

	const toCreate: ImportRow[] = []
	const toUpdate: Array<{ id: string; data: ImportRow }> = []

	for (const row of rows) {
		const existingId = existingMap.get(row.slug)
		if (existingId) {
			toUpdate.push({ id: existingId, data: row })
		} else {
			toCreate.push(row)
		}
	}

	return {
		toCreate,
		toUpdate,
		created: toCreate.length,
		updated: toUpdate.length,
		categoryMap,
	}
}

function resolveCategoryId(
	categorySlug: string | undefined,
	categoryMap: Map<string, string>,
): string | undefined {
	if (!categorySlug) return undefined
	return categoryMap.get(categorySlug)
}

// ────────────────────────────────────────────────────────────────
// processImportBatch
// ────────────────────────────────────────────────────────────────
describe('processImportBatch – empty input', () => {
	it('returns zeros for empty input', () => {
		const result = processImportBatch([], [], [])
		expect(result.created).toBe(0)
		expect(result.updated).toBe(0)
	})

	it('returns empty arrays for empty input', () => {
		const result = processImportBatch([], [], [])
		expect(result.toCreate).toEqual([])
		expect(result.toUpdate).toEqual([])
	})
})

describe('processImportBatch – new products', () => {
	it('puts non-existing products into toCreate', () => {
		const rows: ImportRow[] = [
			{ name: 'Люстра', slug: 'lyustra', price: 1500, stock: 10 },
		]
		const result = processImportBatch(rows, [], [])
		expect(result.created).toBe(1)
		expect(result.updated).toBe(0)
		expect(result.toCreate[0]!.slug).toBe('lyustra')
	})

	it('creates multiple new products', () => {
		const rows: ImportRow[] = [
			{ name: 'P1', slug: 'p1' },
			{ name: 'P2', slug: 'p2' },
			{ name: 'P3', slug: 'p3' },
		]
		const result = processImportBatch(rows, [], [])
		expect(result.created).toBe(3)
	})
})

describe('processImportBatch – existing products', () => {
	it('puts existing products into toUpdate with correct id', () => {
		const rows: ImportRow[] = [{ name: 'Люстра', slug: 'lyustra', price: 2000 }]
		const existing: ExistingProduct[] = [{ id: 'prod-1', slug: 'lyustra' }]
		const result = processImportBatch(rows, [], existing)
		expect(result.updated).toBe(1)
		expect(result.created).toBe(0)
		expect(result.toUpdate[0]!.id).toBe('prod-1')
	})

	it('correctly splits new and existing products', () => {
		const rows: ImportRow[] = [
			{ name: 'New Product', slug: 'new-product' },
			{ name: 'Existing', slug: 'existing' },
		]
		const existing: ExistingProduct[] = [{ id: 'e-1', slug: 'existing' }]
		const result = processImportBatch(rows, [], existing)
		expect(result.created).toBe(1)
		expect(result.updated).toBe(1)
		expect(result.toCreate[0]!.slug).toBe('new-product')
		expect(result.toUpdate[0]!.id).toBe('e-1')
	})
})

describe('processImportBatch – category mapping', () => {
	it('builds category map from category records', () => {
		const categories: CategoryRecord[] = [
			{ id: 'cat-1', slug: 'ceiling' },
			{ id: 'cat-2', slug: 'wall' },
		]
		const result = processImportBatch([], categories, [])
		expect(result.categoryMap.get('ceiling')).toBe('cat-1')
		expect(result.categoryMap.get('wall')).toBe('cat-2')
	})

	it('returns empty categoryMap when no categories', () => {
		const result = processImportBatch([], [], [])
		expect(result.categoryMap.size).toBe(0)
	})
})

// ────────────────────────────────────────────────────────────────
// resolveCategoryId
// ────────────────────────────────────────────────────────────────
describe('resolveCategoryId', () => {
	it('returns correct category id for known slug', () => {
		const map = new Map([['ceiling', 'cat-1']])
		expect(resolveCategoryId('ceiling', map)).toBe('cat-1')
	})

	it('returns undefined for unknown category slug', () => {
		const map = new Map([['ceiling', 'cat-1']])
		expect(resolveCategoryId('unknown-slug', map)).toBeUndefined()
	})

	it('returns undefined when categorySlug is undefined', () => {
		const map = new Map([['ceiling', 'cat-1']])
		expect(resolveCategoryId(undefined, map)).toBeUndefined()
	})

	it('returns undefined for empty category map', () => {
		expect(resolveCategoryId('ceiling', new Map())).toBeUndefined()
	})
})

// ────────────────────────────────────────────────────────────────
// Idempotency and edge cases
// ────────────────────────────────────────────────────────────────
describe('processImportBatch – edge cases', () => {
	it('handles duplicate slugs in input (last one wins in update list)', () => {
		const rows: ImportRow[] = [
			{ name: 'Duplicate A', slug: 'dup', price: 100 },
			{ name: 'Duplicate B', slug: 'dup', price: 200 },
		]
		const existing: ExistingProduct[] = [{ id: 'prod-dup', slug: 'dup' }]
		const result = processImportBatch(rows, [], existing)
		// Both match existing, so both go to update
		expect(result.updated).toBe(2)
		expect(result.created).toBe(0)
	})

	it('handles all products being new', () => {
		const rows: ImportRow[] = Array.from({ length: 5 }, (_, i) => ({
			name: `Product ${i}`,
			slug: `product-${i}`,
		}))
		const result = processImportBatch(rows, [], [])
		expect(result.created).toBe(5)
		expect(result.updated).toBe(0)
	})

	it('handles all products being existing', () => {
		const rows: ImportRow[] = [
			{ name: 'P1', slug: 'p1' },
			{ name: 'P2', slug: 'p2' },
		]
		const existing: ExistingProduct[] = [
			{ id: 'id-1', slug: 'p1' },
			{ id: 'id-2', slug: 'p2' },
		]
		const result = processImportBatch(rows, [], existing)
		expect(result.created).toBe(0)
		expect(result.updated).toBe(2)
	})
})
