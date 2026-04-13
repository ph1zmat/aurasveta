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

	const sessionToken = extractSessionTokenFromSetCookie(res.headers.get('set-cookie'))

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
}

