import { NextResponse } from 'next/server'

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers':
			'content-type, authorization, x-session-token',
	}
}

function extractSessionTokenFromSetCookie(
	setCookie: string | null,
): string | null {
	if (!setCookie) return null
	const match = setCookie.match(/better-auth\.session_token=([^;]+)/)
	return match?.[1] ?? null
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(req: Request) {
	try {
		// Проксируем в canonical better-auth endpoint, чтобы desktop и web
		// проходили один и тот же путь аутентификации.
		const url = new URL(req.url)
		const targetUrl = new URL('/api/auth/sign-in/email', url.origin)

		const bodyText = await req.text()
		const forwardHeaders = new Headers()
		forwardHeaders.set('content-type', req.headers.get('content-type') ?? 'application/json')
		forwardHeaders.set('accept', 'application/json')
		forwardHeaders.set('origin', req.headers.get('origin') ?? url.origin)

		const res = await fetch(targetUrl.toString(), {
			method: 'POST',
			headers: forwardHeaders,
			body: bodyText,
		} as RequestInit)
		const text = await res.text()

		let json: unknown = null
		try {
			json = text ? JSON.parse(text) : null
		} catch {
			// ignore
		}

		// 1. Try extracting from set-cookie header (full token incl. signature)
		const cookieToken = extractSessionTokenFromSetCookie(
			res.headers.get('set-cookie'),
		)

		// 2. Fallback: try getSetCookie() method (more reliable for multiple Set-Cookie headers)
		let cookieTokenAlt: string | null = null
		if (
			!cookieToken &&
			typeof (res.headers as unknown as Record<string, unknown>)
				.getSetCookie === 'function'
		) {
			const cookies = (
				res.headers as unknown as { getSetCookie(): string[] }
			).getSetCookie()
			for (const c of cookies) {
				const match = c.match(/better-auth\.session_token=([^;]+)/)
				if (match?.[1]) {
					cookieTokenAlt = match[1]
					break
				}
			}
		}

		// 3. Fallback: extract session token from response body
		const bodyToken = (() => {
			if (!json || typeof json !== 'object') return null
			const payload = json as Record<string, unknown>

			const tokenFromTopLevel = payload.token
			if (typeof tokenFromTopLevel === 'string' && tokenFromTopLevel.length > 0) {
				return tokenFromTopLevel
			}

			const session = payload.session as Record<string, unknown> | undefined
			const tokenFromSession = session?.token
			if (typeof tokenFromSession === 'string' && tokenFromSession.length > 0) {
				return tokenFromSession
			}

			return null
		})()

		const sessionToken = cookieToken || cookieTokenAlt || bodyToken

		return NextResponse.json(
			{
				ok: res.ok,
				status: res.status,
				data: json,
				sessionToken,
			},
			{
				status: res.ok ? 200 : res.status,
				headers: corsHeaders(),
			},
		)
	} catch {
		return NextResponse.json(
			{ ok: false, status: 500, message: 'INTERNAL_SERVER_ERROR' },
			{ status: 500, headers: corsHeaders() },
		)
	}
}
