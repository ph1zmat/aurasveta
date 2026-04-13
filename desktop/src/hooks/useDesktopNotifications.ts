import { useEffect, useRef, useCallback } from 'react'
import { trpc } from '../lib/trpc'

/**
 * Простой механизм polling для уведомлений в Electron.
 * Каждые 30 секунд проверяет последние заказы и показывает системное уведомление
 * если появились новые (по сравнению с предыдущим запросом).
 */
export function useDesktopNotifications() {
  const lastOrderIdRef = useRef<string | null>(null)
  const { data } = trpc.orders.getAllOrders.useQuery(
    { page: 1, limit: 1 },
    { refetchInterval: 30_000 }, // опрос каждые 30 секунд
  )

  const showNotification = useCallback((title: string, body: string, data?: Record<string, string>) => {
    if (window.electronAPI) {
      window.electronAPI.notification.show(title, body, data)
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }, [])

  useEffect(() => {
    if (!data?.items?.length) return

    const latestOrder = data.items[0] as any
    if (!latestOrder) return

    // При первой загрузке — запоминаем без уведомления
    if (lastOrderIdRef.current === null) {
      lastOrderIdRef.current = latestOrder.id
      return
    }

    // Новый заказ
    if (latestOrder.id !== lastOrderIdRef.current) {
      lastOrderIdRef.current = latestOrder.id
      showNotification(
        'Новый заказ',
        `Заказ #${latestOrder.id.slice(-6)} на сумму ${latestOrder.total?.toLocaleString('ru-RU')} ₽`,
        { orderId: latestOrder.id, type: 'new_order' },
      )
    }
  }, [data, showNotification])

  // Запрос разрешения на нотификации в браузере (fallback)
  useEffect(() => {
    if (!window.electronAPI && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}
