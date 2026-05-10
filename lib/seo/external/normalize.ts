import type { ExternalRawSignal } from './types'

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

/**
 * Нормализует CTR: 0..1.
 * Поддерживает вход в формате 0.034 или 3.4 (%).
 */
export function normalizeCtr(input: number) {
	if (!Number.isFinite(input) || input < 0) return 0
	if (input > 1) {
		return clamp(input / 100, 0, 1)
	}
	return clamp(input, 0, 1)
}

export function normalizeExternalSignal(signal: ExternalRawSignal): ExternalRawSignal {
	const impressions = Math.max(0, Math.round(signal.impressions))
	const clicks = Math.max(0, Math.round(signal.clicks))

	return {
		...signal,
		impressions,
		clicks: Math.min(clicks, impressions),
		ctr: normalizeCtr(signal.ctr),
		position: Math.max(0, signal.position),
		coverageErrors: Math.max(0, Math.round(signal.coverageErrors)),
	}
}

export function normalizeExternalSignals(signals: ExternalRawSignal[]) {
	return signals.map(normalizeExternalSignal)
}
