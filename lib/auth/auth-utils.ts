import { auth } from './auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type UserRole = 'USER' | 'EDITOR' | 'ADMIN'

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
	const { prisma } = await import('@/lib/prisma')
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	})
	if (user?.role !== 'ADMIN') {
		redirect('/forbidden')
	}
	return session
}

export async function requireEditor() {
	const session = await requireAuth()
	const { prisma } = await import('@/lib/prisma')
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	})
	const role = (user?.role ?? 'USER') as UserRole
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
	const { prisma } = await import('@/lib/prisma')
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	})
	const role = (user?.role ?? 'USER') as UserRole
	if (role !== 'ADMIN' && role !== 'EDITOR') {
		redirect('/forbidden')
	}
	return { session, role }
}
