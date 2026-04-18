import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'productimg')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function sanitizeFilename(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_{2,}/g, '_')
		.slice(0, 100)
}

async function requireEditorRole() {
	// Allow desktop clients to send the session token via Authorization header.
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

export async function POST(req: Request) {
	try {
		const session = await requireEditorRole()
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const formData = await req.formData()
		const file = (formData as unknown as { get(name: string): unknown }).get(
			'file',
		) as File | null
		if (!file) {
			return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: 'Недопустимый тип файла. Разрешены: PNG, JPG, WebP, GIF' },
				{ status: 400 },
			)
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'Файл слишком большой (макс. 10 МБ)' },
				{ status: 400 },
			)
		}

		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		const ext = path.extname(file.name).toLowerCase() || '.jpg'
		const safeName = sanitizeFilename(path.basename(file.name, ext))
		const uniqueName = `${crypto.randomUUID()}-${safeName}${ext}`
		const relativePath = `/productimg/${uniqueName}`
		const fullPath = path.join(UPLOAD_DIR, uniqueName)

		await mkdir(UPLOAD_DIR, { recursive: true })
		await writeFile(fullPath, buffer)

		return NextResponse.json({
			path: relativePath,
			originalName: file.name,
		})
	} catch (err) {
		console.error('Upload error:', err)
		return NextResponse.json(
			{ error: 'Ошибка при загрузке файла' },
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
		const filePath = searchParams.get('path')

		if (!filePath || !filePath.startsWith('/productimg/')) {
			return NextResponse.json({ error: 'Неверный путь' }, { status: 400 })
		}

		// Prevent path traversal
		const fileName = path.basename(filePath)
		const fullPath = path.join(UPLOAD_DIR, fileName)

		try {
			await unlink(fullPath)
		} catch {
			// File may not exist, that's ok
		}

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Delete error:', err)
		return NextResponse.json(
			{ error: 'Ошибка при удалении файла' },
			{ status: 500 },
		)
	}
}
