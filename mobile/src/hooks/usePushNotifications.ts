import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useNavigation } from '@react-navigation/native'
import { trpc } from '../lib/trpc'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushNotifications() {
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()
  const registerMut = trpc.push.register.useMutation()
  const navigation = useNavigation<any>()

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        registerMut.mutate({
          platform: 'FCM',
          token,
        })
      }
    })

    // Слушатель входящих уведомлений
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Received:', notification)
    })

    // Клик по уведомлению — навигация к заказу
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      if (data?.orderId && data?.order) {
        navigation.navigate('OrdersTab', {
          screen: 'OrderDetail',
          params: { order: data.order },
        })
      } else if (data?.orderId) {
        // Минимальная навигация если полный order не передан
        navigation.navigate('OrdersTab', {
          screen: 'OrdersList',
        })
      }
    })

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])
}

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted')
    return null
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync()
    return tokenData.data
  } catch (err) {
    // Попытка получить FCM токен напрямую
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync()
      return tokenData.data as string
    } catch {
      console.error('[Push] Failed to get push token:', err)
      return null
    }
  }
}
