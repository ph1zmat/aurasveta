import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAdmins } from '@/lib/push/send'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	// Проверяем аутентификацию — только ADMIN
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	})

	if (user?.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const body = await request.json()
	const { title, message, data } = body

	if (!title || !message) {
		return NextResponse.json(
			{ error: 'title и message обязательны' },
			{ status: 400 },
		)
	}

	const result = await sendPushToAdmins({
		title,
		body: message,
		data,
	})

	return NextResponse.json(result)
}
