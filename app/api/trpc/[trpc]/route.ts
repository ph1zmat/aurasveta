import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/lib/trpc/init'
import { appRouter } from '@/lib/trpc/routers/app'
import { API_CORS_ALLOWED_ORIGINS, getAllowedOrigin } from '@/lib/config/origins'

function getCorsOrigin(req: Request): string {
	return getAllowedOrigin(req.headers.get('origin'), API_CORS_ALLOWED_ORIGINS)
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
