'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import {
	Package,
	ShoppingCart,
	Users,
	LayoutDashboard,
	Clock,
	User,
	TrendingUp,
	CircleDot,
	CreditCard,
	ChevronRight,
	ShoppingBag,
	X,
	Phone,
	MapPin,
	MessageSquare,
	Ban,
	Truck,
	CheckCircle2,
} from 'lucide-react'

type Status = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const STATUS_CONFIG: Record<
	Status,
	{
		label: string
		color: string
		bg: string
		icon: React.ComponentType<{ className?: string }>
	}
> = {
	PENDING: {
		label: 'Новый',
		color: 'text-amber-500',
		bg: 'bg-amber-500/10',
		icon: CircleDot,
	},
	PAID: {
		label: 'Оплачен',
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
		icon: CreditCard,
	},
	SHIPPED: {
		label: 'Отправлен',
		color: 'text-violet-500',
		bg: 'bg-violet-500/10',
		icon: Truck,
	},
	DELIVERED: {
		label: 'Доставлен',
		color: 'text-sky-500',
		bg: 'bg-sky-500/10',
		icon: CheckCircle2,
	},
	CANCELLED: {
		label: 'Отменён',
		color: 'text-red-500',
		bg: 'bg-red-500/10',
		icon: Ban,
	},
}

export default function AdminDashboard() {
	const { data: stats } = trpc.admin.getStats.useQuery()
	const { data: recentPending, refetch: refetchPending } =
		trpc.orders.getAllOrders.useQuery({ status: 'PENDING', page: 1, limit: 8 })
	const { data: recentPaid, refetch: refetchPaid } =
		trpc.orders.getAllOrders.useQuery({ status: 'PAID', page: 1, limit: 4 })

	const [selectedOrder, setSelectedOrder] = useState<any>(null)

	const pendingOrders = recentPending?.items ?? []
	const paidOrders = recentPaid?.items ?? []

	const statCards = [
		{
			label: 'Товары',
			value: stats?.totalProducts ?? 0,
			icon: Package,
			color: 'text-blue-500',
			bg: 'bg-blue-500/10',
		},
		{
			label: 'Заказы',
			value: stats?.totalOrders ?? 0,
			icon: ShoppingCart,
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10',
		},
		{
			label: 'Пользователи',
			value: stats?.totalUsers ?? 0,
			icon: Users,
			color: 'text-violet-500',
			bg: 'bg-violet-500/10',
		},
	]

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-3'>
				<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
					<LayoutDashboard className='h-5 w-5 text-primary' />
				</div>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Главная
				</h1>
			</div>

			{/* Stat cards */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{statCards.map(card => {
					const Icon = card.icon
					return (
						<div
							key={card.label}
							className='rounded-2xl border border-border bg-muted/10 p-5 transition-colors hover:bg-muted/20'
						>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-muted-foreground'>
									{card.label}
								</span>
								<div
									className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
								>
									<Icon className={`h-4 w-4 ${card.color}`} />
								</div>
							</div>
							<p className='mt-3 text-3xl font-bold tabular-nums text-foreground'>
								{card.value.toLocaleString('ru-RU')}
							</p>
						</div>
					)
				})}
			</div>

			{/* Pending orders */}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
							<CircleDot className='h-3.5 w-3.5 text-amber-500' />
							Новые заказы
						</div>
						{pendingOrders.length > 0 && (
							<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-500'>
								{recentPending?.total ?? 0}
							</span>
						)}
					</div>
				</div>

				{pendingOrders.length > 0 ? (
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
						{pendingOrders.map((order: any) => (
							<MiniOrderCard
								key={order.id}
								order={order}
								onClick={() => setSelectedOrder(order)}
							/>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
						<ShoppingBag className='mb-2 h-8 w-8 text-muted-foreground/20' />
						<p className='text-sm text-muted-foreground'>Нет новых заказов</p>
					</div>
				)}
			</div>

			{/* Recently paid */}
			{paidOrders.length > 0 && (
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
							<CreditCard className='h-3.5 w-3.5 text-emerald-500' />
							Оплаченные
						</div>
						<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/10 px-1.5 text-[10px] font-semibold text-emerald-500'>
							{recentPaid?.total ?? 0}
						</span>
					</div>
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
						{paidOrders.map((order: any) => (
							<MiniOrderCard
								key={order.id}
								order={order}
								onClick={() => setSelectedOrder(order)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Top products */}
			<div className='space-y-4'>
				<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
					<TrendingUp className='h-3.5 w-3.5 text-emerald-500' />
					Топ товаров
				</div>

				{stats?.topProducts && stats.topProducts.length > 0 ? (
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
						{stats.topProducts.map((tp: any) => {
							const maxQty = Math.max(
								...stats.topProducts.map((t: any) => t._sum?.quantity ?? 0),
							)
							const qty = tp._sum?.quantity ?? 0
							const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0

							return (
								<div
									key={tp.productId}
									className='relative overflow-hidden rounded-2xl border border-border bg-muted/10 p-4 transition-colors hover:bg-muted/20'
								>
									<div
										className='absolute bottom-0 left-0 h-1 bg-emerald-500/30'
										style={{ width: `${pct}%` }}
									/>
									<div className='truncate text-sm font-medium text-foreground'>
										{tp.product?.name ?? tp.productId}
									</div>
									<div className='mt-1 flex items-center gap-1.5'>
										<Package className='h-3 w-3 text-muted-foreground' />
										<span className='text-lg font-bold tabular-nums text-foreground'>
											{qty}
										</span>
										<span className='text-xs text-muted-foreground'>шт.</span>
									</div>
								</div>
							)
						})}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
						<TrendingUp className='mb-2 h-8 w-8 text-muted-foreground/20' />
						<p className='text-sm text-muted-foreground'>Нет данных</p>
					</div>
				)}
			</div>

			{/* Order detail modal */}
			{selectedOrder && (
				<OrderModal
					order={selectedOrder}
					onClose={() => setSelectedOrder(null)}
					onStatusChange={() => {
						refetchPending()
						refetchPaid()
						setSelectedOrder(null)
					}}
				/>
			)}
		</div>
	)
}

/* ============== Mini Order Card ============== */

function MiniOrderCard({
	order,
	onClick,
}: {
	order: any
	onClick: () => void
}) {
	const status = (order.status as Status) ?? 'PENDING'
	const st = STATUS_CONFIG[status]
	const StatusIcon = st.icon
	const date = new Date(order.createdAt).toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
	const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'
	const itemCount = order.items?.length ?? 0

	return (
		<div
			onClick={onClick}
			className='relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'
		>
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
				<button className='flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'>
					Подробнее
					<ChevronRight className='h-3 w-3' />
				</button>
			</div>
		</div>
	)
}

/* ============== Order Modal ============== */

function OrderModal({
	order,
	onClose,
	onStatusChange,
}: {
	order: any
	onClose: () => void
	onStatusChange: () => void
}) {
	const updateStatus = trpc.orders.updateStatus.useMutation({
		onSuccess: onStatusChange,
	})

	const status = order.status as Status
	const st = STATUS_CONFIG[status]
	const StatusIcon = st.icon

	const date = new Date(order.createdAt).toLocaleString('ru-RU', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})

	const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'

	const transitions: Record<
		Status,
		{ next: Status; label: string; icon: React.ComponentType<{ className?: string }> }[]
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

	const availableTransitions = transitions[status] ?? []

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
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
							<div className={`text-sm font-medium ${st.color}`}>
								{st.label}
							</div>
						</div>
					</div>
					<button
						onClick={onClose}
						className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-4 w-4' />
					</button>
				</div>

				{/* Body */}
				<div className='flex-1 overflow-y-auto p-6 space-y-4'>
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
						{order.phone && (
							<div>
								<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
									<Phone className='h-3 w-3' />
									Телефон
								</div>
								<div className='font-medium text-foreground'>{order.phone}</div>
							</div>
						)}
						{order.address && (
							<div className='col-span-2'>
								<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
									<MapPin className='h-3 w-3' />
									Адрес
								</div>
								<div className='font-medium text-foreground'>{order.address}</div>
							</div>
						)}
						{order.comment && (
							<div className='col-span-2'>
								<div className='mb-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
									<MessageSquare className='h-3 w-3' />
									Комментарий
								</div>
								<div className='font-medium text-foreground'>{order.comment}</div>
							</div>
						)}
					</div>

					{/* Items */}
					{order.items && order.items.length > 0 && (
						<div className='rounded-xl border border-border overflow-hidden'>
							{order.items.map((item: any, idx: number) => (
								<div
									key={item.id ?? idx}
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
					)}

					<div className='flex justify-end'>
						<div className='text-lg font-bold text-foreground'>
							Итого:{' '}
							<span className='tabular-nums'>
								{order.total.toLocaleString('ru-RU')} ₽
							</span>
						</div>
					</div>
				</div>

				{/* Footer — status transitions */}
				{availableTransitions.length > 0 && (
					<div className='flex gap-2 border-t border-border px-6 py-4'>
						{availableTransitions.map(tr => {
							const Icon = tr.icon
							const isDestructive = tr.next === 'CANCELLED'
							return (
								<button
									key={tr.next}
									onClick={() =>
										updateStatus.mutate({ id: order.id, status: tr.next })
									}
									disabled={updateStatus.isPending}
									className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
										isDestructive
											? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
											: 'bg-primary/10 text-primary hover:bg-primary/20'
									}`}
								>
									<Icon className='h-4 w-4' />
									{tr.label}
								</button>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
