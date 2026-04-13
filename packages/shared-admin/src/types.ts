/**
 * Re-export AppRouter type from the main web application.
 * This creates a type-only dependency — no runtime code imported.
 */
export type { AppRouter } from '../../../lib/trpc/routers/_app'

// Общие типы для администраторских приложений

export interface AdminUser {
	id: string
	email: string
	name: string | null
	role: 'USER' | 'EDITOR' | 'ADMIN'
	phone: string | null
	image: string | null
}

export interface AuthSession {
	user: AdminUser
	token: string
}

export interface PushRegistration {
	platform: 'FCM' | 'WEB_PUSH'
	token: string
	endpoint?: string
	p256dh?: string
	authKey?: string
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface AppConfig {
	apiUrl: string
	/** URL для загрузки изображений */
	uploadUrl: string
}
