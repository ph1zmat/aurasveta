'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'

const STATUSES = [
	'PENDING',
	'PAID',
	'SHIPPED',
	'DELIVERED',
	'CANCELLED',
] as const
type OrderStatus = (typeof STATUSES)[number]
const STATUS_LABELS: Record<string, string> = {
	PENDING: 'Ожидает',
	PAID: 'Оплачен',
	SHIPPED: 'Отправлен',
	DELIVERED: 'Доставлен',
	CANCELLED: 'Отменён',
}

export default function OrdersClient() {
	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

	const { data, refetch } = trpc.orders.getAllOrders.useQuery({
		page,
		limit: 20,
		status: statusFilter || undefined,
	})
	const updateStatusMut = trpc.orders.updateStatus.useMutation({
		onSuccess: () => refetch(),
	})

	return (
		<div className='space-y-6'>
			<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
				Заказы
			</h1>

			{/* Filters */}
			<div className='flex gap-2'>
				<select
					value={statusFilter}
					onChange={e => setStatusFilter(e.target.value as OrderStatus | '')}
					className='input-field max-w-xs'
				>
					<option value=''>Все статусы</option>
					{STATUSES.map(s => (
						<option key={s} value={s}>
							{STATUS_LABELS[s]}
						</option>
					))}
				</select>
			</div>

			{/* Table */}
			<div className='overflow-x-auto rounded-xl border border-border'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border bg-muted/30 text-left text-muted-foreground'>
							<th className='px-4 py-3 font-medium'>ID</th>
							<th className='px-4 py-3 font-medium'>Клиент</th>
							<th className='px-4 py-3 font-medium'>Товары</th>
							<th className='px-4 py-3 font-medium'>Сумма</th>
							<th className='px-4 py-3 font-medium'>Статус</th>
							<th className='px-4 py-3 font-medium'>Дата</th>
						</tr>
					</thead>
					<tbody>
						{data?.items.map(order => (
							<tr key={order.id} className='border-b border-border/50'>
								<td className='px-4 py-3 font-mono text-xs'>
									{order.id.slice(0, 8)}
								</td>
								<td className='px-4 py-3'>
									{order.user?.name ?? order.user?.email}
								</td>
								<td className='px-4 py-3 text-muted-foreground'>
									{order.items.length} шт.
								</td>
								<td className='px-4 py-3'>
									{order.total.toLocaleString('ru-RU')} ₽
								</td>
								<td className='px-4 py-3'>
									<select
										value={order.status}
										onChange={e =>
											updateStatusMut.mutate({
												id: order.id,
												status: e.target.value as OrderStatus,
											})
										}
										className='rounded border border-border bg-background px-2 py-1 text-xs'
									>
										{STATUSES.map(s => (
											<option key={s} value={s}>
												{STATUS_LABELS[s]}
											</option>
										))}
									</select>
								</td>
								<td className='px-4 py-3 text-muted-foreground'>
									{new Date(order.createdAt).toLocaleDateString('ru-RU')}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{data && data.totalPages > 1 && (
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={page <= 1}
						onClick={() => setPage(p => p - 1)}
					>
						Назад
					</Button>
					<span className='text-sm text-muted-foreground'>
						{page} / {data.totalPages}
					</span>
					<Button
						variant='outline'
						size='sm'
						disabled={page >= data.totalPages}
						onClick={() => setPage(p => p + 1)}
					>
						Вперед
					</Button>
				</div>
			)}
		</div>
	)
}

