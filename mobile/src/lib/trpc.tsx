import { useState, type ReactNode } from 'react'
import { createTRPCReact, httpBatchStreamLink } from '@trpc/react-query'
import superjson from 'superjson'
import { getToken } from './store'

// AppRouter type — imported at type level only
import type { AppRouter } from '../../../lib/trpc/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

// В production, API URL берётся из secure store при инициализации
let API_URL = 'https://aurasveta.ru'
export function setApiUrlForTRPC(url: string) { API_URL = url }

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchStreamLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = await getToken()
            return token ? { Cookie: `better-auth.session_token=${token}` } : {}
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={undefined as any}>
      {children}
    </trpc.Provider>
  )
}
