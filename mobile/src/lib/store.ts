import * as SecureStore from 'expo-secure-store'

const API_URL_KEY = 'apiUrl'
const TOKEN_KEY = 'sessionToken'
const DEFAULT_API_URL = 'https://aurasveta.ru'

export async function getApiUrl(): Promise<string> {
  const url = await SecureStore.getItemAsync(API_URL_KEY)
  return url || DEFAULT_API_URL
}

export async function setApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(API_URL_KEY, url)
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }
}
