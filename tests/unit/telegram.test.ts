import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatOrderMessage } from '@/lib/telegram/telegramservice'
import type { TelegramOrderWithItems } from '@/lib/telegram/telegramservice'

describe('Telegram Integration Unit Tests', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	const mockOrder: TelegramOrderWithItems = {
		id: 'clorder1234567890abcdef',
		userId: 'user123',
		status: 'PENDING',
		contactMethod: 'PHONE',
		total: 150.5,
		address: 'Минск, ул. Сурганова 15, кв. 42',
		phone: '+375291112233',
		comment: 'Доставить вечером',
		createdAt: new Date('2026-05-22T10:00:00.000Z'),
		updatedAt: new Date('2026-05-22T10:00:00.000Z'),
		user: {
			name: 'Иван Иванов',
			email: 'ivan@example.com',
		},
		items: [
			{
				id: 'item1',
				orderId: 'clorder1234567890abcdef',
				productId: 'prod1',
				quantity: 2,
				price: 75.25,
				createdAt: new Date('2026-05-22T10:00:00.000Z'),
				product: {
					id: 'prod1',
					name: 'Люстра Аура Света Сканди',
					slug: 'lyustra-aura-sveta-skandi',
					category: {
						id: 'cat1',
						name: 'Люстры',
						slug: 'lyustry',
					},
				},
			},
		],
	}

	it('should correctly format order details to Telegram HTML structure', () => {
		const message = formatOrderMessage(mockOrder)

		expect(message).toContain('Новый заказ #ABCDEF')
		expect(message).toContain('Клиент:</b> Иван Иванов (ivan@example.com)')
		expect(message).toContain('Итого к оплате:</b> <b>150.5</b> Br')
		expect(message).toContain('Люстра Аура Света Сканди')
		expect(message).toContain('2 шт. x 75.25 Br')
		expect(message).toContain('Адрес доставки:</b> Минск, ул. Сурганова 15, кв. 42')
		expect(message).toContain('Комментарий:</b> Доставить вечером')
	})

	it('should escape special HTML characters in product names and fields', () => {
		const dangerousOrder: TelegramOrderWithItems = {
			...mockOrder,
			phone: '<script>alert("hack")</script>',
			user: {
				name: 'Critical & Dangerous <Client>',
				email: 'hacker@html.com',
			},
			items: [
				{
					...mockOrder.items[0],
					product: {
						...mockOrder.items[0].product,
						name: 'Люстра "Стиль" <Винтаж> & Ретро',
					},
				},
			],
		}

		const message = formatOrderMessage(dangerousOrder)

		// Проверяем экранирование спецсимволов HTML
		expect(message).not.toContain('<script>')
		expect(message).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;')
		expect(message).toContain('Critical &amp; Dangerous &lt;Client&gt;')
		expect(message).toContain('Люстра &quot;Стиль&quot; &lt;Винтаж&gt; &amp; Ретро')
	})
})
