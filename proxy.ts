import type { NextRequest } from 'next/server'
import { proxy as libProxy } from '@/lib/middleware/proxy'

export function proxy(request: NextRequest) {
	return libProxy(request)
}

export const config = {
	matcher: [
		/*
		 * Применяем proxy ко всем маршрутам:
		 * - WWW → non-www редирект
		 * - Security headers
		 * - Rate limiting для /api/*
		 * - Защита /admin/* и редиректы /login, /register
		 *
		 * Исключаем статику и системные файлы Next.js
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|.*\\.woff2?$).*)',
	],
}
