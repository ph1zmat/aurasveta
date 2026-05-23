import { config } from 'dotenv'
import * as path from 'path'

// Подгружаем переменные окружения
config({ path: path.resolve(process.cwd(), '.env') })

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL

async function setup() {
	if (!BOT_TOKEN) {
		console.error('Ошибка: Переменная окружения TELEGRAM_BOT_TOKEN не задана!')
		process.exit(1)
	}

	if (!APP_URL) {
		console.error('Ошибка: Переменные NEXT_PUBLIC_APP_URL или NEXT_PUBLIC_BETTER_AUTH_URL не заданы!')
		process.exit(1)
	}

	const webhookUrl = `${APP_URL.replace(/\/$/, '')}/api/telegram/webhook`
	const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`

	console.log(`Инициализация привязки вебхука...`)
	console.log(`Target Webhook URL: ${webhookUrl}`)
	if (WEBHOOK_SECRET) {
		console.log(`Secret Token: установлен`)
	} else {
		console.log(`Secret Token: НЕ установлен (рекомендуется для безопасности!)`)
	}

	try {
		const response = await fetch(telegramUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				url: webhookUrl,
				secret_token: WEBHOOK_SECRET || undefined,
				allowed_updates: ['callback_query'], // Подписываемся только на обработку интерактивных кнопок
			}),
		})

		const result = await response.json()
		if (response.ok && result.ok) {
			console.log('✅ Вебхук Telegram успешно зарегистрирован!')
			console.log('Ответ Telegram API:', result)
		} else {
			console.error('❌ Ошибка при регистрации вебхука!')
			console.error('Код состояния:', response.status)
			console.error('Ответ Telegram API:', result)
		}
	} catch (error) {
		console.error('❌ Исключение при выполнении запроса:', error)
	}
}

setup()
