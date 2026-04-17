/* global self */

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    try {
      payload = { body: event.data ? event.data.text() : '' }
    } catch {
      payload = {}
    }
  }

  const title = payload.title || 'Уведомление'
  const body = payload.body || ''
  const data = payload.data || {}

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification?.data || {}
  const orderId = data.orderId

  const url = orderId ? `/admin/orders?orderId=${encodeURIComponent(orderId)}` : '/admin/orders'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus()
          return client.navigate(url)
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    }),
  )
})

