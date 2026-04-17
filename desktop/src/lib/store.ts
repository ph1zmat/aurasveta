const API_URL_KEY = 'apiUrl'
const TOKEN_KEY = 'sessionToken'
const DEFAULT_API_URL = import.meta.env.DEV ? 'http://127.0.0.1:3000' : 'https://aurasveta.ru'

function normalizeApiUrl(url: string): string {
  const trimmed = String(url || '').trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_API_URL
  // In dev, `localhost` and `127.0.0.1` are treated as different origins by the browser.
  // Force loopback IP to avoid renderer CORS issues.
  if (import.meta.env.DEV) return trimmed.replace('://localhost', '://127.0.0.1')
  return trimmed
}

export async function getApiUrl(): Promise<string> {
  if (window.electronAPI) {
    return normalizeApiUrl((await window.electronAPI.store.get(API_URL_KEY)) as string)
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
    window.dispatchEvent(new CustomEvent('aurasveta:apiUrlChanged', { detail: normalized }))
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
