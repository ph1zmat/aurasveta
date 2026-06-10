import { describe, expect, it } from 'vitest'
import {
	BELARUS_DELIVERY_RATE,
	BELARUS_FREE_DELIVERY_THRESHOLD,
	calculateDeliveryCost,
	getDeliveryExplanation,
	getDeliveryPreviewLabel,
	isMozyrDeliveryLocation,
	isMozyrDeliveryAddress,
} from '@/shared/lib/delivery'

describe('delivery rules', () => {
	it('detects Mozyr addresses in russian and latin', () => {
		expect(isMozyrDeliveryAddress('г. Мозырь, ул. Интернациональная, 5')).toBe(true)
		expect(isMozyrDeliveryAddress('Mozyr, Yunosti boulevard 127')).toBe(true)
		expect(isMozyrDeliveryAddress('г. Минск, ул. Немига, 1')).toBe(false)
		expect(isMozyrDeliveryLocation('Мозырь')).toBe(true)
	})

	it('keeps delivery free for Mozyr regardless of subtotal', () => {
		const quote = calculateDeliveryCost({
			subtotal: 50,
			address: 'г. Мозырь, ул. Притыцкого, 12',
		})

		expect(quote.zone).toBe('MOZYR')
		expect(quote.cost).toBe(0)
		expect(quote.isFree).toBe(true)
	})

	it('charges fixed delivery for Belarus below 400 BYN', () => {
		const quote = calculateDeliveryCost({
			subtotal: BELARUS_FREE_DELIVERY_THRESHOLD - 1,
			city: 'Минск',
			address: 'г. Минск, ул. Сурганова, 1',
		})

		expect(quote.zone).toBe('BELARUS')
		expect(quote.cost).toBe(BELARUS_DELIVERY_RATE)
		expect(quote.isFree).toBe(false)
	})

	it('keeps delivery free for Belarus from 400 BYN', () => {
		const quote = calculateDeliveryCost({
			subtotal: BELARUS_FREE_DELIVERY_THRESHOLD,
			city: 'Брест',
			address: 'г. Брест, ул. Советская, 20',
		})

		expect(quote.zone).toBe('BELARUS')
		expect(quote.cost).toBe(0)
		expect(quote.isFree).toBe(true)
	})

	it('uses city as main signal for delivery zone', () => {
		const quote = calculateDeliveryCost({
			subtotal: 200,
			city: 'Мозырь',
			address: 'ул. Советская, 10',
		})

		expect(quote.zone).toBe('MOZYR')
		expect(quote.cost).toBe(0)
	})

	it('builds preview and explanation texts', () => {
		expect(getDeliveryPreviewLabel(300)).toContain('100 BYN')
		expect(getDeliveryPreviewLabel(450)).toContain('бесплатно')

		const quote = calculateDeliveryCost({
			subtotal: 300,
			city: 'Гродно',
			address: 'г. Гродно, ул. Ожешко, 3',
		})

		expect(getDeliveryExplanation(quote)).toContain('100 BYN')
	})
})
