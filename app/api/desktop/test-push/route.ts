import { adminEventBus } from '@/lib/realtime/adminevents'
import { NextResponse } from 'next/server'
import {
	getCmsRoleForUserId,
	getSessionFromRequestHeaders,
} from '@/lib/auth/request-auth'
import { sendPushToAdmins, type PushDeliveryDiagnostic } from '@/lib/push/send'

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

function getDiagnosticMessage(diagnostics: PushDeliveryDiagnostic[]) {
	if (diagnostics.includes('NO_ACTIVE_DEVICES')) {
		return 'Нет активных push-устройств для администраторов или редакторов.'
	}

	if (diagnostics.includes('MISSING_VAPID_KEYS')) {
		return 'Не настроены VAPID-ключи для Web Push.'
	}

	if (diagnostics.includes('MISSING_FIREBASE_SERVER_KEY')) {
		return 'Не настроен FIREBASE_SERVER_KEY для FCM/Expo push.'
	}

	if (diagnostics.includes('WEB_PUSH_PACKAGE_UNAVAILABLE')) {
		return 'Пакет web-push недоступен в серверной среде.'
	}

	if (diagnostics.includes('MISSING_WEB_PUSH_SUBSCRIPTION_DETAILS')) {
		return 'В push-устройствах есть неполные Web Push подписки.'
	}

	return 'Тестовый push не был доставлен ни на одно устройство.'
}

export async function POST(request: Request) {
	try {
		const session = await getSessionFromRequestHeaders(request.headers)
		if (!session?.user) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		const role = await getCmsRoleForUserId(session.user.id)
		if (!role) {
			return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders() })
		}

		const testOrderId = `test-${Date.now()}`
		const pushResult = await sendPushToAdmins({
			title: 'Тестовый push',
			body: `Проверка push-уведомлений для CMS (#${testOrderId.slice(-6)})`,
			data: {
				type: 'test_push',
				orderId: testOrderId,
			},
		})

		adminEventBus.publish({
			type: 'order.created',
			orderId: testOrderId,
			total: 1234,
			createdAt: new Date().toISOString(),
		})

		if (pushResult.sent === 0) {
			return NextResponse.json(
				{
					error: 'PUSH_NOT_DELIVERED',
					message: getDiagnosticMessage(pushResult.diagnostics),
					result: pushResult,
					orderId: testOrderId,
				},
				{ status: 409, headers: corsHeaders() },
			)
		}

		return NextResponse.json(
			{
				ok: true,
				message:
					pushResult.sent === 1
						? 'Тестовый push доставлен на 1 устройство.'
						: `Тестовый push доставлен на ${pushResult.sent} устройств.`,
				result: pushResult,
				orderId: testOrderId,
			},
			{ headers: corsHeaders() },
		)
	} catch {
		return NextResponse.json(
			{ error: 'INTERNAL_SERVER_ERROR' },
			{ status: 500, headers: corsHeaders() },
		)
	}
}
