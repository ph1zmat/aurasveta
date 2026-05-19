export const BYN_CURRENCY_SIGN = 'Br'

export function formatPriceBYNAmount(value: number): string {
	return value.toLocaleString('ru-RU')
}

export function formatPriceBYN(value: number): string {
	return `${formatPriceBYNAmount(value)} ${BYN_CURRENCY_SIGN}`
}
