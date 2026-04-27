'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import {
	Search,
	ShoppingBag,
	CreditCard,
	CircleDot,
} from 'lucide-react'
import OrderCard from '@/shared/admin/orders/OrderCard'
import OrderDetailsModal from '@/shared/admin/orders/OrderDetailsModal'

type OrdersListResponse = RouterOutputs['orders']['getAllOrders']
type OrderListItem = OrdersListResponse['items'][number]

type Status = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const TABS: { key: Status | 'ALL'; label: string }[] = [
	{ key: 'ALL', label: 'Все' },
	{ key: 'PENDING', label: 'Новые' },
	{ key: 'PAID', label: 'Оплачены' },
	{ key: 'SHIPPED', label: 'Отправлены' },
	{ key: 'DELIVERED', label: 'Доставлены' },
	{ key: 'CANCELLED', label: 'Отменены' },
]

export default function OrdersClient() {
	const [activeTab, setActiveTab] = useState<Status | 'ALL'>('ALL')
	const [search, setSearch] = useState('')
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [page, setPage] = useState(1)

	const { data, refetch } = trpc.orders.getAllOrders.useQuery({
		status: activeTab === 'ALL' ? undefined : activeTab,
		search: search || undefined,
		page,
		limit: 24,
	})

	const items = data?.items ?? []
	const totalPages = data?.totalPages ?? 1
	const countsByStatus = data?.countsByStatus
	const selectedOrder = items.find((order: OrderListItem) => order.id === selectedId)

	return (
		<div className='space-y-5'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
						<ShoppingBag className='h-5 w-5 text-primary' />
					</div>
					<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
						Заказы
					</h1>
				</div>

				{/* Quick counters */}
				<div className='flex gap-2'>
					{(countsByStatus?.PENDING ?? 0) > 0 && (
						<button
							onClick={() => {
								setActiveTab('PENDING')
								setPage(1)
							}}
							className='flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/20'
						>
							<CircleDot className='h-3 w-3' />
							{countsByStatus?.PENDING ?? 0} новых
						</button>
					)}
					{(countsByStatus?.PAID ?? 0) > 0 && (
						<button
							onClick={() => {
								setActiveTab('PAID')
								setPage(1)
							}}
							className='flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20'
						>
							<CreditCard className='h-3 w-3' />
							{countsByStatus?.PAID ?? 0} оплачено
						</button>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className='flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1'>
				{TABS.map(tab => (
					<button
						key={tab.key}
						onClick={() => {
							setActiveTab(tab.key)
							setPage(1)
							setSearch('')
						}}
						className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === tab.key
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{tab.label}
						{tab.key !== 'ALL' &&
							activeTab === tab.key &&
							data?.total != null && (
								<span
									className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold ${STATUS_CONFIG[tab.key as Status].bg} ${STATUS_CONFIG[tab.key as Status].color}`}
								>
									{data.total}
								</span>
							)}
					</button>
				))}
			</div>

			{/* Search */}
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
				<input
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder='Поиск по номеру, имени, email, телефону...'
					className='flex h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
			</div>

			{/* Cards grid */}
			{items.length > 0 ? (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
					{items.map((order: OrderListItem) => (
						<OrderCard
							key={order.id}
							order={order}
							onClick={() => setSelectedId(order.id)}
							variant='default'
						/>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<ShoppingBag className='mb-3 h-10 w-10 text-muted-foreground/20' />
					<p className='text-sm text-muted-foreground'>
						{search ? 'Ничего не найдено' : 'Нет заказов'}
					</p>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && !search && (
				<div className='flex items-center justify-center gap-2 pt-2'>
					<button
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Назад
					</button>
					<span className='text-xs text-muted-foreground'>
						{page} / {totalPages}
					</span>
					<button
						onClick={() => setPage(p => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
						className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						Далее
					</button>
				</div>
			)}

			{/* Detail modal */}
			{selectedOrder && (
				<OrderDetailsModal
					order={selectedOrder}
					onClose={() => setSelectedId(null)}
					onStatusChange={() => {
						refetch()
						setSelectedId(null)
					}}
				/>
			)}
		</div>
	)
}

