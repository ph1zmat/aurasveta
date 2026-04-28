'use client'

import { useMemo } from 'react'
import { Clock, MapPin, MessageSquare, Phone, User } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import AdminModal from '@/shared/ui/AdminModal'
import {
	ORDER_STATUS_CONFIG,
	ORDER_TRANSITIONS,
	type AdminOrderStatus,
} from './orderStatus'

export interface AdminOrderDetailsItem {
	id: string
	status: AdminOrderStatus
	total: number
	createdAt: string | Date
	phone?: string | null
	address?: string | null
	comment?: string | null
	user?: {
		name?: string | null
		email?: string | null
	} | null
	items?: Array<{
		id?: string
		quantity: number
		price: number
		product?: { name?: string | null } | null
	}> | null
}

interface OrderDetailsModalProps {
	order: AdminOrderDetailsItem | null
	onClose: () => void
	onStatusChange: () => void
}

/**
 * Единая модалка просмотра и смены статуса заказа для админки.
 */
export default function OrderDetailsModal({
	order,
	onClose,
	onStatusChange,
}: OrderDetailsModalProps) {
	const updateStatus = trpc.orders.updateStatus.useMutation({
		onSuccess: onStatusChange,
	})

	const status = order?.status ?? 'PENDING'
	const st = ORDER_STATUS_CONFIG[status]
	const StatusIcon = st.icon
	const customerName = order?.user?.name ?? order?.user?.email ?? 'Аноним'
	const date = useMemo(() => {
		if (!order) return ''
		return new Date(order.createdAt).toLocaleString('ru-RU', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}, [order])

	if (!order) return null

	const availableTransitions = ORDER_TRANSITIONS[status] ?? []

	return (
		<AdminModal
			isOpen={!!order}
			onClose={onClose}
			title={
				<div className='flex items-center gap-3'>
					<div
						className={`flex h-10 w-10 items-center justify-center rounded-xl ${st.bg}`}
					>
						<StatusIcon className={`h-5 w-5 ${st.color}`} />
					</div>
					<div>
						<div className='font-mono text-sm text-muted-foreground'>
							#{order.id.slice(-8)}
						</div>
						<div className={`text-sm font-medium ${st.color}`}>{st.label}</div>
					</div>
				</div>
			}
			size='lg'
			scrollable
			footer={
				availableTransitions.length > 0 ? (
					availableTransitions.map(transition => {
						const Icon = transition.icon
						const isDestructive = transition.next === 'CANCELLED'

						return (
							<button
								key={transition.next}
								type='button'
								onClick={() =>
									updateStatus.mutate({ id: order.id, status: transition.next })
								}
								disabled={updateStatus.isPending}
								className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
									isDestructive
										? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
										: 'bg-primary/10 text-primary hover:bg-primary/20'
								}`}
							>
								<Icon className='h-4 w-4' />
								{transition.label}
							</button>
						)
					})
				) : (
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						Закрыть
					</button>
				)
			}
		>
			<div className='space-y-4 p-6'>
				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div>
						<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
							<User className='h-3 w-3' />
							Клиент
						</div>
						<div className='font-medium text-foreground'>{customerName}</div>
					</div>
					<div>
						<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
							<Clock className='h-3 w-3' />
							Дата
						</div>
						<div className='font-medium text-foreground'>{date}</div>
					</div>
					{order.phone ? (
						<div>
							<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
								<Phone className='h-3 w-3' />
								Телефон
							</div>
							<div className='font-medium text-foreground'>{order.phone}</div>
						</div>
					) : null}
					{order.address ? (
						<div className='col-span-2'>
							<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
								<MapPin className='h-3 w-3' />
								Адрес
							</div>
							<div className='font-medium text-foreground'>{order.address}</div>
						</div>
					) : null}
					{order.comment ? (
						<div className='col-span-2'>
							<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
								<MessageSquare className='h-3 w-3' />
								Комментарий
							</div>
							<div className='font-medium text-foreground'>{order.comment}</div>
						</div>
					) : null}
				</div>

				{order.items && order.items.length > 0 ? (
					<div className='overflow-hidden rounded-xl border border-border'>
						{order.items.map((item, index) => (
							<div
								key={item.id ?? index}
								className='flex items-center justify-between border-b border-border/50 px-4 py-3 last:border-0'
							>
								<div className='text-sm text-foreground'>
									{item.product?.name ?? 'Товар'}
								</div>
								<div className='flex items-center gap-4 text-sm text-muted-foreground'>
									<span>{item.quantity} шт.</span>
									<span className='font-medium text-foreground'>
										{(item.price * item.quantity).toLocaleString('ru-RU')} ₽
									</span>
								</div>
							</div>
						))}
					</div>
				) : null}

				<div className='flex justify-end'>
					<div className='text-lg font-bold text-foreground'>
						Итого:{' '}
						<span className='tabular-nums'>
							{order.total.toLocaleString('ru-RU')} ₽
						</span>
					</div>
				</div>
			</div>
		</AdminModal>
	)
}
