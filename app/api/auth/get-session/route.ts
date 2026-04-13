import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

function withCors(res: Response) {
	const headers = new Headers(res.headers)
	headers.set('Access-Control-Allow-Origin', '*')
	headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
	headers.set(
		'Access-Control-Allow-Headers',
		'content-type, authorization, x-session-token',
	)
	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers,
	})
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
		},
	})
}

export async function GET(req: Request) {
	// Better-auth SDKs call /api/auth/get-session; make it explicit.
	// (Catch-all handlers sometimes don't resolve this path as expected in this project setup.)
	const session = await auth.api.getSession({ headers: req.headers })
	return withCors(NextResponse.json(session ?? null))
}

