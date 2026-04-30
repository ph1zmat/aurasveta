'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ShoppingCart, Package, AlertCircle, CheckCheck } from 'lucide-react'

type NotificationItem = {
	id: string
	type: 'order' | 'system'
	title: string
	desc: string
	createdAt: string
	unread: boolean
}

function getIcon(type: string) {
	if (type === 'order') return <ShoppingCart className='h-5 w-5' />
	return <Package className='h-5 w-5' />
}

function getColor(type: string) {
	if (type === 'order') return 'bg-success/15 text-success'
	return 'bg-info/15 text-info'
}

const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_BASE_DELAY = 2000

export default function NotificationsClient() {
	const [activeFilter, setActiveFilter] = useState('all')
	const reconnectAttempts = useRef(0)
	const eventSourceRef = useRef<EventSource | null>(null)

	const filterType = activeFilter === 'all' ? 'all' : (activeFilter as 'order' | 'system')
	const utils = trpc.useUtils()
	const { data: rawItems, isLoading, error, refetch } = trpc.notifications.list.useQuery({ type: filterType, limit: 100 })
	const { mutate: createFromEvent } = trpc.notifications.createFromEvent.useMutation({
		onSuccess: () => {
			void refetch()
			void utils.notifications.countUnread.invalidate()
		},
	})
	const { mutate: markReadMut } = trpc.notifications.markRead.useMutation({
		onSuccess: () => {
			void refetch()
			void utils.notifications.countUnread.invalidate()
		},
	})
	const { mutate: markAllReadMut } = trpc.notifications.markAllRead.useMutation({
		onSuccess: () => {
			toast.success('Все уведомления прочитаны')
			void refetch()
			void utils.notifications.countUnread.invalidate()
		},
		onError: (e) => toast.error(e.message),
	})
	const { mutate: clearAllMut } = trpc.notifications.clearAll.useMutation({
		onSuccess: () => {
			toast.success('Уведомления очищены')
			void refetch()
			void utils.notifications.countUnread.invalidate()
		},
		onError: (e) => toast.error(e.message),
	})

	const items: NotificationItem[] =
		rawItems?.map((n) => ({
			id: n.id,
			type: n.type as 'order' | 'system',
			title: n.title,
			desc: n.desc,
			createdAt: n.createdAt.toISOString(),
			unread: !n.isRead,
		})) ?? []

	/** Подключение SSE с exponential backoff и reconnect при возврате на вкладку */
	const connectSSE = useCallback(() => {
		if (typeof window === 'undefined') return
		if (eventSourceRef.current) {
			eventSourceRef.current.close()
		}

		const source = new EventSource('/api/admin/events')
		eventSourceRef.current = source

		source.addEventListener('order.created', (evt) => {
			try {
				const data = JSON.parse(evt.data)
				createFromEvent({
					type: 'order',
					title: 'Новый заказ',
					desc: `Заказ #${data.orderId?.slice(-6) ?? '??????'}` + (data.total ? ` на ₽${data.total}` : ''),
					meta: data,
				})
				toast.success('Новый заказ')
				reconnectAttempts.current = 0
			} catch { /* ignore */ }
		})

		source.onerror = () => {
			source.close()
			eventSourceRef.current = null
			if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
				reconnectAttempts.current++
				const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current - 1)
				setTimeout(connectSSE, delay)
			} else {
				toast.error('Потеряно соединение с сервером уведомлений')
			}
		}
	}, [createFromEvent])

	useEffect(() => {
		connectSSE()

		const handleVisibility = () => {
			if (document.visibilityState === 'visible') {
				reconnectAttempts.current = 0
				connectSSE()
				void refetch()
			}
		}
		document.addEventListener('visibilitychange', handleVisibility)

		return () => {
			document.removeEventListener('visibilitychange', handleVisibility)
			eventSourceRef.current?.close()
			eventSourceRef.current = null
		}
	}, [connectSSE, refetch])

	const filtered = activeFilter === 'all' ? items : items.filter((n) => n.type === activeFilter)
	const unreadCount = items.filter((n) => n.unread).length

	const markAllRead = () => {
		markAllReadMut()
	}

	const markRead = (id: string) => {
		markReadMut({ id })
	}

	const clearAll = () => {
		clearAllMut()
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Уведомления</h1>
					<p className='text-sm text-muted-foreground'>
						{unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={markAllRead} disabled={unreadCount === 0}>
						<CheckCheck className='h-4 w-4 mr-1' />
						Прочитать все
					</Button>
					<Button variant='ghost' size='sm' onClick={clearAll} disabled={items.length === 0}>
						Очистить
					</Button>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4'>
				<Card className='border-border h-fit'>
					<CardHeader>
						<CardTitle className='text-base font-bold'>Фильтры</CardTitle>
					</CardHeader>
					<CardContent className='space-y-1'>
						{[
							{ id: 'all', label: 'Все', count: items.length },
							{ id: 'order', label: 'Заказы', count: items.filter((n) => n.type === 'order').length },
							{ id: 'system', label: 'Система', count: items.filter((n) => n.type === 'system').length },
						].map((f) => (
							<div
								key={f.id}
								className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors
									${activeFilter === f.id ? 'bg-accent/10 text-accent' : 'hover:bg-secondary text-muted-foreground'}
								`}
								onClick={() => setActiveFilter(f.id)}
							>
								<span className='flex-1 text-sm'>{f.label}</span>
								<Badge className='text-[10px]'>{f.count}</Badge>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className='border-border'>
					<CardContent className='p-0'>
						{isLoading && (
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
						)}
						{error && (
							<div className='p-4 flex items-center justify-between gap-3'>
								<span className='text-sm text-destructive'>Ошибка загрузки: {error.message}</span>
								<Button variant='outline' size='sm' onClick={() => void refetch()}>Повторить</Button>
							</div>
						)}
						{!isLoading && filtered.map((n) => (
							<div
								key={n.id}
								className={`flex gap-3 p-4 border-b border-border cursor-pointer transition-colors
									${n.unread ? 'bg-accent/5' : 'hover:bg-secondary/30'}
								`}
								onClick={() => markRead(n.id)}
							>
								<div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${getColor(n.type)}`}>
									{getIcon(n.type)}
								</div>
								<div className='flex-1 min-w-0'>
									<div className='text-sm font-medium'>{n.title}</div>
									<div className='text-xs text-muted-foreground'>{n.desc}</div>
								</div>
								<div className='flex flex-col items-end gap-1'>
									<span className='text-xs text-muted-foreground'>
										{new Date(n.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
									</span>
									{n.unread && <span className='h-2 w-2 rounded-full bg-accent' />}
								</div>
							</div>
						))}
						{!isLoading && filtered.length === 0 && (
							<div className='text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2'>
								<AlertCircle className='h-8 w-8 text-muted-foreground/50' />
								Нет уведомлений
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
