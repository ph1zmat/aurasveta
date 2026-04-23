import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import { deleteFile } from '@/lib/storage'

async function requireEditorRole() {
	const incoming = await headers()
	const effective = new Headers(incoming)
	const tokenFromAuth =
		effective
			.get('authorization')
			?.match(/^Bearer\s+(.+)$/i)?.[1]
			?.trim() ??
		effective.get('x-session-token')?.trim() ??
		null

	if (tokenFromAuth) {
		const existingCookie = effective.get('cookie') ?? ''
		if (!/better-auth\.session_token=/.test(existingCookie)) {
			const cookieToAdd = `better-auth.session_token=${tokenFromAuth}`
			effective.set(
				'cookie',
				existingCookie ? `${existingCookie}; ${cookieToAdd}` : cookieToAdd,
			)
		}
	}

	const session = await auth.api.getSession({ headers: effective })
	if (!session?.user) {
		return null
	}

	const { prisma } = await import('@/lib/prisma')
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	})

	if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR') {
		return null
	}

	return session
}

function validateKey(key: string | null | undefined): key is string {
	return !!key && /^(products|uploads)\//.test(key)
}

async function getKeyFromBody(req: Request) {
	try {
		const body = (await req.json()) as { key?: string; path?: string }
		return body.key ?? body.path ?? null
	} catch {
		return null
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireEditorRole()
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const key = await getKeyFromBody(req)
		if (!validateKey(key)) {
			return NextResponse.json({ error: 'Неверный ключ' }, { status: 400 })
		}

		await deleteFile(key)
		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Upload delete error:', err)
		return NextResponse.json(
			{ error: 'Ошибка при удалении файла' },
			{ status: 500 },
		)
	}
}

export async function DELETE(req: Request) {
	try {
		const session = await requireEditorRole()
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const key = searchParams.get('key') ?? searchParams.get('path')
		if (!validateKey(key)) {
			return NextResponse.json({ error: 'Неверный ключ' }, { status: 400 })
		}

		await deleteFile(key)
		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Upload delete error:', err)
		return NextResponse.json(
			{ error: 'Ошибка при удалении файла' },
			{ status: 500 },
		)
	}
}
