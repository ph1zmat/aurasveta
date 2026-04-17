import { useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'
import { getToken } from './store'

// AppRouter type — imported at type level only
import type { AppRouter } from '../../../lib/trpc/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

// В production, API URL берётся из secure store при инициализации
let API_URL = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'
export function setApiUrlForTRPC(url: string) { API_URL = url }

export function TRPCProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          async headers() {
            if (Platform.OS === 'web') return {} // browser sends cookies automatically
            const token = await getToken()
            return token ? { Cookie: `better-auth.session_token=${token}` } : {}
          },
          fetch: Platform.OS === 'web'
            ? (url, opts) => globalThis.fetch(url, { ...opts, credentials: 'include' })
            : undefined,
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  )
}
