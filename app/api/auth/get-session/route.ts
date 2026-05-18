import { NextResponse } from 'next/server'
import { getSessionFromRequestHeaders } from '@/lib/auth/request-auth'
import { getAllowedOrigin } from '@/lib/config/origins'

function getCorsOrigin(req: Request): string {
	return getAllowedOrigin(req.headers.get('origin'))
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
	const session = await getSessionFromRequestHeaders(req.headers)
	return withCors(NextResponse.json(session ?? null), getCorsOrigin(req))
}

