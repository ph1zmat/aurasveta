export const BELARUS_FREE_DELIVERY_THRESHOLD = 400
export const BELARUS_DELIVERY_RATE = 100

export type DeliveryZone = 'MOZYR' | 'BELARUS'

export type DeliveryCalculation = {
	zone: DeliveryZone
	cost: number
	isFree: boolean
	qualifiesForBelarusFreeDelivery: boolean
}

function normalizeLocation(value: string): string {
	return value
		.toLowerCase()
		.replace(/ё/g, 'е')
		.replace(/[.,]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function isMozyrDeliveryLocation(
	value: string | null | undefined,
): boolean {
	if (!value) return false

	const normalized = normalizeLocation(value)
	return normalized.includes('мозыр') || normalized.includes('mozyr')
}

export function isMozyrDeliveryAddress(
	address: string | null | undefined,
): boolean {
	return isMozyrDeliveryLocation(address)
}

export function calculateDeliveryCost(input: {
	subtotal: number
	city?: string | null
	address?: string | null
}): DeliveryCalculation {
	const subtotal = Number.isFinite(input.subtotal)
		? Math.max(0, input.subtotal)
		: 0
	const city = input.city?.trim() ?? ''
	const zoneSource = city.length > 0 ? city : input.address
	const zone: DeliveryZone = isMozyrDeliveryLocation(zoneSource)
		? 'MOZYR'
		: 'BELARUS'

	if (zone === 'MOZYR') {
		return {
			zone,
			cost: 0,
			isFree: true,
			qualifiesForBelarusFreeDelivery:
				subtotal >= BELARUS_FREE_DELIVERY_THRESHOLD,
		}
	}

	const qualifiesForBelarusFreeDelivery =
		subtotal >= BELARUS_FREE_DELIVERY_THRESHOLD

	return {
		zone,
		cost: qualifiesForBelarusFreeDelivery ? 0 : BELARUS_DELIVERY_RATE,
		isFree: qualifiesForBelarusFreeDelivery,
		qualifiesForBelarusFreeDelivery,
	}
}

export function getDeliveryPreviewLabel(subtotal: number): string {
	if (subtotal >= BELARUS_FREE_DELIVERY_THRESHOLD) {
		return 'По Мозырю и Беларуси — бесплатно'
	}

	return `Мозырь — бесплатно, Беларусь — ${BELARUS_DELIVERY_RATE} BYN`
}

export function getDeliveryExplanation(
	calculation: DeliveryCalculation,
): string {
	if (calculation.zone === 'MOZYR') {
		return 'Для адресов в Мозыре доставка всегда бесплатная.'
	}

	if (calculation.isFree) {
		return `По Беларуси доставка бесплатная для заказов от ${BELARUS_FREE_DELIVERY_THRESHOLD} BYN.`
	}

	return `По Беларуси для заказов до ${BELARUS_FREE_DELIVERY_THRESHOLD} BYN доставка стоит ${BELARUS_DELIVERY_RATE} BYN.`
}
