'use client'

import { useState } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import {
	Package,
	ShoppingCart,
	Users,
	LayoutDashboard,
	TrendingUp,
	CircleDot,
	CreditCard,
	ShoppingBag,
} from 'lucide-react'
import OrderCard from '@/shared/admin/orders/OrderCard'
import OrderDetailsModal from '@/shared/admin/orders/OrderDetailsModal'

type AdminStats = RouterOutputs['admin']['getStats']
type TopProductStat = NonNullable<AdminStats>['topProducts'][number]

export default function AdminDashboard() {
	const { data: stats } = trpc.admin.getStats.useQuery()
	const { data: recentPending, refetch: refetchPending } =
		trpc.orders.getAllOrders.useQuery({ status: 'PENDING', page: 1, limit: 8 })
	const { data: recentPaid, refetch: refetchPaid } =
		trpc.orders.getAllOrders.useQuery({ status: 'PAID', page: 1, limit: 4 })

	const [selectedOrder, setSelectedOrder] = useState<(typeof pendingOrders)[number] | null>(null)

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
						{pendingOrders.map(order => (
							<OrderCard
								key={order.id}
								order={order}
								onClick={() => setSelectedOrder(order)}
								variant='compact'
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
						{paidOrders.map(order => (
							<OrderCard
								key={order.id}
								order={order}
								onClick={() => setSelectedOrder(order)}
								variant='compact'
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
						{stats.topProducts.map((tp: TopProductStat) => {
							const maxQty = Math.max(
								...stats.topProducts.map(
									(item: TopProductStat) => item._sum?.quantity ?? 0,
								),
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
				<OrderDetailsModal
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
