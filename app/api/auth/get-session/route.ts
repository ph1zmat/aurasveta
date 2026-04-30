import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { ALLOWED_ORIGINS } from '@/lib/cors'

function getCorsOrigin(req: Request): string {
	const origin = req.headers.get('origin') ?? ''
	return ALLOWED_ORIGINS.includes(origin) ? origin : ''
}

function withCors(res: Response, origin: string) {
	if (origin) {
		res.headers.set('Access-Control-Allow-Origin', origin)
		res.headers.set('Access-Control-Allow-Credentials', 'true')
	}
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
	res.headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-session-token, cookie')
	res.headers.set('Vary', 'Origin')
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

