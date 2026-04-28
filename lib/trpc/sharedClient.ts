import {
	httpBatchLink,
	httpBatchStreamLink,
	type HTTPHeaders,
} from '@trpc/client'
import superjson from 'superjson'

import type { AppRouter } from './routers/_app'

interface CreateTrpcLinkOptions {
	url: string
	mode?: 'stream' | 'batch'
	maxURLLength?: number
	getHeaders?: () => HTTPHeaders | Promise<HTTPHeaders>
	fetch?: typeof globalThis.fetch
}

/**
 * Общая фабрика link-конфигурации tRPC для web, desktop и mobile.
 */
export function createTrpcLinks({
	url,
	mode = 'batch',
	maxURLLength = 2048,
	getHeaders,
	fetch,
}: CreateTrpcLinkOptions) {
	if (mode === 'stream') {
		return [
			httpBatchStreamLink<AppRouter>({
				url,
				transformer: superjson,
				maxURLLength,
				headers: getHeaders,
				fetch,
			}),
		]
	}

	return [
		httpBatchLink<AppRouter>({
			url,
			transformer: superjson,
			headers: getHeaders,
			fetch,
		}),
	]
}

export function resolveWebTrpcUrl() {
	const base = (() => {
		if (typeof window !== 'undefined') return ''
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
		return 'http://localhost:3000'
	})()

	return `${base}/api/trpc`
}
