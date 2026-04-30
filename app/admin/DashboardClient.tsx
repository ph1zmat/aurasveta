'use client'

import { useState, useMemo, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import {
	DollarSign,
	ShoppingCart,
	Users,
	TrendingUp,
	TrendingDown,
	BarChart3,
	Download,
	ChevronDown,
	Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { OrderEditorModal } from '@/features/admin/order-editor'
import { toast } from 'sonner'
import Image from 'next/image'
import { CardGridSkeleton, TableSkeleton } from './components/AdminSkeleton'
import { statusLabels, statusColors } from '@/shared/admin/order-status'

// Tiny SVG sparkline from an array of values
function Sparkline({ values, color = '#c66a2b', ariaLabel }: { values: number[]; color?: string; ariaLabel?: string }) {
	const w = 80
	const h = 32
	if (!values || values.length < 2) return <div style={{ width: w, height: h }} />
	const min = Math.min(...values)
	const max = Math.max(...values)
	const range = max - min || 1
	const pts = values.map((v, i) => {
		const x = (i / (values.length - 1)) * w
		const y = h - ((v - min) / range) * (h - 4) - 2
		return `${x},${y}`
	})
	const pathD = 'M' + pts.join(' L')
	const fillD = pathD + ` L${w},${h} L0,${h} Z`
	return (
		<svg
			width={w}
			height={h}
			viewBox={`0 0 ${w} ${h}`}
			fill='none'
			role='img'
			aria-label={ariaLabel || 'График тренда'}
		>
			<defs>
				<linearGradient id={`sg-${color.replace('#', '')}`} x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor={color} stopOpacity={0.3} />
					<stop offset='100%' stopColor={color} stopOpacity={0} />
				</linearGradient>
			</defs>
			<path d={fillD} fill={`url(#sg-${color.replace('#', '')})`} />
			<path d={pathD} stroke={color} strokeWidth={2} strokeLinejoin='round' strokeLinecap='round' />
		</svg>
	)
}

const PERIOD_OPTIONS = [
	{ label: 'Сегодня', days: 1 },
	{ label: '7 дней', days: 7 },
	{ label: '30 дней', days: 30 },
	{ label: '90 дней', days: 90 },
	{ label: 'Год', days: 365 },
]

export default function DashboardClient() {
	const [chartDays, setChartDays] = useState(30)
	const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[2])
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
	const [lastUpdated, setLastUpdated] = useState(() => {
		const d = new Date()
		return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
	})

	const { data: stats, isLoading: statsLoading } = trpc.admin.getStatsWithTrends.useQuery()
	const { data: topProducts, isLoading: topLoading } = trpc.admin.getTopProducts.useQuery({ limit: 5 })
	const { data: revenueData, isLoading: revenueLoading } = trpc.admin.getRevenueChart.useQuery({ days: chartDays })
	const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } =
		trpc.orders.getAllOrders.useQuery({ page: 1, limit: 8 })
	const { refetch: refetchExport } = trpc.admin.exportProducts.useQuery('csv', { enabled: false })

	// Обновляем время при получении новых данных
	useEffect(() => {
		if (stats || recentOrders) {
			setLastUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
		}
	}, [stats, recentOrders])

	const chartData = useMemo(
		() =>
			(revenueData ?? []).map((d) => ({
				date: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
				revenue: d.revenue,
			})),
		[revenueData],
	)

	const handleExportReport = async () => {
		const result = await refetchExport()
		if (result.data?.data) {
			const blob = new Blob([result.data.data], { type: 'text/csv;charset=utf-8;' })
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `report-${new Date().toISOString().slice(0, 10)}.csv`
			link.click()
			URL.revokeObjectURL(link.href)
			toast.success('Отчёт выгружен')
		}
	}

	const averageOrderValue = stats && stats.totalOrders > 0
		? stats.totalRevenue / stats.totalOrders
		: 0

	const kpiCards = [
		{
			label: 'Выручка',
			value: stats?.totalRevenue ?? 0,
			format: (v: number) =>
				new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v),
			icon: DollarSign,
			iconColor: 'text-accent bg-accent/15',
			trend: stats?.revenueTrend ?? 0,
			sparkline: stats?.sparklineRevenue ?? [],
			sparkColor: '#c66a2b',
			ariaLabel: 'Тренд выручки',
		},
		{
			label: 'Заказы',
			value: stats?.totalOrders ?? 0,
			icon: ShoppingCart,
			iconColor: 'text-info bg-info/15',
			trend: stats?.ordersTrend ?? 0,
			sparkline: stats?.sparklineOrders ?? [],
			sparkColor: '#3b82f6',
			ariaLabel: 'Тренд заказов',
		},
		{
			label: 'Пользователи',
			value: stats?.totalUsers ?? 0,
			icon: Users,
			iconColor: 'text-success bg-success/15',
			trend: stats?.usersTrend ?? 0,
			sparkline: stats?.sparklineUsers ?? [],
			sparkColor: '#22c55e',
			ariaLabel: 'Тренд пользователей',
		},
		{
			label: 'Средний чек',
			value: averageOrderValue,
			format: (v: number) =>
				new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v),
			icon: BarChart3,
			iconColor: 'text-warning bg-warning/15',
			trend: stats?.revenueTrend ?? 0,
			sparkline: (stats?.sparklineRevenue ?? []).map((v) => v / Math.max(1, stats?.totalOrders ?? 1)),
			sparkColor: '#f59e0b',
			ariaLabel: 'Тренд среднего чека',
		},
	]

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4'>
				<div>
					<h1 className='text-xl font-bold'>Обзор магазина</h1>
					<p className='text-sm text-muted-foreground'>
						Последнее обновление: сегодня в {lastUpdated}
					</p>
				</div>
				<div className='flex items-center gap-2 shrink-0'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' size='sm' className='gap-2'>
								<Calendar className='h-4 w-4' />
								{selectedPeriod.label}
								<ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							{PERIOD_OPTIONS.map((opt) => (
								<DropdownMenuItem
									key={opt.days}
									onClick={() => {
										setSelectedPeriod(opt)
										setChartDays(opt.days)
									}}
									className={selectedPeriod.days === opt.days ? 'text-accent font-medium' : ''}
								>
									{opt.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button size='sm' onClick={handleExportReport} className='gap-2'>
						<Download className='h-4 w-4' />
						Отчёт
					</Button>
				</div>
			</div>

			{/* KPI Grid */}
			{statsLoading ? (
				<CardGridSkeleton count={4} />
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
					{kpiCards.map((kpi) => (
						<Card
							key={kpi.label}
							className='border-border bg-card hover:shadow-sm transition-all hover:-translate-y-0.5'
						>
							<CardContent className='p-5'>
								<div className='flex items-center justify-between mb-3'>
									<span className='text-sm font-medium text-muted-foreground'>
										{kpi.label}
									</span>
									<div className={`flex h-9 w-9 items-center justify-center rounded-md ${kpi.iconColor}`}>
										<kpi.icon className='h-5 w-5' />
									</div>
								</div>
								<div className='flex items-end justify-between gap-2'>
									<div>
										<div className='text-2xl font-extrabold tracking-tight'>
											{kpi.format ? kpi.format(kpi.value) : kpi.value.toLocaleString('ru-RU')}
										</div>
										<div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${kpi.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
											{kpi.trend >= 0
												? <TrendingUp className='h-3 w-3' />
												: <TrendingDown className='h-3 w-3' />
											}
											{kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
											<span className='text-muted-foreground font-normal'>vs прошлый месяц</span>
										</div>
									</div>
									<div className='shrink-0'>
										<Sparkline values={kpi.sparkline} color={kpi.sparkColor} ariaLabel={kpi.ariaLabel} />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Revenue chart + Top products */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				{/* Revenue chart */}
				<Card className='border-border bg-card'>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-base font-bold'>Выручка по дням</CardTitle>
						<div className='flex gap-1'>
							{[7, 30, 90].map((d) => (
								<Button
									key={d}
									variant={chartDays === d ? 'default' : 'ghost'}
									size='sm'
									className='h-7 px-2.5 text-xs'
									onClick={() => setChartDays(d)}
								>
									{d}д
								</Button>
							))}
						</div>
					</CardHeader>
					<CardContent>
						<div className='h-[220px] w-full'>
							{revenueLoading ? (
								<div className='h-full w-full animate-pulse bg-muted/40 rounded-md' />
							) : (
								<ResponsiveContainer width='100%' height='100%'>
									<AreaChart data={chartData}>
										<defs>
											<linearGradient id='dashRevGrad' x1='0' y1='0' x2='0' y2='1'>
												<stop offset='0%' stopColor='#c66a2b' stopOpacity={0.25} />
												<stop offset='100%' stopColor='#c66a2b' stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
										<XAxis
											dataKey='date'
											tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
											axisLine={{ stroke: 'var(--border)' }}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
											axisLine={{ stroke: 'var(--border)' }}
											tickLine={false}
											tickFormatter={(v) =>
												new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 0 }).format(v as number)
											}
										/>
										<Tooltip
											contentStyle={{
												background: 'var(--card)',
												border: '1px solid var(--border)',
												borderRadius: '12px',
												fontSize: '12px',
											}}
											formatter={(value: unknown) =>
												new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value as number)
											}
										/>
										<Area
											type='monotone'
											dataKey='revenue'
											stroke='#c66a2b'
											strokeWidth={2}
											fill='url(#dashRevGrad)'
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Top products */}
				<Card className='border-border bg-card'>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-base font-bold'>Топ товары</CardTitle>
						<Button variant='ghost' size='sm' asChild className='text-xs'>
							<Link href='/admin/products'>Все товары →</Link>
						</Button>
					</CardHeader>
					<CardContent className='p-0'>
						{topLoading ? (
							<div className='p-5 space-y-3'>
								{Array.from({ length: 5 }).map((_, i) => (
									<div key={i} className='flex items-center gap-3'>
										<div className='h-10 w-10 rounded-md bg-muted/40 animate-pulse' />
										<div className='flex-1 space-y-1'>
											<div className='h-4 w-3/4 bg-muted/40 animate-pulse rounded' />
											<div className='h-3 w-1/2 bg-muted/40 animate-pulse rounded' />
										</div>
									</div>
								))}
							</div>
						) : (
							<table className='w-full text-sm'>
								<tbody>
									{(topProducts ?? []).map((tp, i) => (
										<tr
											key={tp.productId}
											className='border-t border-border hover:bg-secondary/50 transition-colors cursor-pointer'
										>
											<td className='py-3 pl-5 pr-3'>
												<div className='flex items-center gap-3'>
													<div className='h-10 w-10 rounded-md bg-secondary border border-border overflow-hidden shrink-0'>
														{tp.product?.images?.[0]?.url ? (
															<Image
																src={tp.product.images[0].url}
																alt={tp.product.name ?? ''}
																width={40}
																height={40}
																className='h-full w-full object-cover'
															/>
														) : (
															<div className='h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs font-bold'>
																{i + 1}
															</div>
														)}
													</div>
													<div className='min-w-0'>
														<div className='font-medium truncate'>{tp.product?.name ?? tp.productId}</div>
														<div className='text-xs text-muted-foreground truncate'>
															{tp.product?.category?.name ?? tp.product?.brand ?? '—'}
														</div>
													</div>
												</div>
											</td>
											<td className='py-3 pr-5 text-right whitespace-nowrap'>
												<div className='font-bold'>
													{tp.product?.price
														? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(tp.product.price)
														: '—'}
												</div>
												<div className='text-xs text-muted-foreground'>{tp.salesCount} продаж</div>
											</td>
										</tr>
									))}
									{(!topProducts || topProducts.length === 0) && (
										<tr>
											<td colSpan={2} className='p-8 text-center text-muted-foreground text-sm'>
												Нет данных
											</td>
										</tr>
									)}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent orders */}
				<Card className='border-border bg-card'>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-base font-bold'>Последние заказы</CardTitle>
						<Button variant='ghost' size='sm' asChild className='text-xs'>
							<Link href='/admin/orders'>Все заказы →</Link>
						</Button>
					</CardHeader>
					<CardContent className='p-0'>
						{ordersLoading ? (
							<TableSkeleton rows={5} columns={6} />
						) : (
							<table className='w-full text-sm'>
								<thead>
									<tr className='border-b border-border'>
										<th className='py-3 pl-5 text-left text-xs font-semibold text-muted-foreground'>Заказ</th>
										<th className='py-3 px-4 text-left text-xs font-semibold text-muted-foreground'>Клиент</th>
										<th className='py-3 px-4 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell'>Товары</th>
										<th className='py-3 px-4 text-right text-xs font-semibold text-muted-foreground'>Сумма</th>
										<th className='py-3 px-4 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell'>Статус</th>
										<th className='py-3 pr-5 text-right text-xs font-semibold text-muted-foreground hidden lg:table-cell'>Время</th>
									</tr>
								</thead>
								<tbody>
									{(recentOrders?.items ?? []).map((order) => {
										const initials = order.user?.name
											? order.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
											: '??'
										const timeAgo = (() => {
											const diff = Date.now() - new Date(order.createdAt).getTime()
											const mins = Math.floor(diff / 60000)
											if (mins < 60) return `${mins} мин назад`
											const hrs = Math.floor(mins / 60)
											if (hrs < 24) return `${hrs} ч назад`
											return `${Math.floor(hrs / 24)} дн назад`
										})()
										return (
											<tr
												key={order.id}
												className='border-t border-border hover:bg-secondary/50 transition-colors cursor-pointer'
												onClick={() => setSelectedOrderId(order.id)}
											>
												<td className='py-3 pl-5 font-mono text-xs text-accent font-semibold'>
													#{order.id.slice(-6).toUpperCase()}
												</td>
												<td className='py-3 px-4'>
													<div className='flex items-center gap-2'>
														<div className='h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold shrink-0'>
															{initials}
														</div>
														<span className='truncate max-w-[120px]'>{order.user?.name ?? 'Гость'}</span>
													</div>
												</td>
												<td className='py-3 px-4 text-muted-foreground hidden sm:table-cell'>
													{order.items?.length ?? 0} {order.items?.length === 1 ? 'товар' : 'товара'}
												</td>
												<td className='py-3 px-4 text-right font-bold whitespace-nowrap'>
													₽ {order.total.toLocaleString('ru-RU')}
												</td>
												<td className='py-3 px-4 hidden md:table-cell'>
													<Badge className={`text-[10px] border ${statusColors[order.status] ?? 'bg-secondary'}`} variant='outline'>
														{statusLabels[order.status] ?? order.status}
													</Badge>
												</td>
												<td className='py-3 pr-5 text-right text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap'>
													{timeAgo}
												</td>
											</tr>
										)
										})}
										{(!recentOrders?.items || recentOrders.items.length === 0) && (
											<tr>
												<td colSpan={6} className='p-8 text-center text-muted-foreground text-sm'>
													Нет заказов
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>

					{selectedOrderId && (
						<OrderEditorModal
							orderId={selectedOrderId}
							onClose={() => setSelectedOrderId(null)}
							onUpdated={() => {
								void refetchOrders()
								setSelectedOrderId(null)
							}}
						/>
					)}
				</div>
				)
}
