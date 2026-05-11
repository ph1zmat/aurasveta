export const BYN_CURRENCY_SIGN = 'Br'

export function formatPriceBYN(value: number): string {
	return `${value.toLocaleString('ru-RU')} ${BYN_CURRENCY_SIGN}`
}
