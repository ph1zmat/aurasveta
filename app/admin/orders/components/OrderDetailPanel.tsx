'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderTimeline } from './OrderTimeline'
import { Printer, MessageCircle, RefreshCw, X } from 'lucide-react'
import { FaPhoneAlt, FaViber } from 'react-icons/fa'

const statusLabels: Record<string, string> = {
	PENDING: 'Новый',
	PAID: 'Оплачен',
	SHIPPED: 'Отправлен',
	DELIVERED: 'Доставлен',
	CANCELLED: 'Отменён',
}
const statusColors: Record<string, string> = {
	PENDING: 'bg-warning/15 text-warning border-warning/20',
	PAID: 'bg-success/15 text-success border-success/20',
	SHIPPED: 'bg-info/15 text-info border-info/20',
	DELIVERED: 'bg-accent/15 text-accent border-accent/20',
	CANCELLED: 'bg-destructive/15 text-destructive border-destructive/20',
}

interface Order {
	id: string
	status: string
	total: number
	createdAt: Date | string
	user?: { name?: string | null; email?: string | null } | null
	items?: Array<{ product?: { name?: string | null } | null; quantity: number; price: number }>
	phone?: string | null
	contactMethod?: 'PHONE' | 'VIBER' | null
	address?: string | null
	comment?: string | null
}

interface OrderDetailPanelProps {
	order: Order
	onClose: () => void
	onMessage: () => void
	onRefund: () => void
}


export function OrderDetailPanel({ order, onClose, onMessage, onRefund }: OrderDetailPanelProps) {
	const handlePrint = () => {
		window.print()
	}

	return (
		<div className='flex h-full flex-col gap-4 overflow-y-auto'>
			{/* Header */}
			<div className='flex items-start justify-between gap-2'>
				<div>
					<div className='text-xs text-muted-foreground'>Заказ</div>
					<div className='font-mono font-bold text-lg'>
						#{order.id.slice(-6).toUpperCase()}
					</div>
				</div>
				<div className='flex items-center gap-1.5'>
					<Badge
						variant='outline'
						className={`text-[10px] border ${statusColors[order.status] ?? ''}`}
					>
						{statusLabels[order.status] ?? order.status}
					</Badge>
					<Button variant='ghost' size='icon' className='h-7 w-7' onClick={handlePrint}>
						<Printer className='h-4 w-4' />
					</Button>
					<Button variant='ghost' size='icon' className='h-7 w-7' onClick={onMessage}>
						<MessageCircle className='h-4 w-4' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						className='h-7 w-7 text-destructive hover:text-destructive'
						onClick={onRefund}
					>
						<RefreshCw className='h-4 w-4' />
					</Button>
					<Button variant='ghost' size='icon' className='h-7 w-7' onClick={onClose}>
						<X className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Timeline */}
			{order.status !== 'CANCELLED' && (
				<div className='rounded-lg border border-border bg-secondary/30 p-3'>
					<OrderTimeline currentStatus={order.status} />
				</div>
			)}

			{/* Customer */}
			<div className='space-y-2'>
				<div className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Клиент</div>
				<div className='rounded-lg border border-border bg-card p-3 space-y-1'>
					<div className='font-medium text-sm'>{order.user?.name ?? 'Гость'}</div>
					{order.user?.email && (
						<div className='text-xs text-muted-foreground'>{order.user.email}</div>
					)}
					{order.phone && (
						<div className='text-xs text-muted-foreground'>
							{order.phone}
							{order.contactMethod ? (
								<span className='ml-2 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide'>
									{order.contactMethod === 'VIBER' ? (
										<>
											<FaViber className='h-3 w-3' />
											Viber
										</>
									) : (
										<>
											<FaPhoneAlt className='h-3 w-3' />
											Телефон
										</>
									)}
								</span>
							) : null}
						</div>
					)}
					{order.address && (
						<div className='text-xs text-muted-foreground mt-1'>{order.address}</div>
					)}
				</div>
			</div>

			{/* Items */}
			{order.items && order.items.length > 0 && (
				<div className='space-y-2'>
					<div className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Товары</div>
					<div className='rounded-lg border border-border overflow-hidden'>
						{order.items.map((item, i) => (
							<div
								key={i}
								className='flex items-center justify-between px-3 py-2 border-b border-border last:border-0 text-sm'
							>
								<span className='truncate text-sm'>{item.product?.name ?? '—'}</span>
								<div className='flex items-center gap-3 shrink-0 ml-2'>
									<span className='text-muted-foreground text-xs'>×{item.quantity}</span>
									<span className='font-semibold'>
										₽{(item.price * item.quantity).toLocaleString('ru-RU')}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Total */}
			<div className='flex items-center justify-between rounded-lg border border-border bg-accent/5 px-4 py-3'>
				<span className='font-semibold text-sm'>Итого</span>
				<span className='font-extrabold text-lg text-accent'>
					₽{order.total.toLocaleString('ru-RU')}
				</span>
			</div>

			{/* Comment */}
			{order.comment && (
				<div className='rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground italic'>
					{order.comment}
				</div>
			)}
		</div>
	)
}
