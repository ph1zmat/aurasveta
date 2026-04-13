import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './types'

export type AdminTRPCClient = ReturnType<typeof createAdminTRPCClient>

/**
 * Создаёт tRPC-клиент для нативных приложений (Electron / React Native).
 * 
 * @param apiUrl - базовый URL API (например, https://aurasveta.ru)
 * @param getToken - функция, возвращающая токен сессии
 */
export function createAdminTRPCClient(
	apiUrl: string,
	getToken: () => string | null | Promise<string | null>,
) {
	return createTRPCClient<AppRouter>({
		links: [
			httpBatchStreamLink({
				url: `${apiUrl}/api/trpc`,
				transformer: superjson,
				async headers() {
					const token = await getToken()
					return token
						? { Authorization: `Bearer ${token}`, Cookie: `better-auth.session_token=${token}` }
						: {}
				},
			}),
		],
	})
}
