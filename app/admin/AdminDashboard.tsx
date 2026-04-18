'use client'

import { trpc } from '@/lib/trpc/client'
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'

export default function AdminDashboard() {
	const { data: stats } = trpc.admin.getStats.useQuery()
	const { data: chartData } = trpc.admin.getRevenueChart.useQuery({ days: 30 })

	const cards = [
		{
			label: 'Товары',
			value: stats?.totalProducts ?? 0,
			icon: Package,
		},
		{
			label: 'Заказы',
			value: stats?.totalOrders ?? 0,
			icon: ShoppingCart,
		},
		{
			label: 'Пользователи',
			value: stats?.totalUsers ?? 0,
			icon: Users,
		},
		{
			label: 'Выручка',
			value: `${(stats?.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽`,
			icon: TrendingUp,
		},
	]

	return (
		<div className='space-y-8'>
			<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
				Главная
			</h1>

			{/* Stat cards */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{cards.map(card => (
					<div
						key={card.label}
						className='rounded-2xl border border-border bg-muted/30 p-5'
					>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{card.label}
							</span>
							<card.icon
								className='h-5 w-5 text-muted-foreground'
								strokeWidth={1.5}
							/>
						</div>
						<p className='mt-2 text-2xl font-semibold text-foreground'>
							{card.value}
						</p>
					</div>
				))}
			</div>

			{/* Revenue chart */}
			<div className='rounded-2xl border border-border bg-muted/30 p-6'>
				<h2 className='mb-4 text-sm font-semibold uppercase tracking-widest text-foreground'>
					Выручка за 30 дней
				</h2>
				<div className='h-64'>
					{chartData && chartData.length > 0 ? (
						<ResponsiveContainer width='100%' height='100%'>
							<BarChart data={chartData}>
								<CartesianGrid
									strokeDasharray='3 3'
									className='stroke-border'
								/>
								<XAxis
									dataKey='date'
									tick={{ fontSize: 11 }}
									className='fill-muted-foreground'
								/>
								<YAxis
									tick={{ fontSize: 11 }}
									className='fill-muted-foreground'
								/>
								<Tooltip />
								<Bar
									dataKey='revenue'
									fill='hsl(var(--primary))'
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
							Нет данных за выбранный период
						</div>
					)}
				</div>
			</div>

			{/* Recent orders */}
			<div className='rounded-2xl border border-border bg-muted/30 p-6'>
				<h2 className='mb-4 text-sm font-semibold uppercase tracking-widest text-foreground'>
					Последние заказы
				</h2>
				{stats?.recentOrders && stats.recentOrders.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead>
								<tr className='border-b border-border text-left text-muted-foreground'>
									<th className='pb-2 font-medium'>ID</th>
									<th className='pb-2 font-medium'>Клиент</th>
									<th className='pb-2 font-medium'>Сумма</th>
									<th className='pb-2 font-medium'>Статус</th>
									<th className='pb-2 font-medium'>Дата</th>
								</tr>
							</thead>
							<tbody>
								{stats.recentOrders.map(order => (
									<tr key={order.id} className='border-b border-border/50'>
										<td className='py-2 font-mono text-xs'>
											{order.id.slice(0, 8)}
										</td>
										<td className='py-2'>
											{order.user?.name ?? order.user?.email}
										</td>
										<td className='py-2'>
											{order.total.toLocaleString('ru-RU')} ₽
										</td>
										<td className='py-2'>
											<span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
												{order.status}
											</span>
										</td>
										<td className='py-2 text-muted-foreground'>
											{new Date(order.createdAt).toLocaleDateString('ru-RU')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>Заказов пока нет</p>
				)}
			</div>

			{/* Top products */}
			<div className='rounded-2xl border border-border bg-muted/30 p-6'>
				<h2 className='mb-4 text-sm font-semibold uppercase tracking-widest text-foreground'>
					Топ товаров
				</h2>
				{stats?.topProducts && stats.topProducts.length > 0 ? (
					<div className='space-y-3'>
						{stats.topProducts.map(tp => (
							<div
								key={tp.productId}
								className='flex items-center justify-between text-sm'
							>
								<span className='text-foreground'>
									{tp.product?.name ?? tp.productId}
								</span>
								<span className='text-muted-foreground'>
									{tp._sum?.quantity ?? 0} шт.
								</span>
							</div>
						))}
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>Нет данных</p>
				)}
			</div>
		</div>
	)
}
