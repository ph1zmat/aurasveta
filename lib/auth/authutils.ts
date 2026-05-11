import { auth } from './auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type UserRole = 'USER' | 'EDITOR' | 'ADMIN'

function getRoleFromSession(session: Awaited<ReturnType<typeof auth.api.getSession>>): UserRole {
	return ((session?.user as Record<string, unknown>)?.role as UserRole) ?? 'USER'
}

export async function getSession() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	return session
}

export async function requireAuth() {
	const session = await getSession()
	if (!session?.user) {
		redirect('/login')
	}
	return session
}

export async function requireUnauth() {
	const session = await getSession()
	if (session?.user) {
		redirect('/')
	}
}

export async function requireAdmin() {
	const session = await requireAuth()
	const role = getRoleFromSession(session)
	if (role !== 'ADMIN') {
		redirect('/forbidden')
	}
	return session
}

export async function requireEditor() {
	const session = await requireAuth()
	const role = getRoleFromSession(session)
	if (role !== 'ADMIN' && role !== 'EDITOR') {
		redirect('/forbidden')
	}
	return session
}

export async function requireCmsAccess(): Promise<{
	session: Awaited<ReturnType<typeof requireAuth>>
	role: UserRole
}> {
	const session = await requireAuth()
	const role = getRoleFromSession(session)
	if (role !== 'ADMIN' && role !== 'EDITOR') {
		redirect('/forbidden')
	}
	return { session, role }
}
