import { auth } from '@/lib/auth/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse } from 'next/server'

const handlers = toNextJsHandler(auth)

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

function extractSessionTokenFromSetCookie(setCookie: string | null): string | null {
	if (!setCookie) return null
	// Take the first cookie only (it’s the one we need)
	const first = setCookie.split(',')[0]
	const match = first.match(/better-auth\.session_token=([^;]+)/)
	return match?.[1] ?? null
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(req: Request) {
	try {
		// Call better-auth handler on the canonical /api/auth/* path,
		// then return the full session cookie value in JSON for desktop.
		const url = new URL(req.url)
		const targetUrl = new URL('/api/auth/sign-in/email', url.origin)

		const body = await req.arrayBuffer()
		const headers = new Headers(req.headers)
		if (!headers.get('origin')) headers.set('origin', url.origin)

		const forwardReq = new Request(targetUrl.toString(), {
			method: 'POST',
			headers,
			body,
			duplex: 'half',
		} as RequestInit)

		const res = await handlers.POST(forwardReq)
		const text = await res.text()

		let json: unknown = null
		try {
			json = text ? JSON.parse(text) : null
		} catch {
			// ignore
		}

		// 1. Try extracting from set-cookie header (full token incl. signature)
		const cookieToken = extractSessionTokenFromSetCookie(res.headers.get('set-cookie'))

		// 2. Fallback: try getSetCookie() method (more reliable for multiple Set-Cookie headers)
		let cookieTokenAlt: string | null = null
		if (!cookieToken && typeof (res.headers as Record<string, unknown>).getSetCookie === 'function') {
			const cookies = (res.headers as unknown as { getSetCookie(): string[] }).getSetCookie()
			for (const c of cookies) {
				const match = c.match(/better-auth\.session_token=([^;]+)/)
				if (match?.[1]) {
					cookieTokenAlt = match[1]
					break
				}
			}
		}

		// 3. Fallback: extract session token from response body
		const bodyToken =
			(json as Record<string, unknown> | null) &&
			typeof json === 'object'
				? ((json as Record<string, Record<string, unknown>>)?.session?.token as string | undefined) ?? null
				: null

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

