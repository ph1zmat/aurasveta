import { auth } from '@/lib/auth/auth'
import { adminEventBus } from '@/lib/realtime/admin-events'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getTokenFromRequestHeaders(headers: Headers): string | null {
	const authHeader = headers.get('authorization')
	const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
	if (bearer) return bearer
	const xToken = headers.get('x-session-token')?.trim()
	return xToken || null
}

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
		const token = getTokenFromRequestHeaders(request.headers)
		if (!token) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		// Validate session using better-auth by injecting cookie
		const headers = new Headers()
		headers.set('cookie', `better-auth.session_token=${token}`)
		const session = await auth.api.getSession({ headers })
		if (!session?.user) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		// Role guard (ADMIN/EDITOR)
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { role: true },
		})
		if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR') {
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

