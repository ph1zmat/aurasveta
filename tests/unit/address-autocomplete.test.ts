import { describe, expect, it } from 'vitest'
import {
	buildPhotonStructuredSearchUrl,
	formatPhotonAddressLine,
	parsePhotonAutocompleteResponse,
	splitHighlightedText,
} from '@/shared/lib/address-autocomplete'

describe('address autocomplete helpers', () => {
	it('builds Photon structured search URL for Belarus', () => {
		const url = buildPhotonStructuredSearchUrl({
			city: 'Мозырь',
			query: 'Советская 10',
			limit: 5,
			lang: 'ru',
		})

		expect(url).toContain('https://photon.komoot.io/structured?')
		expect(url).toContain('city=%D0%9C%D0%BE%D0%B7%D1%8B%D1%80%D1%8C')
		expect(url).toContain('street=%D0%A1%D0%BE%D0%B2%D0%B5%D1%82%D1%81%D0%BA%D0%B0%D1%8F+10')
		expect(url).toContain('countrycode=BY')
		expect(url).toContain('lang=ru')
	})

	it('formats address line from street and house number', () => {
		expect(
			formatPhotonAddressLine({ street: 'улица Советская', housenumber: '10' }),
		).toBe('улица Советская, 10')
		expect(formatPhotonAddressLine({ name: 'ТРЦ Catapult' })).toBe('ТРЦ Catapult')
	})

	it('maps Photon response into suggestions', () => {
		const suggestions = parsePhotonAutocompleteResponse({
			features: [
				{
					geometry: { coordinates: [29.2456, 52.0495] },
					properties: {
						street: 'улица Советская',
						housenumber: '10',
						city: 'Мозырь',
						state: 'Гомельская область',
						postcode: '247760',
						osm_type: 'W',
						osm_id: 123,
					},
				},
			],
		})

		expect(suggestions).toHaveLength(1)
		expect(suggestions[0]).toMatchObject({
			id: 'W-123',
			label: 'улица Советская, 10',
			addressLine: 'улица Советская, 10',
			city: 'Мозырь',
			postcode: '247760',
		})
		expect(suggestions[0].secondaryLabel).toContain('Мозырь')
	})

	it('splits highlighted text for matched fragments', () => {
		const parts = splitHighlightedText('улица Советская, 10', 'сов')

		expect(parts).toEqual([
			{ text: 'улица ', highlighted: false },
			{ text: 'Сов', highlighted: true },
			{ text: 'етская, 10', highlighted: false },
		])
	})
})