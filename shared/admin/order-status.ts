/**
 * Единые константы статусов заказов для использования
 * во всей админ-панели (Dashboard, Orders, Kanban и т.д.).
 */

export const ORDER_STATUSES = [
	'PENDING',
	'PAID',
	'SHIPPED',
	'DELIVERED',
	'CANCELLED',
	'PROCESSING',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const statusLabels: Record<OrderStatus, string> = {
	PENDING: 'Новый',
	PAID: 'Оплачен',
	SHIPPED: 'Отправлен',
	DELIVERED: 'Доставлен',
	CANCELLED: 'Отменён',
	PROCESSING: 'В обработке',
}

export const statusColors: Record<OrderStatus, string> = {
	PENDING: 'bg-warning/15 text-warning border-warning/20',
	PAID: 'bg-success/15 text-success border-success/20',
	SHIPPED: 'bg-info/15 text-info border-info/20',
	DELIVERED: 'bg-accent/15 text-accent border-accent/20',
	CANCELLED: 'bg-destructive/15 text-destructive border-destructive/20',
	PROCESSING: 'bg-purple-500/15 text-purple-600 border-purple-500/20',
}

/** Border-top цвета для Kanban-колонок */
export const statusBorderColors: Record<OrderStatus, string> = {
	PENDING: 'border-t-warning',
	PAID: 'border-t-success',
	SHIPPED: 'border-t-info',
	DELIVERED: 'border-t-accent',
	CANCELLED: 'border-t-destructive',
	PROCESSING: 'border-t-purple-500',
}
