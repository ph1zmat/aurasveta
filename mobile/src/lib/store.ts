import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_URL_KEY = 'apiUrl'
const TOKEN_KEY = 'sessionToken'
const DEFAULT_API_URL = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

// expo-secure-store не работает на web — используем localStorage как fallback
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

export async function getApiUrl(): Promise<string> {
  const url = await getItem(API_URL_KEY)
  return url || DEFAULT_API_URL
}

export async function setApiUrl(url: string): Promise<void> {
  await setItem(API_URL_KEY, url)
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await setItem(TOKEN_KEY, token)
  } else {
    await deleteItem(TOKEN_KEY)
  }
}
