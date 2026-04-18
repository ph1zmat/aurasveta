import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from 'react'
import { Platform } from 'react-native'
import { getToken, setToken, getApiUrl } from './store'

const isWeb = Platform.OS === 'web'

/** Build auth headers: on web use credentials:'include', on native set Cookie manually */
function authHeaders(token: string | null): {
	headers?: Record<string, string>
	credentials?: RequestCredentials
} {
	if (isWeb) return { credentials: 'include' }
	if (token)
		return { headers: { Cookie: `better-auth.session_token=${token}` } }
	return {}
}

interface AuthUser {
	id: string
	name: string | null
	email: string
	role: string
}

interface AuthContextType {
	user: AuthUser | null
	isLoading: boolean
	login: (email: string, password: string) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be within AuthProvider')
	return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchSession = useCallback(async () => {
		try {
			const token = await getToken()
			// On native, require a stored token; on web, browser cookies handle auth
			if (!isWeb && !token) {
				setUser(null)
				setIsLoading(false)
				return
			}

			const apiUrl = await getApiUrl()
			const res = await fetch(`${apiUrl}/api/auth/get-session`, {
				...authHeaders(token),
			})

			if (!res.ok) {
				await setToken(null)
				setUser(null)
				setIsLoading(false)
				return
			}

			const data = await res.json()
			if (
				data?.user &&
				(data.user.role === 'ADMIN' || data.user.role === 'EDITOR')
			) {
				setUser(data.user)
			} else {
				await setToken(null)
				setUser(null)
			}
		} catch {
			setUser(null)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchSession()
	}, [fetchSession])

	const login = useCallback(
		async (email: string, password: string) => {
			const apiUrl = await getApiUrl()
			if (__DEV__)
				console.log('[AUTH] login → POST', `${apiUrl}/api/auth/sign-in/email`)
			let res: Response
			try {
				res = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password }),
					...(isWeb ? { credentials: 'include' as const } : {}),
				})
			} catch (e) {
				console.error('[AUTH] fetch failed:', e)
				throw new Error('Сервер недоступен')
			}

			if (__DEV__) console.log('[AUTH] response status:', res.status)
			const text = await res.text()
			if (__DEV__) console.log('[AUTH] response body:', text.slice(0, 500))
			if (__DEV__)
				console.log('[AUTH] response headers:', [...res.headers.entries()])

			if (!res.ok) {
				let msg = 'Ошибка входа'
				try {
					msg = JSON.parse(text).message || msg
				} catch {}
				throw new Error(msg)
			}

			let data: any
			try {
				data = JSON.parse(text)
			} catch {
				data = {}
			}
			if (__DEV__) console.log('[AUTH] parsed data keys:', Object.keys(data))
			if (__DEV__ && data.session)
				console.log('[AUTH] session keys:', Object.keys(data.session))

			// better-auth returns token in body or set-cookie header
			let token = data.token || data.session?.token || data.session?.id
			// React Native on Android may hide set-cookie, try header as fallback
			if (!token) {
				const setCookie = res.headers.get('set-cookie')
				if (__DEV__) console.log('[AUTH] set-cookie header:', setCookie)
				if (setCookie) {
					const m = setCookie.match(/better-auth\.session_token=([^;]+)/)
					if (m) token = m[1]
				}
			}
			if (__DEV__)
				console.log(
					'[AUTH] extracted token:',
					token ? `${token.slice(0, 8)}...` : 'null',
				)
			if (!token) {
				throw new Error('Не удалось получить токен сессии')
			}
			await setToken(token)
			await fetchSession()
		},
		[fetchSession],
	)

	const logout = useCallback(async () => {
		try {
			const apiUrl = await getApiUrl()
			const token = await getToken()
			await fetch(`${apiUrl}/api/auth/sign-out`, {
				method: 'POST',
				...authHeaders(token),
			})
		} catch {
			/* ignore */
		}
		await setToken(null)
		setUser(null)
	}, [])

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	)
}
