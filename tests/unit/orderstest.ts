import { describe, it, expect } from 'vitest'
import { calculateDeliveryCost } from '@/shared/lib/delivery'

// We test the router logic by directly testing the business logic patterns
// since tRPC routers depend on Prisma + auth context.

describe('orders.create – business logic validation', () => {
	// Simulate the stock validation & total calculation logic from orders router
	function validateAndCalculateOrder(
		items: Array<{ productId: string; quantity: number }>,
		products: Array<{ id: string; price: number; stock: number; name: string }>,
		city = 'Мозырь',
		address = 'г. Мозырь, ул. Интернациональная, 5',
	) {
		const productMap = new Map(products.map(p => [p.id, p]))

		for (const item of items) {
			const product = productMap.get(item.productId)
			if (!product) {
				throw new Error(`Товар не найден: ${item.productId}`)
			}
			if (product.stock < item.quantity) {
				throw new Error(
					`Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock}`,
				)
			}
		}

		const productsTotal = items.reduce(
			(sum, item) =>
				sum + (productMap.get(item.productId)?.price ?? 0) * item.quantity,
			0,
		)
		const delivery = calculateDeliveryCost({
			subtotal: productsTotal,
			city,
			address,
		})
		const total = productsTotal + delivery.cost

		const updatedStock = new Map<string, number>()
		for (const item of items) {
			const product = productMap.get(item.productId)!
			const current = updatedStock.get(item.productId) ?? product.stock
			updatedStock.set(item.productId, current - item.quantity)
		}

		return { total, updatedStock }
	}

	it('calculates total correctly from product prices', () => {
		const items = [
			{ productId: 'p1', quantity: 2 },
			{ productId: 'p2', quantity: 1 },
		]
		const products = [
			{ id: 'p1', price: 1500, stock: 10, name: 'Люстра' },
			{ id: 'p2', price: 800, stock: 5, name: 'Бра' },
		]

		const result = validateAndCalculateOrder(items, products)
		expect(result.total).toBe(3800) // 1500*2 + 800*1
	})

	it('adds 100 BYN delivery for Belarus orders below 400 BYN', () => {
		const items = [{ productId: 'p1', quantity: 1 }]
		const products = [{ id: 'p1', price: 250, stock: 3, name: 'Люстра' }]

		const result = validateAndCalculateOrder(
			items,
			products,
			'Гомель',
			'г. Гомель, ул. Советская, 10',
		)

		expect(result.total).toBe(350)
	})

	it('keeps Belarus delivery free from 400 BYN', () => {
		const items = [{ productId: 'p1', quantity: 2 }]
		const products = [{ id: 'p1', price: 250, stock: 3, name: 'Люстра' }]

		const result = validateAndCalculateOrder(
			items,
			products,
			'Минск',
			'г. Минск, пр. Победителей, 1',
		)

		expect(result.total).toBe(500)
	})

	it('decrements stock correctly', () => {
		const items = [
			{ productId: 'p1', quantity: 3 },
			{ productId: 'p2', quantity: 2 },
		]
		const products = [
			{ id: 'p1', price: 1000, stock: 10, name: 'Люстра' },
			{ id: 'p2', price: 500, stock: 5, name: 'Бра' },
		]

		const result = validateAndCalculateOrder(items, products)
		expect(result.updatedStock.get('p1')).toBe(7)
		expect(result.updatedStock.get('p2')).toBe(3)
	})

	it('throws when product not found', () => {
		const items = [{ productId: 'unknown', quantity: 1 }]
		const products: Array<{
			id: string
			price: number
			stock: number
			name: string
		}> = []

		expect(() => validateAndCalculateOrder(items, products)).toThrow(
			'Товар не найден',
		)
	})

	it('throws when insufficient stock', () => {
		const items = [{ productId: 'p1', quantity: 5 }]
		const products = [{ id: 'p1', price: 1000, stock: 3, name: 'Люстра' }]

		expect(() => validateAndCalculateOrder(items, products)).toThrow(
			'Недостаточно товара',
		)
	})

	it('handles zero-price products', () => {
		const items = [{ productId: 'p1', quantity: 1 }]
		const products = [{ id: 'p1', price: 0, stock: 10, name: 'Бесплатный' }]

		const result = validateAndCalculateOrder(items, products)
		expect(result.total).toBe(0)
	})

	it('handles single item order', () => {
		const items = [{ productId: 'p1', quantity: 1 }]
		const products = [{ id: 'p1', price: 2500, stock: 1, name: 'Торшер' }]

		const result = validateAndCalculateOrder(items, products)
		expect(result.total).toBe(2500)
		expect(result.updatedStock.get('p1')).toBe(0)
	})

	it('fails when stock equals zero', () => {
		const items = [{ productId: 'p1', quantity: 1 }]
		const products = [{ id: 'p1', price: 1000, stock: 0, name: 'Люстра' }]

		expect(() => validateAndCalculateOrder(items, products)).toThrow(
			'Недостаточно товара',
		)
	})

	it('handles multiple items of same product', () => {
		const items = [{ productId: 'p1', quantity: 10 }]
		const products = [{ id: 'p1', price: 100, stock: 10, name: 'Лампочка' }]

		const result = validateAndCalculateOrder(items, products)
		expect(result.total).toBe(1000)
		expect(result.updatedStock.get('p1')).toBe(0)
	})
})
