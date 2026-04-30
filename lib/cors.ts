/**
 * Централизованный список разрешённых origin для CORS.
 *
 * Правило: localhost-ориджины присутствуют ТОЛЬКО в development.
 * В production разрешён только явный список production-доменов.
 */

const PROD_ORIGINS: string[] = [
	'https://aurasveta.ru',
	process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[]

const DEV_ORIGINS: string[] = [
	'http://localhost:3000',
	'http://localhost:5173',
	'http://localhost:8081',
	'http://127.0.0.1:5173',
	'http://127.0.0.1:8081',
]

export const ALLOWED_ORIGINS: ReadonlyArray<string> =
	process.env.NODE_ENV !== 'production'
		? [...PROD_ORIGINS, ...DEV_ORIGINS]
		: PROD_ORIGINS

/**
 * Возвращает origin если он находится в разрешённом списке, иначе ''.
 */
export function resolveCorsOrigin(origin: string | null | undefined): string {
	if (!origin) return ''
	return ALLOWED_ORIGINS.includes(origin) ? origin : ''
}
