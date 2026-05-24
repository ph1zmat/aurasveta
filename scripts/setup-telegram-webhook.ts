import 'dotenv/config'

type SetWebhookResponse = {
	ok: boolean
	description?: string
	result?: boolean
}

function normalizeBaseUrl(value: string) {
	return value.trim().replace(/\/+$/, '')
}

async function main() {
	const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
	const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
	const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

	if (!token) {
		throw new Error('TELEGRAM_BOT_TOKEN не задан')
	}
	if (!secret) {
		throw new Error('TELEGRAM_WEBHOOK_SECRET не задан')
	}
	if (!appUrl) {
		throw new Error('NEXT_PUBLIC_APP_URL не задан')
	}

	const webhookUrl = `${normalizeBaseUrl(appUrl)}/api/telegram/webhook`
	const endpoint = `https://api.telegram.org/bot${token}/setWebhook`

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			url: webhookUrl,
			secret_token: secret,
			allowed_updates: ['callback_query'],
		}),
	})

	const data = (await response.json()) as SetWebhookResponse

	if (!response.ok || !data.ok) {
		throw new Error(data.description ?? `Ошибка setWebhook (${response.status})`)
	}

	console.log('✅ Telegram webhook установлен')
	console.log(`Webhook URL: ${webhookUrl}`)
}

main().catch(error => {
	console.error('❌ Не удалось установить webhook:', error)
	process.exit(1)
})
