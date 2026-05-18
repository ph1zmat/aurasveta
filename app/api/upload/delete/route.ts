import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { deleteFile } from '@/lib/storage'
import { getCmsAccessFromRequestHeaders } from '@/lib/auth/request-auth'

async function requireEditorRole() {
	const access = await getCmsAccessFromRequestHeaders(await headers())
	return access?.session ?? null
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
