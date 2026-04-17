import { auth } from '@/lib/auth/auth'
import { adminEventBus } from '@/lib/realtime/admin-events'
import { NextResponse } from 'next/server'

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

function getTokenFromRequest(request: Request): string | null {
	const authHeader = request.headers.get('authorization')
	const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
	if (bearer) return bearer
	const xToken = request.headers.get('x-session-token')?.trim()
	if (xToken) return xToken
	// Cookie-based auth (web app) — support both plain and __Secure- prefixed cookie names
	const cookie = request.headers.get('cookie')
	if (cookie) {
		const match =
			cookie.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/) ??
			cookie.match(/better-auth%2Esession_token=([^;]+)/)
		if (match?.[1]) return decodeURIComponent(match[1])
	}
	return null
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: Request) {
	try {
		const token = getTokenFromRequest(request)
		if (!token) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		const authHeaders = new Headers()
		authHeaders.set('cookie', `better-auth.session_token=${token}`)
		const session = await auth.api.getSession({ headers: authHeaders })
		if (!session?.user) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		const testOrderId = `test-${Date.now()}`
		adminEventBus.publish({
			type: 'order.created',
			orderId: testOrderId,
			total: 1234,
			createdAt: new Date().toISOString(),
		})

		return NextResponse.json(
			{ ok: true, orderId: testOrderId },
			{ headers: corsHeaders() },
		)
	} catch {
		return NextResponse.json(
			{ error: 'INTERNAL_SERVER_ERROR' },
			{ status: 500, headers: corsHeaders() },
		)
	}
}
