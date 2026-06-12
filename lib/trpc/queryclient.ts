import { QueryClient } from '@tanstack/react-query'

const MINUTE = 60 * 1000

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Справочники (категории, настройки, фильтры) меняются редко —
				// не запрашиваем их повторно при каждом переходе.
				staleTime: 5 * MINUTE,
				gcTime: 15 * MINUTE,
				// На малом VPS не делаем лишних retry, чтобы не нагружать CPU/сеть.
				retry: 1,
				refetchOnWindowFocus: false,
				// Данные уже префетчены на сервере — не перезапрашиваем их при монтировании клиентских страниц.
				refetchOnMount: false,
			},
			mutations: {
				retry: false,
			},
		},
	})
}
