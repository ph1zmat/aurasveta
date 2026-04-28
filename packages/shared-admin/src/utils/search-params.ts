export function readPositiveIntParam(
	value: string | null | undefined,
	fallback: number,
) {
	const parsed = Number.parseInt(value ?? '', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readStringParam(
	value: string | null | undefined,
	fallback = '',
) {
	return value?.trim() || fallback
}

export function readBooleanParam(
	value: string | null | undefined,
	fallback?: boolean,
) {
	if (value == null) return fallback

	const normalized = value.trim().toLowerCase()
	if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
	if (['0', 'false', 'no', 'off'].includes(normalized)) return false

	return fallback
}

export function readEnumParam<const T extends string>(
	value: string | null | undefined,
	allowed: readonly T[],
	fallback: T,
) {
	return value && allowed.includes(value as T) ? (value as T) : fallback
}

export type SearchParamValue = string | number | boolean | null | undefined

export function buildSearchParamsUrl(
	pathname: string,
	current: string | URLSearchParams | { toString(): string },
	updates: Record<string, SearchParamValue>,
) {
	const normalizedPathname = pathname || '/'
	const params = mergeSearchParams(current, updates)
	const nextQuery = params.toString()

	return nextQuery
		? `${normalizedPathname}?${nextQuery}`
		: normalizedPathname
}

export function mergeSearchParams(
	current: string | URLSearchParams | { toString(): string },
	updates: Record<string, SearchParamValue>,
) {
	const source =
		typeof current === 'string'
			? current.startsWith('?')
				? current.slice(1)
				: current
			: current.toString()

	const params = new URLSearchParams(source)

	for (const [key, value] of Object.entries(updates)) {
		if (value == null || value === '') {
			params.delete(key)
			continue
		}

		if (typeof value === 'boolean') {
			params.set(key, value ? '1' : '0')
			continue
		}

		params.set(key, String(value))
	}

	return params
}
