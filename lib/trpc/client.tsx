'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'
import type { inferRouterOutputs } from '@trpc/server'
import { createTrpcLinks, resolveWebTrpcUrl } from './sharedClient'

export type RouterOutputs = inferRouterOutputs<AppRouter>

export const trpc = createTRPCReact<AppRouter>()

let clientQueryClientSingleton: QueryClient
function getQueryClient() {
	if (typeof window === 'undefined') {
		return makeQueryClient()
	}
	return (clientQueryClientSingleton ??= makeQueryClient())
}

export function TRPCProvider(props: Readonly<{ children: React.ReactNode }>) {
	const queryClient = getQueryClient()

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: createTrpcLinks({
				url: resolveWebTrpcUrl(),
				mode: 'stream',
			}),
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
