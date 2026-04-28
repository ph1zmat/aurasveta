import { Ban, CheckCircle2, CircleDot, CreditCard, Truck } from 'lucide-react'

export type AdminOrderStatus =
	| 'PENDING'
	| 'PAID'
	| 'SHIPPED'
	| 'DELIVERED'
	| 'CANCELLED'

export const ORDER_STATUS_CONFIG: Record<
	AdminOrderStatus,
	{
		label: string
		color: string
		bg: string
		border?: string
		icon: React.ComponentType<{ className?: string }>
	}
> = {
	PENDING: {
		label: 'Новый',
		color: 'text-amber-500',
		bg: 'bg-amber-500/10',
		border: 'border-amber-500/30',
		icon: CircleDot,
	},
	PAID: {
		label: 'Оплачен',
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
		border: 'border-emerald-500/30',
		icon: CreditCard,
	},
	SHIPPED: {
		label: 'Отправлен',
		color: 'text-violet-500',
		bg: 'bg-violet-500/10',
		border: 'border-violet-500/30',
		icon: Truck,
	},
	DELIVERED: {
		label: 'Доставлен',
		color: 'text-sky-500',
		bg: 'bg-sky-500/10',
		border: 'border-sky-500/30',
		icon: CheckCircle2,
	},
	CANCELLED: {
		label: 'Отменён',
		color: 'text-red-500',
		bg: 'bg-red-500/10',
		border: 'border-red-500/30',
		icon: Ban,
	},
}

export const ORDER_TRANSITIONS: Record<
	AdminOrderStatus,
	{
		next: AdminOrderStatus
		label: string
		icon: React.ComponentType<{ className?: string }>
	}[]
> = {
	PENDING: [
		{ next: 'PAID', label: 'Оплачен', icon: CreditCard },
		{ next: 'CANCELLED', label: 'Отменить', icon: Ban },
	],
	PAID: [
		{ next: 'SHIPPED', label: 'Отправить', icon: Truck },
		{ next: 'CANCELLED', label: 'Отменить', icon: Ban },
	],
	SHIPPED: [{ next: 'DELIVERED', label: 'Доставлен', icon: CheckCircle2 }],
	DELIVERED: [],
	CANCELLED: [],
}
