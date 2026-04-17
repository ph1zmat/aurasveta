import { NextResponse } from 'next/server'
import { requireCmsAccess } from '@/lib/auth/auth-utils'
import { adminEventBus } from '@/lib/realtime/admin-events'

function encodeSseEvent(eventName: string, data: unknown) {
	// SSE format: event: <name>\n data: <json>\n\n
	return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request) {
	// Auth guard (ADMIN/EDITOR)
	await requireCmsAccess()

	let cleanup: (() => void) | null = null

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const encoder = new TextEncoder()

			// initial ping so proxies open the stream
			controller.enqueue(encoder.encode(encodeSseEvent('ping', { type: 'ping', ts: new Date().toISOString() })))

			cleanup = adminEventBus.subscribe((evt) => {
				const eventName = evt.type
				controller.enqueue(encoder.encode(encodeSseEvent(eventName, evt)))
			})

			// keepalive
			const interval = setInterval(() => {
				controller.enqueue(encoder.encode(encodeSseEvent('ping', { type: 'ping', ts: new Date().toISOString() })))
			}, 25_000)

			// when client disconnects
			request.signal.addEventListener('abort', () => {
				clearInterval(interval)
				cleanup?.()
				controller.close()
			})
		},
		cancel() {
			cleanup?.()
		},
	})

	return new NextResponse(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
		},
	})
}

