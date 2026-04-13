import { auth } from '@/lib/auth/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const handlers = toNextJsHandler(auth)

function withCors(res: Response) {
	const headers = new Headers(res.headers)
	headers.set('Access-Control-Allow-Origin', '*')
	headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
	headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-session-token')
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
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

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
		},
	})
}

export async function GET(req: Request) {
	return withCors(await handlers.GET(await ensureOrigin(req)))
}

export async function POST(req: Request) {
	return withCors(await handlers.POST(await ensureOrigin(req)))
}
