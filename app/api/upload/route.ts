import path from 'path'
import { randomBytes, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { uploadFile, deleteFile } from '@/lib/storage'
import { getStorageFileUrl } from '@/shared/lib/storagefileurl'
import { getCmsAccessFromRequestHeaders } from '@/lib/auth/request-auth'
import { API_CORS_ALLOWED_ORIGINS, getAllowedOrigin } from '@/lib/config/origins'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
}

function createUuid(): string {
	if (typeof randomUUID === 'function') {
		return randomUUID()
	}
	return randomBytes(16).toString('hex')
}

function resolveFileType(file: File): string {
	// Normalize image/jpg → image/jpeg (non-standard alias used by some OS/browsers)
	if (file.type === 'image/jpg') return 'image/jpeg'
	// If MIME is missing or octet-stream, fall back to extension
	if (!file.type || file.type === 'application/octet-stream') {
		const ext = path.extname(file.name).toLowerCase()
		return EXT_TO_MIME[ext] ?? ''
	}
	return file.type
}

function sanitizeFilename(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_{2,}/g, '_')
		.slice(0, 100)
}

function getFilesFromFormData(formData: FormData): File[] {
	const files = [
		...formData.getAll('files'),
		...formData.getAll('file'),
	].filter((value): value is File => value instanceof File)

	return files
}

function getCorsOrigin(origin: string | null): string {
	return getAllowedOrigin(origin, API_CORS_ALLOWED_ORIGINS)
}

function withCors(response: NextResponse, origin: string | null): NextResponse {
	const corsOrigin = getCorsOrigin(origin)
	if (!corsOrigin) return response

	response.headers.set('Access-Control-Allow-Origin', corsOrigin)
	response.headers.set('Access-Control-Allow-Credentials', 'true')
	response.headers.set('Vary', 'Origin')
	return response
}

function jsonWithCors(
	body: unknown,
	init: ResponseInit,
	origin: string | null,
): NextResponse {
	return withCors(NextResponse.json(body, init), origin)
}

async function requireEditorRole() {
	const access = await getCmsAccessFromRequestHeaders(await headers())
	return access?.session ?? null
}

export async function POST(req: Request) {
	const origin = req.headers.get('origin')
	try {
		const session = await requireEditorRole()
		if (!session) {
			return jsonWithCors({ error: 'Unauthorized' }, { status: 401 }, origin)
		}
		const formData = await req.formData()
		const files = getFilesFromFormData(formData)

		if (files.length === 0) {
			return jsonWithCors({ error: 'Файл не передан' }, { status: 400 }, origin)
		}

		const uploadedFiles = [] as Array<{
			key: string
			url: string
			path: string
			originalName: string
			size: number
			mimeType: string
		}>

		for (const file of files) {
			const resolvedType = resolveFileType(file)
			if (!ALLOWED_TYPES.includes(resolvedType)) {
				console.error(
					`Upload rejected: type="${file.type}" name="${file.name}" resolved="${resolvedType}"`,
				)
				return jsonWithCors(
					{
						error: `Недопустимый тип файла (${file.type || 'unknown'}). Разрешены: PNG, JPG, WebP, GIF`,
					},
					{ status: 400 },
					origin,
				)
			}

			if (file.size > MAX_FILE_SIZE) {
				return jsonWithCors(
					{ error: 'Файл слишком большой (макс. 10 МБ)' },
					{ status: 400 },
					origin,
				)
			}

			const bytes = await file.arrayBuffer()
			const buffer = Buffer.from(bytes)

			const ext = path.extname(file.name).toLowerCase() || '.jpg'
			const safeName = sanitizeFilename(path.basename(file.name, ext))
			const uuid = createUuid()
			const key = `products/${uuid}/${safeName}${ext}`
			const url = getStorageFileUrl(key)

			await uploadFile(key, buffer, resolvedType)

			uploadedFiles.push({
				key,
				url,
				path: url,
				originalName: file.name,
				size: file.size,
				mimeType: resolvedType,
			})
		}

		const [firstFile] = uploadedFiles

		return withCors(
			NextResponse.json({
				...firstFile,
				files: uploadedFiles,
				count: uploadedFiles.length,
			}),
			origin,
		)
	} catch (err) {
		console.error('Upload error:', err)
		return jsonWithCors(
			{ error: 'Ошибка при загрузке файла' },
			{ status: 500 },
			origin,
		)
	}
}

export async function DELETE(req: Request) {
	const origin = req.headers.get('origin')
	try {
		const session = await requireEditorRole()
		if (!session) {
			return jsonWithCors({ error: 'Unauthorized' }, { status: 401 }, origin)
		}

		const { searchParams } = new URL(req.url)
		// Поддерживаем и новый параметр `key`, и legacy `path`
		const key = searchParams.get('key') ?? searchParams.get('path')

		// Защита от path-traversal: разрешаем только ключи внутри products/ или uploads/
		if (!key || !/^(products|uploads)\//.test(key)) {
			return jsonWithCors({ error: 'Неверный ключ' }, { status: 400 }, origin)
		}

		await deleteFile(key)

		return withCors(NextResponse.json({ success: true }), origin)
	} catch (err) {
		console.error('Delete error:', err)
		return jsonWithCors(
			{ error: 'Ошибка при удалении файла' },
			{ status: 500 },
			origin,
		)
	}
}

