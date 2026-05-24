import { NextResponse } from 'next/server'
import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
	answerTelegramCallbackQuery,
	editTelegramOrderMessage,
	getTelegramWebhookSecret,
	isTelegramUserAllowed,
} from '@/lib/telegram/service'

type TelegramWebhookBody = {
	callback_query?: {
		id: string
		data?: string
		from: {
			id: number
			username?: string
		}
		message?: {
			message_id: number
			chat: {
				id: number | string
			}
		}
	}
}

function getActionFromCallbackData(data: string | undefined) {
	if (!data) {
		return null
	}

	const separatorIndex = data.indexOf(':')
	if (separatorIndex === -1) {
		return null
	}

	const action = data.slice(0, separatorIndex)
	const orderId = data.slice(separatorIndex + 1).trim()
	if (!orderId) {
		return null
	}

	if (action !== 'approve_order' && action !== 'cancel_order') {
		return null
	}

	return { action, orderId }
}

function getActorLabel(username: string | undefined, userId: number) {
	if (username?.trim()) {
		return `@${username.trim()}`
	}
	return `ID ${userId}`
}

export async function POST(request: Request) {
	const secretHeader = request.headers
		.get('x-telegram-bot-api-secret-token')
		?.trim()
	const expectedSecret = getTelegramWebhookSecret()

	if (!secretHeader || !expectedSecret || secretHeader !== expectedSecret) {
		return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
	}

	const body = (await request.json()) as TelegramWebhookBody
	const query = body.callback_query
	if (!query) {
		return NextResponse.json({ ok: true })
	}

	if (!isTelegramUserAllowed(query.from.id)) {
		await answerTelegramCallbackQuery({
			callbackQueryId: query.id,
			text: 'У вас нет прав для управления заказами.',
			showAlert: true,
		})
		return NextResponse.json({ ok: true })
	}

	const actionData = getActionFromCallbackData(query.data)
	if (!actionData || !query.message) {
		await answerTelegramCallbackQuery({
			callbackQueryId: query.id,
			text: 'Некорректные данные действия.',
			showAlert: true,
		})
		return NextResponse.json({ ok: true })
	}

	const nextStatus =
		actionData.action === 'approve_order' ? OrderStatus.PAID : OrderStatus.CANCELLED
	const order = await prisma.order.findUnique({ where: { id: actionData.orderId } })

	if (!order) {
		await answerTelegramCallbackQuery({
			callbackQueryId: query.id,
			text: 'Заказ не найден.',
			showAlert: true,
		})
		return NextResponse.json({ ok: true })
	}

	await prisma.order.update({
		where: { id: actionData.orderId },
		data: { status: nextStatus },
	})

	const actor = getActorLabel(query.from.username, query.from.id)
	const decisionLine =
		nextStatus === OrderStatus.PAID
			? `🟢 Заказ принят администратором ${actor}`
			: `🔴 Заказ отклонён администратором ${actor}`

	await editTelegramOrderMessage({
		orderId: actionData.orderId,
		chatId: query.message.chat.id,
		messageId: query.message.message_id,
		decisionLine,
	})

	await answerTelegramCallbackQuery({
		callbackQueryId: query.id,
		text: nextStatus === OrderStatus.PAID ? 'Заказ принят' : 'Заказ отклонён',
	})

	return NextResponse.json({ ok: true })
}
