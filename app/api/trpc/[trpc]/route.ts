import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/lib/trpc/init'
import { appRouter } from '@/lib/trpc/routers/_app'

function withCors(res: Response) {
	const headers = new Headers(res.headers)
	headers.set('Access-Control-Allow-Origin', '*')
	headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
	headers.set('Access-Control-Allow-Headers', 'content-type, authorization, x-session-token')
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: () => createTRPCContext({ headers: req.headers }),
	})

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
	return withCors(await handler(req))
}

export async function POST(req: Request) {
	return withCors(await handler(req))
}
