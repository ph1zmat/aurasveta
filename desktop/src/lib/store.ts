import { useState, useEffect } from 'react'

const API_URL_KEY = 'apiUrl'
const TOKEN_KEY = 'sessionToken'
const DEFAULT_API_URL = import.meta.env.DEV
	? 'http://127.0.0.1:3000'
	: 'https://aurasveta.ru'

function normalizeApiUrl(url: string): string {
	const trimmed = String(url || '')
		.trim()
		.replace(/\/+$/, '')
	if (!trimmed) return DEFAULT_API_URL

	let parsed: URL
	try {
		parsed = new URL(trimmed)
	} catch {
		return DEFAULT_API_URL
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return DEFAULT_API_URL
	}

	const normalizedUrl = parsed.toString().replace(/\/+$/, '')
	// In dev, `localhost` and `127.0.0.1` are treated as different origins by the browser.
	// Force loopback IP to avoid renderer CORS issues.
	if (import.meta.env.DEV)
		return normalizedUrl.replace('://localhost', '://127.0.0.1')
	return normalizedUrl
}

export async function getApiUrl(): Promise<string> {
	if (window.electronAPI) {
		return normalizeApiUrl(
			(await window.electronAPI.store.get(API_URL_KEY)) as string,
		)
	}
	return normalizeApiUrl(localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL)
}

export async function setApiUrl(url: string): Promise<void> {
	const normalized = normalizeApiUrl(url)
	if (window.electronAPI) {
		await window.electronAPI.store.set(API_URL_KEY, normalized)
	} else {
		localStorage.setItem(API_URL_KEY, normalized)
	}

	// Notify renderer subscribers (e.g. tRPC client) that API URL changed.
	try {
		window.dispatchEvent(
			new CustomEvent('aurasveta:apiUrlChanged', { detail: normalized }),
		)
	} catch {
		// ignore
	}
}

export async function getToken(): Promise<string | null> {
	if (window.electronAPI) {
		return (await window.electronAPI.store.get(TOKEN_KEY)) as string | null
	}
	return localStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
	if (window.electronAPI) {
		await window.electronAPI.store.set(TOKEN_KEY, token)
	} else {
		if (token) localStorage.setItem(TOKEN_KEY, token)
		else localStorage.removeItem(TOKEN_KEY)
	}
}

/** Returns the current API base URL as reactive state. */
export function useApiBaseUrl(): string {
	const [url, setUrl] = useState<string>(DEFAULT_API_URL)
	useEffect(() => {
		getApiUrl().then(u => setUrl(u.replace(/\/+$/, '')))
		const onChange = (e: Event) => {
			const next = (e as CustomEvent<string>).detail
			if (next) setUrl(String(next).replace(/\/+$/, ''))
		}
		window.addEventListener('aurasveta:apiUrlChanged', onChange)
		return () => window.removeEventListener('aurasveta:apiUrlChanged', onChange)
	}, [])
	return url
}

/** Resolve an absolute URL, app-relative path, or raw storage key for display in Electron. */
export function resolveImgUrl(
	imagePath: string | null | undefined,
	apiBaseUrl: string,
): string | undefined {
	if (!imagePath) return undefined
	if (imagePath.startsWith('http')) return imagePath
	if (imagePath.startsWith('/')) return `${apiBaseUrl}${imagePath}`
	return `${apiBaseUrl}/api/storage/file?key=${encodeURIComponent(imagePath)}`
}
