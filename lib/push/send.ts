import { prisma } from '@/lib/prisma'
import type { PushPlatform } from '@prisma/client'

interface PushPayload {
	title: string
	body: string
	data?: Record<string, string>
}

/**
 * Отправка push-уведомлений всем зарегистрированным устройствам администраторов/редакторов.
 */
export async function sendPushToAdmins(payload: PushPayload) {
	const devices = await prisma.pushDevice.findMany({
		where: {
			active: true,
			user: { role: { in: ['ADMIN', 'EDITOR'] } },
		},
		include: { user: { select: { id: true, role: true } } },
	})

	const results = await Promise.allSettled(
		devices.map(device => sendToDevice(device, payload)),
	)

	// Деактивировать устройства с ошибками (невалидный токен)
	const failedDeviceIds: string[] = []
	results.forEach((result, index) => {
		if (result.status === 'rejected') {
			const reason = String(result.reason)
			if (
				reason.includes('NotRegistered') ||
				reason.includes('InvalidRegistration') ||
				reason.includes('410')
			) {
				failedDeviceIds.push(devices[index].id)
			}
		}
	})

	if (failedDeviceIds.length > 0) {
		await prisma.pushDevice.updateMany({
			where: { id: { in: failedDeviceIds } },
			data: { active: false },
		})
	}

	return {
		sent: results.filter(r => r.status === 'fulfilled').length,
		failed: results.filter(r => r.status === 'rejected').length,
	}
}

async function sendToDevice(
	device: { platform: PushPlatform; token: string; endpoint: string | null; p256dh: string | null; authKey: string | null },
	payload: PushPayload,
) {
	if (device.platform === 'FCM') {
		return sendFCM(device.token, payload)
	} else if (device.platform === 'WEB_PUSH') {
		if (!device.endpoint || !device.p256dh || !device.authKey) {
			throw new Error('Missing Web Push subscription details')
		}
		return sendWebPush(
			{ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.authKey } },
			payload,
		)
	}
}

async function sendFCM(token: string, payload: PushPayload) {
	// Firebase Admin SDK — если установлен firebase-admin
	// Fallback: HTTP v1 API
	const serverKey = process.env.FIREBASE_SERVER_KEY

	if (!serverKey) {
		console.warn('[Push] FIREBASE_SERVER_KEY не настроен, FCM пропущен')
		return
	}

	const response = await fetch('https://fcm.googleapis.com/fcm/send', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `key=${serverKey}`,
		},
		body: JSON.stringify({
			to: token,
			notification: {
				title: payload.title,
				body: payload.body,
			},
			data: payload.data ?? {},
		}),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`FCM error: ${response.status} ${text}`)
	}

	return response.json()
}

async function sendWebPush(
	subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
	payload: PushPayload,
) {
	// Используем web-push, если установлен
	try {
		const webpush = await import('web-push')

		const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
		const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
		const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@aurasveta.ru'

		if (!vapidPublicKey || !vapidPrivateKey) {
			console.warn('[Push] VAPID ключи не настроены, Web Push пропущен')
			return null
		}

		webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

		return webpush.sendNotification(
			subscription,
			JSON.stringify(payload),
		)
	} catch {
		console.warn('[Push] web-push не установлен, Web Push пропущен')
		return null
	}
}
