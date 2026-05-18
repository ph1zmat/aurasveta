import { prisma } from '@/lib/prisma'
import type { PushPlatform } from '@prisma/client'

interface PushPayload {
	title: string
	body: string
	data?: Record<string, string>
}

export type PushDeliveryDiagnostic =
	| 'NO_ACTIVE_DEVICES'
	| 'MISSING_FIREBASE_SERVER_KEY'
	| 'MISSING_VAPID_KEYS'
	| 'WEB_PUSH_PACKAGE_UNAVAILABLE'
	| 'MISSING_WEB_PUSH_SUBSCRIPTION_DETAILS'

type PushSendOutcome =
	| { status: 'sent' }
	| { status: 'skipped'; diagnostic: PushDeliveryDiagnostic }

export interface PushSendResult {
	sent: number
	failed: number
	skipped: number
	totalDevices: number
	deactivatedDevices: number
	diagnostics: PushDeliveryDiagnostic[]
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

	if (devices.length === 0) {
		return {
			sent: 0,
			failed: 0,
			skipped: 0,
			totalDevices: 0,
			deactivatedDevices: 0,
			diagnostics: ['NO_ACTIVE_DEVICES'],
		} satisfies PushSendResult
	}

	const results = await Promise.allSettled(
		devices.map(device => sendToDevice(device, payload)),
	)

	// Деактивировать устройства с ошибками (невалидный токен)
	const failedDeviceIds: string[] = []
	const diagnostics = new Set<PushDeliveryDiagnostic>()
	let sent = 0
	let failed = 0
	let skipped = 0

	results.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			if (result.value.status === 'sent') {
				sent++
				return
			}

			skipped++
			diagnostics.add(result.value.diagnostic)
			return
		}

		failed++

		if (result.status === 'rejected') {
			const reason = String(result.reason)
			if (
				reason.includes('NotRegistered') ||
				reason.includes('InvalidRegistration') ||
				reason.includes('DeviceNotRegistered') ||
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
		sent,
		failed,
		skipped,
		totalDevices: devices.length,
		deactivatedDevices: failedDeviceIds.length,
		diagnostics: [...diagnostics],
	} satisfies PushSendResult
}

async function sendToDevice(
	device: {
		platform: PushPlatform
		token: string
		endpoint: string | null
		p256dh: string | null
		authKey: string | null
	},
	payload: PushPayload,
): Promise<PushSendOutcome> {
	if (device.platform === 'FCM') {
		return sendFCM(device.token, payload)
	} else if (device.platform === 'WEB_PUSH') {
		if (!device.endpoint || !device.p256dh || !device.authKey) {
			return {
				status: 'skipped',
				diagnostic: 'MISSING_WEB_PUSH_SUBSCRIPTION_DETAILS',
			}
		}
		return sendWebPush(
			{
				endpoint: device.endpoint,
				keys: { p256dh: device.p256dh, auth: device.authKey },
			},
			payload,
		)
	}

	return {
		status: 'skipped',
		diagnostic: 'NO_ACTIVE_DEVICES',
	}
}

async function sendFCM(token: string, payload: PushPayload) {
	// Expo Push tokens are NOT FCM tokens. Detect and route accordingly.
	if (isExpoPushToken(token)) {
		await sendExpoPush(token, payload)
		return { status: 'sent' } satisfies PushSendOutcome
	}

	// Firebase Admin SDK — если установлен firebase-admin
	// Fallback: HTTP v1 API
	const serverKey = process.env.FIREBASE_SERVER_KEY

	if (!serverKey) {
		console.warn('[Push] FIREBASE_SERVER_KEY не настроен, FCM пропущен')
		return {
			status: 'skipped',
			diagnostic: 'MISSING_FIREBASE_SERVER_KEY',
		} satisfies PushSendOutcome
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

	await response.json().catch(() => null)
	return { status: 'sent' } satisfies PushSendOutcome
}

function isExpoPushToken(token: string) {
	return (
		token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
	)
}

async function sendExpoPush(token: string, payload: PushPayload) {
	const response = await fetch('https://exp.host/--/api/v2/push/send', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Accept-Encoding': 'gzip, deflate',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			to: token,
			title: payload.title,
			body: payload.body,
			data: payload.data ?? {},
			sound: 'default',
			priority: 'high',
		}),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`Expo push error: ${response.status} ${text}`)
	}

	const json = (await response.json().catch(() => null)) as {
		data?: { status?: string; message?: string; details?: unknown }
	} | null
	const ticket = json?.data
	if (ticket?.status === 'error') {
		// Typical details: "DeviceNotRegistered"
		const details = ticket?.details ? JSON.stringify(ticket.details) : ''
		throw new Error(
			`Expo push ticket error: ${ticket.message || 'unknown'} ${details}`.trim(),
		)
	}

	return json
}

async function sendWebPush(
	subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
	payload: PushPayload,
	): Promise<PushSendOutcome> {
	// Используем web-push, если установлен
	let webpush: typeof import('web-push')
	try {
		webpush = await import('web-push')
	} catch {
		console.warn('[Push] web-push не установлен, Web Push пропущен')
		return {
			status: 'skipped',
			diagnostic: 'WEB_PUSH_PACKAGE_UNAVAILABLE',
		} satisfies PushSendOutcome
	}

	const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
	const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
	const vapidSubject =
		process.env.VAPID_SUBJECT || 'mailto:admin@aurasveta.ru'

	if (!vapidPublicKey || !vapidPrivateKey) {
		console.warn('[Push] VAPID ключи не настроены, Web Push пропущен')
		return {
			status: 'skipped',
			diagnostic: 'MISSING_VAPID_KEYS',
		} satisfies PushSendOutcome
	}

	webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
	await webpush.sendNotification(subscription, JSON.stringify(payload))
	return { status: 'sent' } satisfies PushSendOutcome
}

