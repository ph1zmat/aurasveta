import path from 'path'
import { NextResponse } from 'next/server'
import { getFileUrl } from '@/lib/storage'

const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
}

function inferMimeType(key: string): string | null {
	return EXT_TO_MIME[path.extname(key).toLowerCase()] ?? null
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const key = searchParams.get('key')?.trim()

	if (!key) {
		return NextResponse.json({ error: 'Missing key' }, { status: 400 })
	}

	try {
		let upstreamUrl: string | null = null

		if (/^https?:\/\//i.test(key)) {
			upstreamUrl = key
		}

		if (key.startsWith('/')) {
			return NextResponse.redirect(new URL(key, req.url))
		}

		if (!upstreamUrl && !/^(products|uploads|public)\//.test(key)) {
			return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
		}

		upstreamUrl ??= await getFileUrl(key)

		const upstreamResponse = await fetch(upstreamUrl, {
			redirect: 'follow',
		})

		if (!upstreamResponse.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch file from storage' },
				{ status: upstreamResponse.status },
			)
		}

		if (!upstreamResponse.body) {
			return NextResponse.json(
				{ error: 'Storage returned empty body' },
				{ status: 502 },
			)
		}

		const inferredContentType = inferMimeType(key)
		const upstreamContentType = upstreamResponse.headers
			.get('content-type')
			?.trim()
		const contentType =
			upstreamContentType &&
			(upstreamContentType.startsWith('image/') || !inferredContentType)
				? upstreamContentType
				: inferredContentType ||
					upstreamContentType ||
					'application/octet-stream'

		const response = new NextResponse(upstreamResponse.body, {
			status: 200,
		})

		response.headers.set('Content-Type', contentType)
		response.headers.set(
			'Cache-Control',
			'public, max-age=3300, stale-while-revalidate=300',
		)
		response.headers.set('Content-Disposition', 'inline')

		const contentLength = upstreamResponse.headers.get('content-length')
		if (contentLength) {
			response.headers.set('Content-Length', contentLength)
		}

		const etag = upstreamResponse.headers.get('etag')
		if (etag) {
			response.headers.set('ETag', etag)
		}

		const lastModified = upstreamResponse.headers.get('last-modified')
		if (lastModified) {
			response.headers.set('Last-Modified', lastModified)
		}

		return response
	} catch (err) {
		console.error('storage file proxy error:', err)
		return NextResponse.json(
			{ error: 'Failed to resolve file' },
			{ status: 500 },
		)
	}
}
