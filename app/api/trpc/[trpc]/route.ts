import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/lib/trpc/init'
import { appRouter } from '@/lib/trpc/routers/_app'

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

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: () => createTRPCContext({ headers: req.headers }),
	})

export async function OPTIONS(req: Request) {
	const origin = getCorsOrigin(req)
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': origin || '',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token, cookie',
			...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
			'Access-Control-Max-Age': '86400',
		},
	})
}

export async function GET(req: Request) {
	return withCors(await handler(req), getCorsOrigin(req))
}

export async function POST(req: Request) {
	return withCors(await handler(req), getCorsOrigin(req))
}
