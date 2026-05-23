import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { editMessageAfterAction } from '@/lib/telegram/telegramservice'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const ALLOWED_USER_IDS = (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
	.split(',')
	.map(id => id.trim())
	.filter(Boolean)

/**
 * Отправляет ответ на callback_query, чтобы убрать спиннер загрузки на кнопке у пользователя
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
	if (!BOT_TOKEN) return
	try {
		await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				callback_query_id: callbackQueryId,
				text,
				show_alert: showAlert,
			}),
		})
	} catch (err) {
		console.error('[Telegram Webhook] Ошибка ответа на CallbackQuery:', err)
	}
}

export async function POST(req: NextRequest) {
	// 1. Безопасность: Проверка секретного токена вебхука
	if (WEBHOOK_SECRET) {
		const incomingSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
		if (incomingSecret !== WEBHOOK_SECRET) {
			return new NextResponse('Forbidden: Invalid secret token', { status: 403 })
		}
	}

	try {
		const payload = await req.json()

		// Нам интересны только нажатия на Callback-кнопки
		if (!payload.callback_query) {
			return NextResponse.json({ ok: true })
		}

		const callbackQuery = payload.callback_query
		const callbackQueryId = callbackQuery.id
		const fromUser = callbackQuery.from
		const fromUserId = String(fromUser.id)
		const fromUsername = fromUser.username ? `@${fromUser.username}` : `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim() || `ID ${fromUserId}`
		const message = callbackQuery.message
		const chatId = message?.chat?.id
		const messageId = message?.message_id
		const callbackData = callbackQuery.data as string

		// 2. Безопасность: Проверка прав пользователя Telegram
		if (ALLOWED_USER_IDS.length > 0 && !ALLOWED_USER_IDS.includes(fromUserId)) {
			await answerCallbackQuery(
				callbackQueryId,
				'🛑 У вас нет прав для управления заказами в этой системе.',
				true
			)
			return NextResponse.json({ ok: true })
		}

		if (!callbackData || !messageId || !chatId) {
			await answerCallbackQuery(callbackQueryId, '✖️ Некорректный запрос.')
			return NextResponse.json({ ok: true })
		}

		const [action, orderId] = callbackData.split(':')
		if (!orderId || (action !== 'approve_order' && action !== 'cancel_order')) {
			await answerCallbackQuery(callbackQueryId, '✖️ Неизвестное действие.')
			return NextResponse.json({ ok: true })
		}

		// 3. Обработка действия с заказом в базе данных
		const order = await prisma.order.findUnique({
			where: { id: orderId },
		})

		if (!order) {
			await answerCallbackQuery(callbackQueryId, '🛑 Заказ не найден в базе данных.', true)
			return NextResponse.json({ ok: true })
		}

		// Если заказ уже обработан (статус отличный от PENDING)
		if (order.status !== 'PENDING') {
			await answerCallbackQuery(callbackQueryId, `⚠️ Этот заказ уже находится в статусе: ${order.status}`, true)
			// Убираем кнопки, чтобы не вводить в заблуждение
			await editMessageAfterAction(
				chatId,
				messageId,
				message.text || '',
				`⚠️ Обработан ранее. Текущий статус: ${order.status}`
			)
			return NextResponse.json({ ok: true })
		}

		let statusText = ''
		let newStatus: 'PAID' | 'CANCELLED'

		if (action === 'approve_order') {
			newStatus = 'PAID'
			statusText = `🟢 <b>Принят</b> администратором ${fromUsername}`
		} else {
			newStatus = 'CANCELLED'
			statusText = `🔴 <b>Отклонен</b> администратором ${fromUsername}`
		}

		// Обновляем статус заказа в базе данных
		await prisma.order.update({
			where: { id: orderId },
			data: { status: newStatus },
		})

		// 4. Отредактировать сообщение в канале, убрав кнопки
		const cleanedText = message.text || ''
		await editMessageAfterAction(chatId, messageId, cleanedText, statusText)

		// Подтверждаем клик всплывающим уведомлением в Telegram
		await answerCallbackQuery(
			callbackQueryId,
			action === 'approve_order' ? '✅ Заказ успешно подтвержден!' : '❌ Заказ отменен.'
		)

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error('[Telegram Webhook Error]:', error)
		return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
	}
}
