import { useEffect, useCallback } from 'react'
import { getApiUrl, getToken } from '../lib/store'

/**
 * Простой механизм polling для уведомлений в Electron.
 * Каждые 30 секунд проверяет последние заказы и показывает системное уведомление
 * если появились новые (по сравнению с предыдущим запросом).
 */
export function useDesktopNotifications() {
  const isElectron = Boolean(window.electronAPI)

  const showNotification = useCallback((title: string, body: string, data?: Record<string, string>) => {
    if (window.electronAPI) {
      window.electronAPI.notification.show(title, body, data)
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }, [])

  // Realtime: SSE stream from backend (works in Electron app)
  useEffect(() => {
    if (isElectron) return

    let cancelled = false
    let abort: AbortController | null = null

    async function connect() {
      const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
      const token = await getToken()
      if (!token) return

      abort = new AbortController()
      const res = await fetch(`${apiUrl}/api/desktop/events`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abort.signal,
      })

      if (!res.ok || !res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!cancelled) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // parse SSE frames separated by \n\n
        let idx: number
        // eslint-disable-next-line no-cond-assign
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const raw = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)

          const lines = raw.split('\n').map(l => l.trimEnd())
          let eventName = ''
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim()
            if (line.startsWith('data:')) dataStr += line.slice('data:'.length).trim()
          }

          if (eventName === 'order.created') {
            try {
              const payload = JSON.parse(dataStr) as { orderId?: string; total?: number }
              if (!payload?.orderId) continue
              showNotification(
                'Новый заказ',
                `Заказ #${String(payload.orderId).slice(-6)} на сумму ${typeof payload.total === 'number' ? payload.total.toLocaleString('ru-RU') : payload.total ?? ''} ₽`,
                { orderId: payload.orderId, type: 'new_order' },
              )
            } catch {
              // ignore
            }
          }
        }
      }
    }

    connect().catch(() => {
      // Keep polling fallback
    })

    return () => {
      cancelled = true
      abort?.abort()
    }
  }, [isElectron, showNotification])

  // Запрос разрешения на нотификации в браузере (fallback)
  useEffect(() => {
    if (!isElectron && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [isElectron])
}
