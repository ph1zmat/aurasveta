import { Order, OrderItem, Product } from '@prisma/client'

// Расширенный тип заказа, как он возвращается в adminOrderInclude из orders.ts
export interface TelegramOrderWithItems extends Order {
	user: {
		name: string | null
		email: string | null
	}
	items: (OrderItem & {
		product: {
			id: string
			name: string
			slug: string
			category: {
				id: string
				name: string
				slug: string
			} | null
		}
	})[]
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

/**
 * Экранирует спецсимволы для HTML разметки Telegram
 */
function escapeHtml(text: string | null | undefined): string {
	if (!text) return ''
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Форматирует HTML сообщение для отправки в Telegram
 */
export function formatOrderMessage(order: TelegramOrderWithItems): string {
	const orderShortId = order.id.slice(-6).toUpperCase()
	const dateStr = new Date(order.createdAt).toLocaleString('ru-RU', {
		timeZone: 'Europe/Minsk',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})

	const clientName = escapeHtml(order.user?.name || 'Гость')
	const clientEmail = escapeHtml(order.user?.email || 'Не указан')
	const clientPhone = escapeHtml(order.phone || 'Не указан')
	const contactMethod = order.contactMethod === 'VIBER' ? 'VIBER' : 'Телефон'
	const address = escapeHtml(order.address || 'Самовывоз / Не указан')
	const comment = escapeHtml(order.comment || 'Отсутствует')

	let itemsHtml = ''
	order.items.forEach((item, index) => {
		const productPrice = item.price
		const itemSum = productPrice * item.quantity
		itemsHtml += `${index + 1}. <b>${escapeHtml(item.product.name)}</b>\n`
		itemsHtml += `   ${item.quantity} шт. x ${productPrice} Br = <b>${itemSum}</b> Br\n`
	})

	return `📦 <b>Новый заказ #${orderShortId}</b>
📅 <b>Дата:</b> ${dateStr}

👤 <b>Клиент:</b> ${clientName} (${clientEmail})
📞 <b>Телефон:</b> ${clientPhone} [${contactMethod}]
📍 <b>Адрес доставки:</b> ${address}
💬 <b>Комментарий:</b> ${comment}

🛒 <b>Содержимое заказа:</b>
${itemsHtml}
💰 <b>Итого к оплате:</b> <b>${order.total}</b> Br`
}

/**
 * Отправляет уведомление о новом заказе в указанный Telegram-чат
 */
export async function sendOrderNotification(order: TelegramOrderWithItems): Promise<{ success: boolean; messageId?: number; error?: string }> {
	if (!BOT_TOKEN || !CHAT_ID) {
		console.warn('[Telegram Service] Пропущена отправка: не настроены TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID')
		return { success: false, error: 'Config missing' }
	}

	const text = formatOrderMessage(order)
	const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

	const inlineKeyboard = {
		inline_keyboard: [
			[
				{ text: '🟢 Принять', callback_data: `approve_order:${order.id}` },
				{ text: '🔴 Отклонить', callback_data: `cancel_order:${order.id}` },
			],
		],
	}

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: CHAT_ID,
				text,
				parse_mode: 'HTML',
				reply_markup: inlineKeyboard,
			}),
		})

		const data = await res.json()
		if (!res.ok || !data.ok) {
			return {
				success: false,
				error: data.description || `HTTP Error ${res.status}`,
			}
		}

		return { success: true, messageId: data.result.message_id }
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		}
	}
}

/**
 * Редактирует ранее отправленное сообщение, убирая кнопки и добавляя финальный статус
 */
export async function editMessageAfterAction(
	chatId: number | string,
	messageId: number,
	originalText: string,
	statusText: string
): Promise<boolean> {
	if (!BOT_TOKEN) return false

	const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`
	const updatedText = `${originalText}\n\n📝 <b>Статус заказа:</b>\n${statusText}`

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				message_id: messageId,
				text: updatedText,
				parse_mode: 'HTML',
				reply_markup: { inline_keyboard: [] }, // Очищаем клавиатуру
			}),
		})

		const data = await res.json()
		return res.ok && data.ok
	} catch (err) {
		console.error('[Telegram Service] Ошибка при обновлении сообщения:', err)
		return false
	}
}
