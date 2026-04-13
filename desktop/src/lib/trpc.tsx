import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact, httpBatchStreamLink } from '@trpc/react-query'
import superjson from 'superjson'
import { getApiUrl, getToken } from './store'

// Импортируем AppRouter из типов (сгенерированных)
// В runtime — тип стирается, для сети используется httpBatchStreamLink
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

// API URL — берётся из electron-store
let cachedApiUrl = 'https://aurasveta.ru'
export function setApiUrlCache(url: string) {
  cachedApiUrl = url
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  const [apiUrl, setApiUrl] = useState<string>(cachedApiUrl)

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

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchStreamLink({
            url: `${apiUrl}/api/trpc`,
            transformer: superjson,
            async headers() {
              const token = await getToken()
              return token ? { Authorization: `Bearer ${token}` } : {}
            },
          }),
        ],
      }),
    [apiUrl],
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
