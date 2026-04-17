import { auth } from '@/lib/auth/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const handlers = toNextJsHandler(auth)

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
	res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
	res.headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-session-token, cookie')
	return res
}

async function ensureOrigin(req: Request) {
	const headers = new Headers(req.headers)
	if (!headers.get('origin')) {
		// Electron renderer (file://) often sends no Origin. better-auth rejects that.
		headers.set('origin', new URL(req.url).origin)
	}

	// Avoid `new Request(req, ...)` for compatibility with Next's Request implementation.
	const method = req.method.toUpperCase()
	if (method === 'GET' || method === 'HEAD') {
		return new Request(req.url, { method, headers })
	}

	const body = await req.arrayBuffer()
	return new Request(req.url, {
		method,
		headers,
		body,
		duplex: 'half',
	} as RequestInit)
}

export async function OPTIONS(req: Request) {
	const origin = getCorsOrigin(req)
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': origin || '',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
			...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
			'Access-Control-Max-Age': '86400',
		},
	})
}

export async function GET(req: Request) {
	return withCors(await handlers.GET(await ensureOrigin(req)), getCorsOrigin(req))
}

export async function POST(req: Request) {
	return withCors(await handlers.POST(await ensureOrigin(req)), getCorsOrigin(req))
}
