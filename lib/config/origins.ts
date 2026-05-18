const LOCAL_DEVELOPMENT_ORIGINS = [
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:8081',
	'http://127.0.0.1:8081',
] as const

const STATIC_PRODUCTION_ORIGINS = [
	'https://aurasveta.by',
	'https://www.aurasveta.by',
	'https://aurasveta.ru',
] as const

function normalizeOrigin(value: string | null | undefined): string | null {
	const trimmed = value?.trim()
	if (!trimmed) {
		return null
	}

	try {
		const url = new URL(trimmed)
		if (url.protocol === 'http:' || url.protocol === 'https:') {
			return url.origin
		}
		return trimmed
	} catch {
		return trimmed
	}
}

function uniqueOrigins(values: Array<string | null | undefined>): string[] {
	return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

const configuredBrowserOrigins = uniqueOrigins([
	normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
	normalizeOrigin(process.env.NEXT_PUBLIC_BETTER_AUTH_URL),
])

export const AUTH_ROUTE_ALLOWED_ORIGINS = uniqueOrigins([
	...LOCAL_DEVELOPMENT_ORIGINS,
	...STATIC_PRODUCTION_ORIGINS,
	...configuredBrowserOrigins,
])

export const API_CORS_ALLOWED_ORIGINS =
	process.env.NODE_ENV !== 'production'
		? AUTH_ROUTE_ALLOWED_ORIGINS
		: uniqueOrigins([...STATIC_PRODUCTION_ORIGINS, ...configuredBrowserOrigins])

export const AUTH_TRUSTED_ORIGINS = uniqueOrigins([
	...AUTH_ROUTE_ALLOWED_ORIGINS,
	'exp+auracms://',
	'aurasveta://',
])

export function getAllowedOrigin(
	origin: string | null,
	allowedOrigins: readonly string[] = AUTH_ROUTE_ALLOWED_ORIGINS,
): string {
	if (!origin) {
		return ''
	}

	return allowedOrigins.includes(origin) ? origin : ''
}
