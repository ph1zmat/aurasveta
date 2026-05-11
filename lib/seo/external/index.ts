import { normalizeExternalSignals } from './normalize'
import { fetchGoogleSearchConsoleSignals } from './providers/googlesearchconsole'
import { fetchYandexWebmasterSignals } from './providers/yandexwebmaster'
import type { ExternalFetchInput, ExternalFetchResult, ExternalProvider } from './types'

export async function fetchExternalSignals(
	provider: ExternalProvider,
	input: ExternalFetchInput,
): Promise<ExternalFetchResult> {
	const result =
		provider === 'google-search-console'
			? await fetchGoogleSearchConsoleSignals(input)
			: await fetchYandexWebmasterSignals(input)

	return {
		...result,
		signals: normalizeExternalSignals(result.signals),
	}
}
