import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

const TELEGRAM_API_URL = 'https://api.telegram.org'

type TelegramConfig = {
	botToken: string
	chatId: string
	webhookSecret: string
	allowedUserIds: Set<number>
}

type TelegramApiResponse<T = unknown> = {
	ok: boolean
	result?: T
	description?: string
}

type TelegramOrder = {
	id: string
	status: OrderStatus
	total: number
	address: string | null
	phone: string | null
	contactMethod: 'PHONE' | 'VIBER'
	comment: string | null
	createdAt: Date
	user: {
		name: string | null
		email: string | null
	} | null
	items: Array<{
		quantity: number
		price: number
		product: {
			name: string
			slug: string
		}
	}>
}

function getConfig(): TelegramConfig | null {
	const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? ''
	const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? ''
	const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? ''
	const allowedUserIdsRaw = process.env.TELEGRAM_ALLOWED_USER_IDS?.trim() ?? ''

	if (!botToken || !chatId || !webhookSecret) {
		return null
	}

	const allowedUserIds = new Set(
		allowedUserIdsRaw
			.split(',')
			.map(item => Number(item.trim()))
			.filter(item => Number.isInteger(item) && item > 0),
	)

	return { botToken, chatId, webhookSecret, allowedUserIds }
}

async function telegramRequest<T = unknown>(
	method: string,
	payload: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
	const config = getConfig()
	if (!config) {
		return { ok: false, description: 'telegram_config_is_missing' }
	}

	const response = await fetch(`${TELEGRAM_API_URL}/bot${config.botToken}/${method}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	const data = (await response.json()) as TelegramApiResponse<T>
	if (!response.ok || !data.ok) {
		throw new Error(data.description ?? `Telegram API error (${response.status})`)
	}

	return data
}

function formatMoney(value: number) {
	return `${value.toFixed(2)} Br`
}

function escapeHtml(input: string) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

function getContactMethodLabel(method: 'PHONE' | 'VIBER') {
	return method === 'VIBER' ? 'Viber' : 'Телефон'
}

function formatCustomer(order: TelegramOrder) {
	const name = order.user?.name?.trim()
	const email = order.user?.email?.trim()
	if (name && email) {
		return `${name} (${email})`
	}
	return name || email || 'Не указан'
}

function formatOrderMessage(order: TelegramOrder, decisionLine?: string) {
	const lines: string[] = [
		`<b>📦 Заказ #${escapeHtml(order.id.slice(-6).toUpperCase())}</b>`,
		`📅 <b>Дата:</b> ${escapeHtml(order.createdAt.toLocaleString('ru-RU'))}`,
		`👤 <b>Клиент:</b> ${escapeHtml(formatCustomer(order))}`,
		`📞 <b>Телефон:</b> ${escapeHtml(order.phone?.trim() || 'Не указан')}`,
		`☎️ <b>Способ связи:</b> ${escapeHtml(getContactMethodLabel(order.contactMethod))}`,
		`📍 <b>Адрес:</b> ${escapeHtml(order.address?.trim() || 'Не указан')}`,
	]

	if (order.comment?.trim()) {
		lines.push(`💬 <b>Комментарий:</b> ${escapeHtml(order.comment.trim())}`)
	}

	lines.push('', '<b>🛒 Состав заказа:</b>')

	for (const item of order.items) {
		lines.push(
			`• ${escapeHtml(item.product.name)} × ${item.quantity} — ${escapeHtml(formatMoney(item.price * item.quantity))}`,
		)
	}

	lines.push('', `💰 <b>Итого:</b> ${escapeHtml(formatMoney(order.total))}`)

	if (decisionLine) {
		lines.push('', escapeHtml(decisionLine))
	}

	return lines.join('\n')
}

async function getOrderForTelegram(orderId: string): Promise<TelegramOrder | null> {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			user: { select: { name: true, email: true } },
			items: {
				include: {
					product: {
						select: { name: true, slug: true },
					},
				},
			},
		},
	})

	if (!order) {
		return null
	}

	return order as TelegramOrder
}

export function getTelegramWebhookSecret() {
	return getConfig()?.webhookSecret ?? ''
}

export function isTelegramUserAllowed(userId: number) {
	const config = getConfig()
	if (!config) {
		return false
	}
	if (config.allowedUserIds.size === 0) {
		return true
	}
	return config.allowedUserIds.has(userId)
}

export async function sendOrderToTelegram(orderId: string) {
	const config = getConfig()
	if (!config) {
		console.warn('[Telegram] Конфигурация не заполнена, уведомление пропущено')
		return { skipped: true }
	}

	const order = await getOrderForTelegram(orderId)
	if (!order) {
		throw new Error('Заказ не найден для отправки в Telegram')
	}

	return telegramRequest('sendMessage', {
		chat_id: config.chatId,
		text: formatOrderMessage(order),
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: '🟢 Принять',
						callback_data: `approve_order:${order.id}`,
					},
					{
						text: '🔴 Отклонить',
						callback_data: `cancel_order:${order.id}`,
					},
				],
			],
		},
	})
}

export async function answerTelegramCallbackQuery(params: {
	callbackQueryId: string
	text?: string
	showAlert?: boolean
}) {
	return telegramRequest('answerCallbackQuery', {
		callback_query_id: params.callbackQueryId,
		text: params.text,
		show_alert: params.showAlert,
	})
}

export async function editTelegramOrderMessage(params: {
	orderId: string
	chatId: number | string
	messageId: number
	decisionLine: string
}) {
	const order = await getOrderForTelegram(params.orderId)
	if (!order) {
		throw new Error('Заказ не найден для обновления Telegram-сообщения')
	}

	return telegramRequest('editMessageText', {
		chat_id: params.chatId,
		message_id: params.messageId,
		text: formatOrderMessage(order, params.decisionLine),
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [],
		},
	})
}
