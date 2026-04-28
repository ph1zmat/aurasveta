'use client'

import { ChevronRight, Clock, Package, User } from 'lucide-react'
import { ORDER_STATUS_CONFIG, type AdminOrderStatus } from './orderStatus'

export interface AdminOrderCardItem {
	id: string
	status: AdminOrderStatus
	total: number
	createdAt: string | Date
	user?: {
		name?: string | null
		email?: string | null
	} | null
	items?: Array<unknown> | null
}

interface OrderCardProps {
	order: AdminOrderCardItem
	onClick: () => void
	variant?: 'compact' | 'default'
}

/**
 * Унифицированная карточка заказа для dashboard и списка заказов.
 */
export default function OrderCard({
	order,
	onClick,
	variant = 'default',
}: OrderCardProps) {
	const status = order.status
	const st = ORDER_STATUS_CONFIG[status]
	const StatusIcon = st.icon
	const date = new Date(order.createdAt).toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
	const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'
	const itemCount = order.items?.length ?? 0
	const rootClassName =
		variant === 'compact'
			? 'relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'
			: 'relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'

	return (
		<div onClick={onClick} className={rootClassName}>
			<div className={`h-1 ${st.bg.replace('/10', '/40')}`} />
			<div className='flex flex-1 flex-col gap-2 p-3'>
				<div className='flex items-center justify-between'>
					<span className='font-mono text-[11px] text-muted-foreground'>
						#{order.id.slice(-6)}
					</span>
					<div
						className={`flex h-6 w-6 items-center justify-center rounded-full ${st.bg}`}
						title={st.label}
					>
						<StatusIcon className={`h-3.5 w-3.5 ${st.color}`} />
					</div>
				</div>
				<div className='text-xl font-bold tabular-nums text-foreground'>
					{order.total.toLocaleString('ru-RU')} ₽
				</div>
				<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
					<User className='h-3 w-3' />
					<span className='truncate'>{customerName}</span>
				</div>
				<div className='mt-auto flex items-center justify-between text-[10px] text-muted-foreground'>
					<span className='flex items-center gap-1'>
						<Clock className='h-3 w-3' />
						{date}
					</span>
					<span className='flex items-center gap-1'>
						<Package className='h-3 w-3' />
						{itemCount}
					</span>
				</div>
				<button
					type='button'
					className='flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
				>
					Подробнее
					<ChevronRight className='h-3 w-3' />
				</button>
			</div>
		</div>
	)
}
