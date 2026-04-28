export const EVENTS = [
	'product.created',
	'product.updated',
	'order.created',
	'order.updated',
] as const

export const EVENT_COLORS: Record<string, { color: string; bg: string }> = {
	'product.created': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
	'product.updated': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
	'order.created': { color: 'text-amber-500', bg: 'bg-amber-500/10' },
	'order.updated': { color: 'text-violet-500', bg: 'bg-violet-500/10' },
}
