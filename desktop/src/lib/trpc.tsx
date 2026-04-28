import { useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { getApiUrl, getToken } from './store'
import { createTrpcLinks } from '../../../lib/trpc/sharedClient'

import type { AppRouter } from '../../../lib/trpc/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

function makeQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: 30 * 1000, retry: 1 },
		},
	})
}

let queryClientSingleton: QueryClient | undefined

function getQueryClient() {
	return (queryClientSingleton ??= makeQueryClient())
}

let cachedApiUrl = 'https://aurasveta.ru'
export function setApiUrlCache(url: string) {
	cachedApiUrl = url
}

function buildTrpcClient(apiUrl: string) {
	return trpc.createClient({
		links: createTrpcLinks({
			url: import.meta.env.DEV ? '/api/trpc' : `${apiUrl}/api/trpc`,
			mode: 'batch',
			getHeaders: async () => {
				const token = await getToken()
				return token ? { Authorization: `Bearer ${token}` } : {}
			},
		}),
	})
}

export function TRPCProvider({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	const [apiUrl, setApiUrl] = useState<string>(cachedApiUrl)

	// Lazy initializer — client created once, not on every render
	const [trpcClient, setTrpcClient] = useState(() =>
		buildTrpcClient(cachedApiUrl),
	)

	useEffect(() => {
		let mounted = true
		getApiUrl().then(url => {
			if (!mounted) return
			const trimmed = url.replace(/\/+$/, '')
			setApiUrlCache(trimmed)
			setApiUrl(trimmed)
		})

		const onChange = (e: Event) => {
			const next = (e as CustomEvent<string>).detail
			if (!next) return
			const trimmed = String(next).replace(/\/+$/, '')
			setApiUrlCache(trimmed)
			setApiUrl(trimmed)
		}

		window.addEventListener('aurasveta:apiUrlChanged', onChange)
		return () => {
			mounted = false
			window.removeEventListener('aurasveta:apiUrlChanged', onChange)
		}
	}, [])

	// Rebuild client when apiUrl changes
	// NOTE: must use updater form (() => value) because the tRPC client
	// is a Proxy with a function target — React would call it as a state
	// updater if passed directly, causing it to become undefined.
	useEffect(() => {
		setTrpcClient(() => buildTrpcClient(apiUrl))
	}, [apiUrl])

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	)
}
