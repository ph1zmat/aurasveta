import { describe, it, expect } from 'vitest'

// Test cart business logic (merge, add, remove) without Prisma dependency
interface CartItem {
	productId: string
	quantity: number
}

function addToCart(
	items: CartItem[],
	productId: string,
	quantity: number,
): CartItem[] {
	const result = [...items]
	const idx = result.findIndex(i => i.productId === productId)
	if (idx >= 0) {
		result[idx] = { ...result[idx], quantity: result[idx].quantity + quantity }
	} else {
		result.push({ productId, quantity })
	}
	return result
}

function removeFromCart(items: CartItem[], productId: string): CartItem[] {
	return items.filter(i => i.productId !== productId)
}

function mergeCarts(existing: CartItem[], incoming: CartItem[]): CartItem[] {
	const result = [...existing]
	for (const item of incoming) {
		const idx = result.findIndex(i => i.productId === item.productId)
		if (idx >= 0) {
			result[idx] = {
				...result[idx],
				quantity: result[idx].quantity + item.quantity,
			}
		} else {
			result.push(item)
		}
	}
	return result
}

describe('cart.add – add item to cart', () => {
	it('adds new item to empty cart', () => {
		const result = addToCart([], 'p1', 1)
		expect(result).toEqual([{ productId: 'p1', quantity: 1 }])
	})

	it('increments quantity for existing item', () => {
		const cart = [{ productId: 'p1', quantity: 2 }]
		const result = addToCart(cart, 'p1', 3)
		expect(result).toEqual([{ productId: 'p1', quantity: 5 }])
	})

	it('adds different product alongside existing', () => {
		const cart = [{ productId: 'p1', quantity: 1 }]
		const result = addToCart(cart, 'p2', 2)
		expect(result).toHaveLength(2)
		expect(result[1]).toEqual({ productId: 'p2', quantity: 2 })
	})

	it('does not mutate original array', () => {
		const cart = [{ productId: 'p1', quantity: 1 }]
		addToCart(cart, 'p1', 1)
		expect(cart[0].quantity).toBe(1)
	})
})

describe('cart.remove – remove item from cart', () => {
	it('removes existing item', () => {
		const cart = [
			{ productId: 'p1', quantity: 1 },
			{ productId: 'p2', quantity: 2 },
		]
		const result = removeFromCart(cart, 'p1')
		expect(result).toEqual([{ productId: 'p2', quantity: 2 }])
	})

	it('returns same array when product not found', () => {
		const cart = [{ productId: 'p1', quantity: 1 }]
		const result = removeFromCart(cart, 'p99')
		expect(result).toEqual(cart)
	})

	it('returns empty array when removing last item', () => {
		const cart = [{ productId: 'p1', quantity: 1 }]
		const result = removeFromCart(cart, 'p1')
		expect(result).toEqual([])
	})
})

describe('cart merge – anonymous → authenticated sync', () => {
	it('merges empty anon cart into existing', () => {
		const existing = [{ productId: 'p1', quantity: 1 }]
		const result = mergeCarts(existing, [])
		expect(result).toEqual(existing)
	})

	it('merges anon cart into empty authenticated cart', () => {
		const anon = [{ productId: 'p1', quantity: 2 }]
		const result = mergeCarts([], anon)
		expect(result).toEqual(anon)
	})

	it('sums quantities for overlapping products', () => {
		const existing = [{ productId: 'p1', quantity: 2 }]
		const anon = [{ productId: 'p1', quantity: 3 }]
		const result = mergeCarts(existing, anon)
		expect(result).toEqual([{ productId: 'p1', quantity: 5 }])
	})

	it('adds non-overlapping products from anon cart', () => {
		const existing = [{ productId: 'p1', quantity: 1 }]
		const anon = [{ productId: 'p2', quantity: 2 }]
		const result = mergeCarts(existing, anon)
		expect(result).toHaveLength(2)
	})

	it('handles mixed overlap and new products', () => {
		const existing = [
			{ productId: 'p1', quantity: 1 },
			{ productId: 'p3', quantity: 1 },
		]
		const anon = [
			{ productId: 'p1', quantity: 2 },
			{ productId: 'p2', quantity: 1 },
		]
		const result = mergeCarts(existing, anon)
		expect(result).toHaveLength(3)
		expect(result.find(i => i.productId === 'p1')?.quantity).toBe(3)
		expect(result.find(i => i.productId === 'p2')?.quantity).toBe(1)
		expect(result.find(i => i.productId === 'p3')?.quantity).toBe(1)
	})
})
