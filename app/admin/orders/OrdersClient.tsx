'use client'

import {
	readEnumParam,
	readPositiveIntParam,
	readStringParam,
	useDebouncedValue,
} from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AdminOrderStatus } from '@/shared/types/order'
import {
	ORDER_STATUS_CONFIG,
	OrderCard,
	OrderEditorModal,
} from '@/features/admin/order-editor'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'
import { NLButton } from '../components/ui/button'
import { NLInput } from '../components/ui/input'

type OrdersListResponse = RouterOutputs['orders']['getAllOrders']
type OrderListItem = OrdersListResponse['items'][number]

const TABS: { key: AdminOrderStatus | 'ALL'; label: string }[] = [
	{ key: 'ALL', label: 'Все' },
	{ key: 'PENDING', label: 'Новые' },
	{ key: 'PAID', label: 'Оплачены' },
	{ key: 'SHIPPED', label: 'Отправлены' },
	{ key: 'DELIVERED', label: 'Доставлены' },
	{ key: 'CANCELLED', label: 'Отменены' },
]

export default function OrdersClient() {
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const activeTab = readEnumParam(
		searchParams.get('status'),
		['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const,
		'ALL',
	)
	const search = readStringParam(searchParams.get('search'))
	const debouncedSearch = useDebouncedValue(search, 250)
	const selectedId = readStringParam(searchParams.get('order')) || null
	const page = readPositiveIntParam(searchParams.get('page'), 1)

	const { data, refetch } = trpc.orders.getAllOrders.useQuery({
		status: activeTab === 'ALL' ? undefined : activeTab,
		search: debouncedSearch || undefined,
		page,
		limit: 24,
	})

	const items = data?.items ?? []
	const totalPages = data?.totalPages ?? 1
	const countsByStatus = data?.countsByStatus

	return (
		<div className='space-y-5'>
			{/* Quick counters */}
			<div className='flex flex-wrap gap-2'>
				{(countsByStatus?.PENDING ?? 0) > 0 && (
					<NLButton
						variant='outline'
						size='sm'
						onClick={() => {
							updateSearchParams(
								{ status: 'PENDING', page: 1 },
								{ history: 'replace' },
							)
						}}
						className='gap-1.5 text-(--nl-accent)'
					>
						{countsByStatus?.PENDING ?? 0} новых
					</NLButton>
				)}
				{(countsByStatus?.PAID ?? 0) > 0 && (
					<NLButton
						variant='outline'
						size='sm'
						onClick={() => {
							updateSearchParams(
								{ status: 'PAID', page: 1 },
								{ history: 'replace' },
							)
						}}
						className='gap-1.5 text-(--nl-success)'
					>
						{countsByStatus?.PAID ?? 0} оплачено
					</NLButton>
				)}
			</div>

			{/* Tabs */}
			<div className='flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1'>
				{TABS.map(tab => (
					<button
						key={tab.key}
						onClick={() => {
							updateSearchParams(
								{
									status: tab.key === 'ALL' ? null : tab.key,
									page: 1,
									search: null,
									order: null,
								},
								{ history: 'replace' },
							)
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
									className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold ${ORDER_STATUS_CONFIG[tab.key as AdminOrderStatus].bg} ${ORDER_STATUS_CONFIG[tab.key as AdminOrderStatus].color}`}
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
				<NLInput
					value={search}
					onChange={e =>
						updateSearchParams(
							{ search: e.target.value, page: 1, order: null },
							{ history: 'replace' },
						)
					}
					placeholder='Поиск по номеру, имени, email, телефону...'
					className='pl-9'
				/>
			</div>

			{/* Cards grid */}
			{items.length > 0 ? (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
					{items.map((order: OrderListItem) => (
						<OrderCard
							key={order.id}
							order={order}
							onClick={() =>
								updateSearchParams({ order: order.id }, { history: 'push' })
							}
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
					<NLButton
						variant='outline'
						size='sm'
						onClick={() =>
							updateSearchParams(
								{ page: Math.max(1, page - 1) },
								{ history: 'replace' },
							)
						}
						disabled={page === 1}
					>
						<ChevronLeft className='h-4 w-4' />
					</NLButton>
					<span className='text-xs text-muted-foreground'>
						{page} / {totalPages}
					</span>
					<NLButton
						variant='outline'
						size='sm'
						onClick={() =>
							updateSearchParams(
								{ page: Math.min(totalPages, page + 1) },
								{ history: 'replace' },
							)
						}
						disabled={page === totalPages}
					>
						<ChevronRight className='h-4 w-4' />
					</NLButton>
				</div>
			)}

			{/* Detail modal */}
			{selectedId && (
				<OrderEditorModal
					orderId={selectedId}
					onClose={() =>
						updateSearchParams({ order: null }, { history: 'replace' })
					}
					onUpdated={() => {
						void refetch()
						updateSearchParams({ order: null }, { history: 'replace' })
					}}
				/>
			)}
		</div>
	)
}
