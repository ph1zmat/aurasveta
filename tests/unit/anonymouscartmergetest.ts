import { describe, it, expect } from 'vitest'

// Replicated cart merge logic from lib/trpc/routers/anonymous.ts (migrateToUser)
// Tests pure business logic for anonymous-to-user migration.

interface CartItem {
	productId: string
	quantity: number
}

/**
 * Merge anonymous cart items into user cart items.
 * Anonymous items take precedence by being added on top.
 * If the same product appears in both, quantities are summed.
 */
function mergeAnonymousCart(
	userItems: CartItem[],
	anonymousItems: CartItem[],
): CartItem[] {
	const merged = new Map<string, number>(
		userItems.map(item => [item.productId, item.quantity]),
	)

	for (const item of anonymousItems) {
		const existing = merged.get(item.productId) ?? 0
		merged.set(item.productId, existing + item.quantity)
	}

	return Array.from(merged.entries()).map(([productId, quantity]) => ({
		productId,
		quantity,
	}))
}

/**
 * Deduplicate favorites (skip if already in user's list).
 */
function mergeAnonymousFavorites(
	userFavorites: string[],
	anonymousFavorites: string[],
): string[] {
	const set = new Set(userFavorites)
	for (const productId of anonymousFavorites) {
		set.add(productId)
	}
	return Array.from(set)
}

/**
 * Deduplicate compare list (skip if already in user's list).
 */
function mergeAnonymousCompare(
	userCompare: string[],
	anonymousCompare: string[],
): string[] {
	return mergeAnonymousFavorites(userCompare, anonymousCompare)
}

// ────────────────────────────────────────────────────────────────
// mergeAnonymousCart
// ────────────────────────────────────────────────────────────────
describe('mergeAnonymousCart', () => {
	it('returns anonymous items when user cart is empty', () => {
		const result = mergeAnonymousCart([], [{ productId: 'p1', quantity: 2 }])
		expect(result).toEqual([{ productId: 'p1', quantity: 2 }])
	})

	it('returns user items when anonymous cart is empty', () => {
		const result = mergeAnonymousCart([{ productId: 'p1', quantity: 3 }], [])
		expect(result).toEqual([{ productId: 'p1', quantity: 3 }])
	})

	it('returns empty array when both carts are empty', () => {
		expect(mergeAnonymousCart([], [])).toEqual([])
	})

	it('sums quantities for the same product', () => {
		const result = mergeAnonymousCart(
			[{ productId: 'p1', quantity: 2 }],
			[{ productId: 'p1', quantity: 3 }],
		)
		const item = result.find(i => i.productId === 'p1')
		expect(item?.quantity).toBe(5)
	})

	it('combines distinct products from both carts', () => {
		const result = mergeAnonymousCart(
			[{ productId: 'p1', quantity: 1 }],
			[{ productId: 'p2', quantity: 2 }],
		)
		expect(result).toHaveLength(2)
	})

	it('handles multiple overlapping products', () => {
		const userCart: CartItem[] = [
			{ productId: 'p1', quantity: 1 },
			{ productId: 'p2', quantity: 2 },
		]
		const anonymousCart: CartItem[] = [
			{ productId: 'p2', quantity: 1 },
			{ productId: 'p3', quantity: 3 },
		]
		const result = mergeAnonymousCart(userCart, anonymousCart)
		expect(result).toHaveLength(3)
		const p2 = result.find(i => i.productId === 'p2')
		expect(p2?.quantity).toBe(3) // 2 + 1
	})

	it('does not mutate input arrays', () => {
		const userCart: CartItem[] = [{ productId: 'p1', quantity: 1 }]
		const anonCart: CartItem[] = [{ productId: 'p2', quantity: 1 }]
		mergeAnonymousCart(userCart, anonCart)
		expect(userCart).toHaveLength(1)
		expect(anonCart).toHaveLength(1)
	})

	it('preserves user-only items when anonymous adds new ones', () => {
		const result = mergeAnonymousCart(
			[
				{ productId: 'p1', quantity: 5 },
				{ productId: 'p2', quantity: 2 },
			],
			[{ productId: 'p3', quantity: 1 }],
		)
		expect(result).toHaveLength(3)
		const p1 = result.find(i => i.productId === 'p1')
		expect(p1?.quantity).toBe(5) // unchanged
	})
})

// ────────────────────────────────────────────────────────────────
// mergeAnonymousFavorites
// ────────────────────────────────────────────────────────────────
describe('mergeAnonymousFavorites', () => {
	it('returns all favorites when no overlap', () => {
		const result = mergeAnonymousFavorites(['p1', 'p2'], ['p3', 'p4'])
		expect(result).toHaveLength(4)
	})

	it('deduplicates overlapping favorites', () => {
		const result = mergeAnonymousFavorites(['p1', 'p2'], ['p2', 'p3'])
		expect(result).toHaveLength(3)
		expect(result.includes('p2')).toBe(true)
	})

	it('returns anonymous favorites when user list is empty', () => {
		const result = mergeAnonymousFavorites([], ['p1', 'p2'])
		expect(result).toHaveLength(2)
	})

	it('returns user favorites when anonymous list is empty', () => {
		const result = mergeAnonymousFavorites(['p1', 'p2'], [])
		expect(result).toHaveLength(2)
	})

	it('returns empty array when both empty', () => {
		expect(mergeAnonymousFavorites([], [])).toHaveLength(0)
	})

	it('handles all duplicates (all items already in user list)', () => {
		const result = mergeAnonymousFavorites(['p1', 'p2'], ['p1', 'p2'])
		expect(result).toHaveLength(2)
	})
})

// ────────────────────────────────────────────────────────────────
// mergeAnonymousCompare (same logic as favorites)
// ────────────────────────────────────────────────────────────────
describe('mergeAnonymousCompare', () => {
	it('deduplicates overlapping compare items', () => {
		const result = mergeAnonymousCompare(['p1'], ['p1', 'p2'])
		expect(result).toHaveLength(2)
	})

	it('adds new compare items', () => {
		const result = mergeAnonymousCompare([], ['p1', 'p2'])
		expect(result).toHaveLength(2)
	})

	it('preserves existing compare items', () => {
		const result = mergeAnonymousCompare(['p3'], [])
		expect(result).toContain('p3')
	})
})
