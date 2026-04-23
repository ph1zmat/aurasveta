import { NextResponse } from 'next/server'
import { fileExists } from '@/lib/storage'

/**
 * GET /api/storage/health
 *
 * Проверяет доступность объектного хранилища (MinIO / S3).
 * Используется для мониторинга (uptime checks, k8s readiness probe).
 *
 * Ответ 200 { status: "ok" }    — хранилище доступно
 * Ответ 503 { status: "error" } — хранилище недоступно
 */
export async function GET() {
	try {
		// HeadObject к sentinel-ключу: не требует существования файла —
		// проверяем сам факт доступности API хранилища.
		await fileExists('health-check-sentinel.txt')
		return NextResponse.json({ status: 'ok', storage: 'reachable' })
	} catch (err) {
		console.error('Storage health check failed:', err)
		return NextResponse.json(
			{ status: 'error', storage: 'unreachable' },
			{ status: 503 },
		)
	}
}
