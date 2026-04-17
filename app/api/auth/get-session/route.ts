import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = new Set([
	'http://localhost:3000',
	'http://localhost:5173',
	'http://localhost:8081',
	'http://127.0.0.1:5173',
	'http://127.0.0.1:8081',
	'https://aurasveta.ru',
])

function getCorsOrigin(req: Request): string {
	const origin = req.headers.get('origin') ?? ''
	return ALLOWED_ORIGINS.has(origin) ? origin : ''
}

function withCors(res: Response, origin: string) {
	if (origin) {
		res.headers.set('Access-Control-Allow-Origin', origin)
		res.headers.set('Access-Control-Allow-Credentials', 'true')
	}
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
	res.headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-session-token, cookie')
	return res
}

export async function OPTIONS(req: Request) {
	const origin = getCorsOrigin(req)
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': origin || '',
			'Access-Control-Allow-Methods': 'GET,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
			...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
		},
	})
}

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers })
	return withCors(NextResponse.json(session ?? null), getCorsOrigin(req))
}

