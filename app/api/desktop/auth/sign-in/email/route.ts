import { auth } from '@/lib/auth/auth'
import { normalizeRequestAuthHeaders } from '@/lib/auth/request-auth'
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

function extractSessionTokenFromResponseHeaders(headers: Headers): string | null {
	return (
		readString(headers.get('set-auth-token')) ??
		extractSessionTokenFromSetCookie(headers.get('set-cookie'))
	)
}

function readString(value: unknown): string | null {
	return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function extractTokenFromPayload(json: unknown): string | null {
	if (!json || typeof json !== 'object') return null
	const payload = json as Record<string, unknown>

	const tokenFromTopLevel = readString(payload.token)
	if (tokenFromTopLevel) return tokenFromTopLevel

	const session = payload.session
	if (session && typeof session === 'object') {
		const tokenFromSession = readString(
			(session as Record<string, unknown>).token,
		)
		if (tokenFromSession) return tokenFromSession
	}

	const nestedData = payload.data
	if (nestedData && typeof nestedData === 'object') {
		const nestedToken = extractTokenFromPayload(nestedData)
		if (nestedToken) return nestedToken
	}

	return null
}

function extractErrorFromPayload(json: unknown): {
	code: string | null
	message: string | null
} {
	if (!json || typeof json !== 'object') {
		return { code: null, message: null }
	}

	const payload = json as Record<string, unknown>
	const code =
		readString(payload.code) ??
		(payload.error && typeof payload.error === 'object'
			? readString((payload.error as Record<string, unknown>).code)
			: null)

	const message =
		readString(payload.message) ??
		(payload.error && typeof payload.error === 'object'
			? readString((payload.error as Record<string, unknown>).message)
			: null)

	if (code || message) {
		return { code, message }
	}

	const nestedData = payload.data
	if (nestedData && typeof nestedData === 'object') {
		return extractErrorFromPayload(nestedData)
	}

	return { code: null, message: null }
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(req: Request) {
	try {
		const requestBody = (await req.json().catch(() => null)) as
			| {
				email?: unknown
				password?: unknown
				callbackURL?: unknown
				rememberMe?: unknown
			  }
			| null

		const email = readString(requestBody?.email)
		const password = readString(requestBody?.password)
		const callbackURL = readString(requestBody?.callbackURL) ?? undefined
		const rememberMe =
			typeof requestBody?.rememberMe === 'boolean'
				? requestBody.rememberMe
				: undefined

		if (!email || !password) {
			return NextResponse.json(
				{
					ok: false,
					status: 400,
					data: {
						code: 'INVALID_REQUEST',
						message: 'Не переданы e-mail и пароль',
					},
					sessionToken: null,
				},
				{ status: 400, headers: corsHeaders() },
			)
		}

		const url = new URL(req.url)
		const authHeaders = normalizeRequestAuthHeaders(req.headers)
		authHeaders.set('accept', 'application/json')
		if (!authHeaders.get('origin')) {
			authHeaders.set('origin', url.origin)
		}

		const res = await auth.api.signInEmail({
			body: {
				email,
				password,
				callbackURL,
				rememberMe,
			},
			headers: authHeaders,
			asResponse: true,
		})
		const text = await res.text()

		let json: unknown = null
		try {
			json = text ? JSON.parse(text) : null
		} catch {
			// ignore
		}

		// 1. Try extracting signed token from response headers exposed by bearer plugin.
		const headerToken = extractSessionTokenFromResponseHeaders(res.headers)

		// 2. Fallback: extract token from response body.
		const bodyToken = extractTokenFromPayload(json)
		const extractedError = extractErrorFromPayload(json)

		const sessionToken = headerToken || bodyToken
		const normalizedData =
			json && typeof json === 'object'
				? {
					...(json as Record<string, unknown>),
					code: extractedError.code,
					message: extractedError.message,
				}
				: {
					code: extractedError.code,
					message: extractedError.message,
				}

		return NextResponse.json(
			{
				ok: res.ok,
				status: res.status,
				data: normalizedData,
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
