import { auth } from './auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

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
		redirect('/')
	}
	return session
}
