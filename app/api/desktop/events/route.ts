import { adminEventBus } from '@/lib/realtime/adminevents'
import { NextResponse } from 'next/server'
import {
	getCmsRoleForUserId,
	getSessionFromRequestHeaders,
} from '@/lib/auth/request-auth'

function encodeSseEvent(eventName: string, data: unknown) {
	return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
}

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: Request) {
	try {
		const session = await getSessionFromRequestHeaders(request.headers)
		if (!session?.user) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		// Role guard (ADMIN/EDITOR)
		const role = await getCmsRoleForUserId(session.user.id)
		if (!role) {
			return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders() })
		}

		let cleanup: (() => void) | null = null

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				const encoder = new TextEncoder()
				controller.enqueue(encoder.encode(encodeSseEvent('ping', { type: 'ping', ts: new Date().toISOString() })))

				cleanup = adminEventBus.subscribe((evt) => {
					controller.enqueue(encoder.encode(encodeSseEvent(evt.type, evt)))
				})

				const interval = setInterval(() => {
					controller.enqueue(encoder.encode(encodeSseEvent('ping', { type: 'ping', ts: new Date().toISOString() })))
				}, 25_000)

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
				...corsHeaders(),
				'Content-Type': 'text/event-stream; charset=utf-8',
				'Cache-Control': 'no-cache, no-transform',
				Connection: 'keep-alive',
			},
		})
	} catch {
		return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500, headers: corsHeaders() })
	}
}

