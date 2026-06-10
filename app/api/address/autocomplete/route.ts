import { NextResponse } from 'next/server'
import {
	buildPhotonStructuredSearchUrl,
	parsePhotonAutocompleteResponse,
} from '@/shared/lib/address-autocomplete'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const city = searchParams.get('city')?.trim() ?? ''
	const query = searchParams.get('q')?.trim() ?? ''

	if (city.length < 2 || query.length < 3) {
		return NextResponse.json({ suggestions: [] })
	}

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 2500)

	try {
		const response = await fetch(
			buildPhotonStructuredSearchUrl({ city, query, limit: 5, lang: 'ru' }),
			{
				headers: {
					'Accept-Language': 'ru',
					'User-Agent': 'AuraSveta Address Autocomplete',
				},
				cache: 'no-store',
				signal: controller.signal,
			},
		)

		if (!response.ok) {
			return NextResponse.json({ suggestions: [] }, { status: 200 })
		}

		const payload = (await response.json()) as unknown
		const suggestions = parsePhotonAutocompleteResponse(payload)

		return NextResponse.json(
			{ suggestions },
			{
				headers: {
					'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
				},
			},
		)
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			return NextResponse.json({ suggestions: [] }, { status: 200 })
		}

		console.error('address autocomplete error:', error)
		return NextResponse.json({ suggestions: [] }, { status: 200 })
	} finally {
		clearTimeout(timeout)
	}
}
