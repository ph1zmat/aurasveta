import { NextResponse } from 'next/server'
import { getFileUrl } from '@/lib/storage'

/**
 * GET /api/storage/signed-url?key=products/uuid/photo.jpg
 *
 * Генерирует presigned URL для чтения файла из хранилища.
 * Используется клиентами (web, desktop, mobile) для отображения изображений.
 *
 * Ответ кешируется на 55 минут (TTL 1 час − 5 мин запас).
 * Для мобильных устройств в dev-режиме: убедитесь, что NEXT_PUBLIC_APP_URL
 * указывает на доступный хост (для Android-эмулятора: http://10.0.2.2:3000).
 */
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const key = searchParams.get('key')

	// Допускаем только ключи внутри разрешённых префиксов
	if (!key || !/^(products|uploads|public)\//.test(key)) {
		return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
	}

	try {
		const url = await getFileUrl(key)
		return NextResponse.json({ url }, {
			headers: {
				// Кешируем ответ в браузере/CDN на 55 мин
				'Cache-Control': 'public, max-age=3300, stale-while-revalidate=300',
			},
		})
	} catch (err) {
		console.error('signed-url error:', err)
		return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
	}
}
