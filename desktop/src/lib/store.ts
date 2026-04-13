const API_URL_KEY = 'apiUrl'
const TOKEN_KEY = 'sessionToken'

export async function getApiUrl(): Promise<string> {
  if (window.electronAPI) {
    return (await window.electronAPI.store.get(API_URL_KEY)) as string || 'https://aurasveta.ru'
  }
  return localStorage.getItem(API_URL_KEY) || 'https://aurasveta.ru'
}

export async function setApiUrl(url: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.store.set(API_URL_KEY, url)
  } else {
    localStorage.setItem(API_URL_KEY, url)
  }

  // Notify renderer subscribers (e.g. tRPC client) that API URL changed.
  try {
    window.dispatchEvent(new CustomEvent('aurasveta:apiUrlChanged', { detail: url }))
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
