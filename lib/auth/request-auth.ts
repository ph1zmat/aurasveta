import { prisma } from '@/lib/prisma'
import { auth } from './auth'

type CmsRole = 'ADMIN' | 'EDITOR'

export function normalizeRequestAuthHeaders(source: Headers): Headers {
	const headers = new Headers(source)
	const xSessionToken = headers.get('x-session-token')?.trim()

	if (xSessionToken && !headers.get('authorization')) {
		headers.set('authorization', `Bearer ${xSessionToken}`)
	}

	return headers
}

export async function getSessionFromRequestHeaders(source: Headers) {
	return auth.api.getSession({
		headers: normalizeRequestAuthHeaders(source),
	})
}

export async function getCmsRoleForUserId(userId: string): Promise<CmsRole | null> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	})

	return user?.role === 'ADMIN' || user?.role === 'EDITOR' ? user.role : null
}

export async function getCmsAccessFromRequestHeaders(source: Headers) {
	const session = await getSessionFromRequestHeaders(source)
	if (!session?.user) {
		return null
	}

	const role = await getCmsRoleForUserId(session.user.id)
	if (!role) {
		return null
	}

	return { session, role }
}
