export type PhotonFeatureProperties = {
	name?: string
	street?: string
	housenumber?: string
	postcode?: string
	city?: string
	district?: string
	state?: string
	country?: string
	countrycode?: string
	osm_type?: string
	osm_id?: number | string
}

export type PhotonFeature = {
	type?: string
	geometry?: {
		type?: string
		coordinates?: [number, number]
	}
	properties?: PhotonFeatureProperties
}

export type AddressAutocompleteSuggestion = {
	id: string
	label: string
	secondaryLabel: string
	addressLine: string
	city: string
	postcode: string
	coordinates: [number, number] | null
}

export type HighlightPart = {
	text: string
	highlighted: boolean
}

const PHOTON_BASE_URL = 'https://photon.komoot.io/structured'

function compactParts(parts: Array<string | null | undefined>) {
	return parts.map(part => part?.trim() ?? '').filter(Boolean)
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildPhotonStructuredSearchUrl(input: {
	city: string
	query: string
	limit?: number
	lang?: string
}) {
	const params = new URLSearchParams({
		city: input.city.trim(),
		street: input.query.trim(),
		countrycode: 'BY',
		lang: input.lang?.trim() || 'ru',
		limit: String(input.limit ?? 5),
	})
	params.append('layer', 'house')
	params.append('layer', 'street')
	params.append('dedupe', '1')

	return `${PHOTON_BASE_URL}?${params.toString()}`
}

export function formatPhotonAddressLine(properties: PhotonFeatureProperties) {
	const primary = properties.street?.trim() || properties.name?.trim() || ''
	const house = properties.housenumber?.trim() || ''

	return compactParts([primary, house]).join(', ')
}

export function mapPhotonFeatureToSuggestion(
	feature: PhotonFeature,
	index: number,
): AddressAutocompleteSuggestion | null {
	const properties = feature.properties
	if (!properties) return null

	const addressLine = formatPhotonAddressLine(properties)
	if (!addressLine) return null

	const city = properties.city?.trim() || properties.district?.trim() || ''
	const postcode = properties.postcode?.trim() || ''
	const secondaryLabel = compactParts([
		city,
		properties.state,
		postcode,
	]).join(' · ')
	const osmId = properties.osm_id != null ? String(properties.osm_id) : String(index)
	const osmType = properties.osm_type?.trim() || 'feature'
	const coordinates =
		feature.geometry?.coordinates && feature.geometry.coordinates.length === 2
			? feature.geometry.coordinates
			: null

	return {
		id: `${osmType}-${osmId}`,
		label: addressLine,
		secondaryLabel,
		addressLine,
		city,
		postcode,
		coordinates,
	}
}

export function parsePhotonAutocompleteResponse(payload: unknown) {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!Array.isArray((payload as { features?: unknown[] }).features)
	) {
		return [] as AddressAutocompleteSuggestion[]
	}

	return (payload as { features: PhotonFeature[] }).features
		.map((feature, index) => mapPhotonFeatureToSuggestion(feature, index))
		.filter((value): value is AddressAutocompleteSuggestion => value !== null)
}

export function splitHighlightedText(value: string, query: string): HighlightPart[] {
	const source = value.trim()
	const normalizedQuery = query.trim()

	if (!source) return []
	if (!normalizedQuery) return [{ text: source, highlighted: false }]

	const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'ig')
	const parts = source.split(matcher).filter(Boolean)

	return parts.map(part => ({
		text: part,
		highlighted: part.toLowerCase() === normalizedQuery.toLowerCase(),
	}))
}