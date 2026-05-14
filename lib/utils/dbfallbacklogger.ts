type LoggerOptions = {
	throttleMs?: number
	includeErrorStack?: boolean
}

const DEFAULT_THROTTLE_MS = 120_000
const lastLoggedAtByKey = new Map<string, number>()

function getErrorCode(error: unknown): string | null {
	if (!error || typeof error !== 'object') return null

	const maybeCode = (error as { code?: unknown }).code
	return typeof maybeCode === 'string' ? maybeCode : null
}

function shouldLogNow(key: string, throttleMs: number): boolean {
	const now = Date.now()
	const lastLoggedAt = lastLoggedAtByKey.get(key)

	if (lastLoggedAt != null && now - lastLoggedAt < throttleMs) {
		return false
	}

	lastLoggedAtByKey.set(key, now)
	return true
}

export function logDatabaseFallback(
	context: string,
	error: unknown,
	options: LoggerOptions = {},
) {
	const code = getErrorCode(error)
	const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS
	const key = `${context}:${code ?? 'UNKNOWN'}`

	if (!shouldLogNow(key, throttleMs)) return

	const details = code ? ` (code: ${code})` : ''
	const message = `[${context}] database unavailable${details}`

	if (options.includeErrorStack ?? true) {
		console.warn(message, error)
		return
	}

	console.warn(message)
}
