import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToAdmins } from '@/lib/push/send'

type DeviceCounts = {
	total: number
	byPlatform: Record<string, number>
}

type ActiveDevice = {
	platform: string
}

export async function GET(request: NextRequest) {
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

	const devices = await prisma.pushDevice.findMany({
		where: { active: true, user: { role: { in: ['ADMIN', 'EDITOR'] } } },
		select: { id: true, platform: true },
	})

	const counts = devices.reduce(
		(acc: DeviceCounts, d: ActiveDevice) => {
			acc.total++
			acc.byPlatform[d.platform] = (acc.byPlatform[d.platform] ?? 0) + 1
			return acc
		},
		{ total: 0, byPlatform: {} },
	)

	return NextResponse.json({
		env: {
			hasVapidPublicKey: Boolean(process.env.VAPID_PUBLIC_KEY),
			hasVapidPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
			hasNextPublicVapid: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
			vapidSubject: process.env.VAPID_SUBJECT ?? null,
		},
		devices: counts,
	})
}

export async function POST(request: NextRequest) {
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

	const result = await sendPushToAdmins({
		title: 'Debug push',
		body: 'Debug push payload',
		data: { type: 'debug' },
	})

	return NextResponse.json({ result })
}

