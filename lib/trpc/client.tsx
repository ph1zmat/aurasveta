'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchStreamLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import superjson from 'superjson'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'
import type { inferRouterOutputs } from '@trpc/server'

export type RouterOutputs = inferRouterOutputs<AppRouter>

export const trpc = createTRPCReact<AppRouter>()

let clientQueryClientSingleton: QueryClient
function getQueryClient() {
	if (typeof window === 'undefined') {
		return makeQueryClient()
	}
	return (clientQueryClientSingleton ??= makeQueryClient())
}

function getUrl() {
	const base = (() => {
		if (typeof window !== 'undefined') return ''
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
		return 'http://localhost:3000'
	})()
	return `${base}/api/trpc`
}

export function TRPCProvider(props: Readonly<{ children: React.ReactNode }>) {
	const queryClient = getQueryClient()

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchStreamLink({
					url: getUrl(),
					transformer: superjson,
					maxURLLength: 2048,
				}),
			],
		}),
	)

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{props.children}
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export { useQueryClient } from '@tanstack/react-query'
