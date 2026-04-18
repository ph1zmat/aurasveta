'use client'

import { useCallback, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'

export default function AdminNotificationsClient() {
	const lastOrderIdRef = useRef<string | null>(null)
	const sseConnectedRef = useRef(false)

	const showNotification = useCallback(
		(title: string, body: string, data?: Record<string, string>) => {
			if (!('Notification' in window)) return
			if (Notification.permission !== 'granted') return
			new Notification(title, { body, data })
		},
		[],
	)

	// Fallback: polling (даже если push не работает)
	const { data: latestOrders } = trpc.orders.getAllOrders.useQuery(
		{ page: 1, limit: 1 },
		{ refetchInterval: 30_000 },
	)

	useEffect(() => {
		const latestOrder = latestOrders?.items?.[0] as
			| { id: string; total: number }
			| undefined
		if (!latestOrder?.id) return

		if (lastOrderIdRef.current === null) {
			lastOrderIdRef.current = latestOrder.id
			return
		}

		if (latestOrder.id !== lastOrderIdRef.current) {
			lastOrderIdRef.current = latestOrder.id
			showNotification(
				'Новый заказ',
				`Заказ #${String(latestOrder.id).slice(-6)} на сумму ${latestOrder.total?.toLocaleString?.('ru-RU') ?? latestOrder.total} ₽`,
				{ orderId: latestOrder.id, type: 'new_order' },
			)
		}
	}, [latestOrders, showNotification])

	// SSE: мгновенные события в открытой CMS (быстрее polling)
	useEffect(() => {
		const es = new EventSource('/api/admin/events')

		function handleOrderCreated(ev: MessageEvent) {
			try {
				const data = JSON.parse(ev.data) as { orderId?: string; total?: number }
				if (!data?.orderId) return
				sseConnectedRef.current = true
				showNotification(
					'Новый заказ',
					`Заказ #${String(data.orderId).slice(-6)} на сумму ${typeof data.total === 'number' ? data.total.toLocaleString('ru-RU') : (data.total ?? '')} ₽`,
					{ orderId: data.orderId, type: 'new_order' },
				)
			} catch {
				// ignore
			}
		}

		es.addEventListener('order.created', handleOrderCreated as EventListener)
		es.addEventListener('ping', () => {
			sseConnectedRef.current = true
		})
		es.onerror = () => {
			// keep polling fallback; SSE may be blocked by proxy/network
			sseConnectedRef.current = false
		}

		return () => {
			es.close()
		}
	}, [showNotification])

	return null
}
