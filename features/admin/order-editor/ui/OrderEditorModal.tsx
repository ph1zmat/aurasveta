'use client'

import { useState } from 'react'
import {
	X,
	User,
	MapPin,
	Package,
	MessageSquare,
	Phone,
} from 'lucide-react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { ORDER_STATUS_CONFIG, ORDER_TRANSITIONS } from '../model/orderStatus'
import type { AdminOrderStatus } from '@/shared/types/order'

type OrderDetail = NonNullable<RouterOutputs['orders']['getAdminById']>

interface OrderEditorModalProps {
	orderId: string
	onClose: () => void
	onUpdated: () => void
}

function formatDate(date: Date | string) {
	return new Date(date).toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function formatPrice(n: number) {
	return n.toLocaleString('ru-RU') + ' ₽'
}

function OrderDetailContent({
	order,
	onUpdated,
}: {
	order: OrderDetail
	onUpdated: () => void
}) {
	const utils = trpc.useUtils()
	const st = ORDER_STATUS_CONFIG[order.status]
	const StatusIcon = st.icon
	const transitions = ORDER_TRANSITIONS[order.status]
	const updateMut = trpc.orders.updateAdminOrder.useMutation({
		onSuccess: () => {
			void utils.orders.getAdminById.invalidate(order.id)
			onUpdated()
		},
	})
	const [isEditingPhone, setIsEditingPhone] = useState(false)
	const [isEditingAddress, setIsEditingAddress] = useState(false)
	const [phoneVal, setPhoneVal] = useState(order.phone ?? '')
	const [addressVal, setAddressVal] = useState(order.address ?? '')

	function savePhone() {
		updateMut.mutate({ id: order.id, phone: phoneVal || null })
		setIsEditingPhone(false)
	}
	function saveAddress() {
		updateMut.mutate({ id: order.id, address: addressVal || null })
		setIsEditingAddress(false)
	}

	return (
		<div className='space-y-5'>
			{/* Status & actions */}
			<div className='flex flex-wrap items-center gap-3'>
				<div
					className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${st.bg} ${st.color} ${st.border ?? ''}`}
				>
					<StatusIcon className='h-3.5 w-3.5' />
					{st.label}
				</div>
				{transitions.map(t => {
					const TIcon = t.icon
					return (
						<Button
							key={t.next}
							type='button'
							variant='ghost'
							size='sm'
							disabled={updateMut.isPending}
							onClick={() =>
								updateMut.mutate({
									id: order.id,
									status: t.next as AdminOrderStatus,
								})
							}
						>
							<TIcon className='mr-1.5 h-3.5 w-3.5' />
							{t.label}
						</Button>
					)
				})}
			</div>

			{/* Customer */}
			<div className='rounded-xl border border-border/70 bg-muted/10 p-4'>
				<div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
					<User className='h-3.5 w-3.5' />
					Покупатель
				</div>
				<p className='text-sm text-foreground'>
					{order.user?.name ?? order.user?.email ?? 'Аноним'}
				</p>
				{order.user?.email && order.user.name && (
					<p className='mt-0.5 text-xs text-muted-foreground'>{order.user.email}</p>
				)}

				{/* Phone */}
				<div className='mt-3'>
					<div className='flex items-center gap-2'>
						<Phone className='h-3.5 w-3.5 text-muted-foreground' />
						{isEditingPhone ? (
							<div className='flex flex-1 items-center gap-2'>
								<input
									autoFocus
									value={phoneVal}
									onChange={e => setPhoneVal(e.target.value)}
									className='h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
								/>
								<Button type='button' variant='primary' size='sm' onClick={savePhone} disabled={updateMut.isPending}>
									Сохранить
								</Button>
								<Button type='button' variant='ghost' size='sm' onClick={() => setIsEditingPhone(false)}>
									Отмена
								</Button>
							</div>
						) : (
							<button
								type='button'
								className='text-sm text-foreground hover:underline'
								onClick={() => setIsEditingPhone(true)}
							>
								{order.phone ?? <span className='text-muted-foreground'>Не указан</span>}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Address */}
			<div className='rounded-xl border border-border/70 bg-muted/10 p-4'>
				<div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
					<MapPin className='h-3.5 w-3.5' />
					Адрес доставки
				</div>
				{isEditingAddress ? (
					<div className='space-y-2'>
						<textarea
							autoFocus
							rows={2}
							value={addressVal}
							onChange={e => setAddressVal(e.target.value)}
							className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
						/>
						<div className='flex gap-2'>
							<Button type='button' variant='primary' size='sm' onClick={saveAddress} disabled={updateMut.isPending}>
								Сохранить
							</Button>
							<Button type='button' variant='ghost' size='sm' onClick={() => setIsEditingAddress(false)}>
								Отмена
							</Button>
						</div>
					</div>
				) : (
					<button
						type='button'
						className='text-left text-sm text-foreground hover:underline'
						onClick={() => setIsEditingAddress(true)}
					>
						{order.address ?? <span className='text-muted-foreground'>Не указан</span>}
					</button>
				)}
			</div>

			{/* Items */}
			<div className='rounded-xl border border-border/70 bg-muted/10 p-4'>
				<div className='mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
					<Package className='h-3.5 w-3.5' />
					Товары
				</div>
				<div className='space-y-2'>
					{order.items.map(item => (
						<div key={item.id} className='flex items-center gap-3'>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm text-foreground'>{item.product?.name ?? item.productId}</p>
								<p className='text-xs text-muted-foreground'>
									{item.quantity} шт. × {formatPrice(item.price)}
								</p>
							</div>
							<p className='shrink-0 text-sm font-medium text-foreground'>
								{formatPrice(item.price * item.quantity)}
							</p>
						</div>
					))}
				</div>
				<div className='mt-3 border-t border-border/60 pt-3 text-right'>
					<span className='text-base font-bold text-foreground'>
						Итого: {formatPrice(order.total)}
					</span>
				</div>
			</div>

			{/* Comment */}
			{order.comment && (
				<div className='rounded-xl border border-border/70 bg-muted/10 p-4'>
					<div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						<MessageSquare className='h-3.5 w-3.5' />
						Комментарий
					</div>
					<p className='text-sm text-foreground'>{order.comment}</p>
				</div>
			)}

			<p className='text-right text-xs text-muted-foreground'>
				Создан: {formatDate(order.createdAt)}
			</p>
		</div>
	)
}

export function OrderEditorModal({ orderId, onClose, onUpdated }: OrderEditorModalProps) {
	const { data: order, isLoading } = trpc.orders.getAdminById.useQuery(orderId)

	return (
		<div className='fixed inset-0 z-50 flex items-start justify-end'>
			{/* Backdrop */}
			<button
				type='button'
				className='absolute inset-0 bg-black/40 backdrop-blur-sm'
				onClick={onClose}
				aria-label='Закрыть'
			/>
			{/* Panel */}
			<div className='relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-background shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-5 py-4'>
					<div>
						<h2 className='text-base font-semibold text-foreground'>
							Заказ #{orderId.slice(-8)}
						</h2>
						{order && (
							<p className='mt-0.5 text-xs text-muted-foreground'>
								{formatDate(order.createdAt)}
							</p>
						)}
					</div>
					<button
						type='button'
						onClick={onClose}
						className='flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-4 w-4' />
					</button>
				</div>

				{/* Body */}
				<div className='flex-1 overflow-y-auto p-5'>
					{isLoading ? (
						<div className='flex items-center justify-center py-16 text-sm text-muted-foreground'>
							Загрузка...
						</div>
					) : order ? (
						<OrderDetailContent order={order} onUpdated={onUpdated} />
					) : (
						<div className='flex items-center justify-center py-16 text-sm text-muted-foreground'>
							Заказ не найден
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
