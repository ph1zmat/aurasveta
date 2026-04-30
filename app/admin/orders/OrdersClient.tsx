'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, LayoutGrid, List } from 'lucide-react'
import { OrderKanbanBoard } from './components/OrderKanbanBoard'
import { OrderDetailPanel } from './components/OrderDetailPanel'
import { RefundModal } from './components/RefundModal'
import { MessageModal } from './components/MessageModal'
import { OrderEditorModal } from '@/features/admin/order-editor'
import { KanbanSkeleton, TableSkeleton } from '../components/AdminSkeleton'
import { statusLabels, statusColors } from '@/shared/admin/order-status'

export default function OrdersClient() {
	const [view, setView] = useState<'kanban' | 'list'>('kanban')
	const [search, setSearch] = useState('')
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
	const [refundOrderId, setRefundOrderId] = useState<string | null>(null)
	const [messageOrderId, setMessageOrderId] = useState<string | null>(null)

	const { data: kanbanData, isLoading: kanbanLoading, refetch } = trpc.orders.getAllByStatuses.useQuery()
	const { data: listData, isLoading: listLoading, refetch: refetchList } = trpc.orders.getAllOrders.useQuery(
		{ page: 1, limit: 50, search: search || undefined },
		{ enabled: view === 'list' },
	)
	const updateStatus = trpc.orders.updateStatus.useMutation({
		onSuccess: () => {
			toast.success('Статус обновлён')
			void refetch()
		},
		onError: () => toast.error('Ошибка обновления статуса'),
	})

	// Фильтрация kanban по поисковому запросу (клиентская)
	const filteredKanbanData = useMemo(() => {
		if (!kanbanData || !search.trim()) return kanbanData
		const query = search.toLowerCase()
		const result = { ...kanbanData } as Record<string, typeof kanbanData[keyof typeof kanbanData]>
		for (const [status, orders] of Object.entries(kanbanData)) {
			result[status] = orders.filter((o) =>
				(o.id.toLowerCase().includes(query)) ||
				(o.user?.name?.toLowerCase().includes(query)) ||
				(o.total?.toString().includes(query))
			)
		}
		return result
	}, [kanbanData, search])

	// Flatten all orders to find selected
	const allOrders = useMemo(() => {
		if (!kanbanData) return []
		return Object.values(kanbanData).flat()
	}, [kanbanData])

	const selectedOrder = useMemo(
		() => allOrders.find((o) => o.id === selectedOrderId) ?? null,
		[allOrders, selectedOrderId],
	)
	const refundOrder = useMemo(
		() => allOrders.find((o) => o.id === refundOrderId) ?? null,
		[allOrders, refundOrderId],
	)
	const messageOrder = useMemo(
		() => allOrders.find((o) => o.id === messageOrderId) ?? null,
		[allOrders, messageOrderId],
	)

	const handleStatusChange = (orderId: string, newStatus: string) => {
		updateStatus.mutate({
			id: orderId,
			status: newStatus as 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
		})
	}

	const handleOrderClick = (orderId: string) => {
		setSelectedOrderId(orderId)
	}

	return (
		<div className='flex h-full flex-col gap-4'>
			{/* Toolbar */}
			<div className='flex items-center gap-3'>
				<h1 className='text-xl font-bold shrink-0'>Заказы</h1>
				<div className='relative flex-1 max-w-sm'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='Поиск заказа...'
						className='pl-9'
					/>
				</div>
				<div className='ml-auto flex items-center gap-1.5'>
					<Button
						variant={view === 'kanban' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setView('kanban')}
					>
						<LayoutGrid className='h-4 w-4 mr-1.5' />
						Kanban
					</Button>
					<Button
						variant={view === 'list' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setView('list')}
					>
						<List className='h-4 w-4 mr-1.5' />
						Список
					</Button>
				</div>
			</div>

			{/* Main content: kanban + optional side panel */}
			<div className='flex flex-1 gap-4 min-h-0'>
				{/* Kanban or list */}
				<div className={`flex-1 min-w-0 ${selectedOrder ? 'hidden xl:block' : ''}`}>
					{view === 'kanban' && kanbanLoading ? (
						<KanbanSkeleton />
					) : view === 'kanban' && filteredKanbanData ? (
						<OrderKanbanBoard
							ordersByStatus={filteredKanbanData as Record<string, Parameters<typeof OrderKanbanBoard>[0]['ordersByStatus'][string]>}
							onOrderClick={handleOrderClick}
							onStatusChange={handleStatusChange}
						/>
					) : view === 'list' && listLoading ? (
						<TableSkeleton rows={8} columns={4} />
					) : view === 'list' ? (
						<div className='rounded-lg border border-border overflow-hidden bg-card'>
							<div className='overflow-x-auto'>
								<table className='w-full text-sm'>
								<thead>
									<tr className='border-b border-border bg-secondary/50'>
										<th className='py-3 pl-5 text-left text-xs font-semibold text-muted-foreground'>Заказ</th>
										<th className='py-3 px-4 text-left text-xs font-semibold text-muted-foreground'>Клиент</th>
										<th className='py-3 px-4 text-right text-xs font-semibold text-muted-foreground'>Сумма</th>
										<th className='py-3 px-4 text-left text-xs font-semibold text-muted-foreground'>Статус</th>
									</tr>
								</thead>
								<tbody>
									{(listData?.items ?? []).map((order) => (
										<tr
											key={order.id}
											className='border-t border-border hover:bg-secondary/50 cursor-pointer transition-colors'
											onClick={() => handleOrderClick(order.id)}
										>
											<td className='py-3 pl-5 font-mono text-xs text-accent font-semibold'>
												#{order.id.slice(-6).toUpperCase()}
											</td>
											<td className='py-3 px-4'>{order.user?.name ?? 'Гость'}</td>
											<td className='py-3 px-4 text-right font-bold'>
												₽{order.total.toLocaleString('ru-RU')}
											</td>
											<td className='py-3 px-4 pr-5'>
												<Badge className={`text-[10px] border ${statusColors[order.status] ?? 'bg-secondary'}`} variant='outline'>
													{statusLabels[order.status] ?? order.status}
												</Badge>
											</td>
										</tr>
									))}
										{(!listData?.items || listData.items.length === 0) && (
											<tr>
												<td colSpan={4} className='text-center py-12 text-muted-foreground text-sm'>
													Нет заказов
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
						) : (
							<div className='flex items-center justify-center h-40 text-muted-foreground text-sm'>
								Загрузка...
							</div>
						)}
					</div>

					{/* Order detail side panel */}
					{selectedOrder && (
						<div className='w-80 xl:w-96 shrink-0 rounded-lg border border-border bg-card p-4 overflow-y-auto'>
							<OrderDetailPanel
								order={selectedOrder}
								onClose={() => setSelectedOrderId(null)}
								onMessage={() => setMessageOrderId(selectedOrder.id)}
								onRefund={() => setRefundOrderId(selectedOrder.id)}
							/>
							</div>
						)}
					</div>

					{/* Order editor modal (full edit) */}
					{selectedOrderId && (
						<OrderEditorModal
							orderId={selectedOrderId}
							onClose={() => setSelectedOrderId(null)}
							onUpdated={() => {
								void refetch()
								void refetchList()
								setSelectedOrderId(null)
							}}
						/>
					)}

					{/* Refund modal */}
					{refundOrder && (
						<RefundModal
							open={!!refundOrderId}
							orderId={refundOrder.id}
							orderTotal={refundOrder.total}
							onClose={() => setRefundOrderId(null)}
						/>
					)}

					{/* Message modal */}
					{messageOrder && (
						<MessageModal
							open={!!messageOrderId}
							orderId={messageOrder.id}
							customerName={messageOrder.user?.name ?? undefined}
							onClose={() => setMessageOrderId(null)}
						/>
					)}
				</div>
			)
}
