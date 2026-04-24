import { NextResponse } from 'next/server'
import { getFileUrl } from '@/lib/storage'

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function normalizeStorageKey(rawKey: string, reqUrl: string): string {
	let key = rawKey.trim()

	for (let i = 0; i < 4; i++) {
		const decoded = safeDecode(key)
		if (decoded !== key) {
			key = decoded.trim()
			continue
		}

		if (key.startsWith('/api/storage/file')) {
			try {
				const nested = new URL(key, reqUrl).searchParams.get('key')?.trim()
				if (nested) {
					key = nested
					continue
				}
			} catch {
				// ignore invalid nested URL and keep current key
			}
		}

		if (/^https?:\/\//i.test(key)) {
			try {
				const url = new URL(key)
				if (url.pathname === '/api/storage/file') {
					const nested = url.searchParams.get('key')?.trim()
					if (nested) {
						key = nested
						continue
					}
				}
			} catch {
				// leave as-is
			}
		}

		break
	}

	return key
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const rawKey = searchParams.get('key')?.trim()
	const key = rawKey ? normalizeStorageKey(rawKey, req.url) : null

	if (!key) {
		return NextResponse.json({ error: 'Missing key' }, { status: 400 })
	}

	try {
		let upstreamUrl: string | null = null

		if (/^https?:\/\//i.test(key)) {
			upstreamUrl = key
		}

		if (key.startsWith('/') && !key.startsWith('/api/storage/file')) {
			const redirectResponse = NextResponse.redirect(new URL(key, req.url), 307)
			redirectResponse.headers.set(
				'Cache-Control',
				'public, max-age=300, stale-while-revalidate=120',
			)
			return redirectResponse
		}

		if (!upstreamUrl && !/^(products|uploads|public)\//.test(key)) {
			return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
		}

		upstreamUrl ??= await getFileUrl(key)

		const redirectResponse = NextResponse.redirect(upstreamUrl, 307)
		redirectResponse.headers.set(
			'Cache-Control',
			'public, max-age=3300, stale-while-revalidate=300',
		)
		return redirectResponse
	} catch (err) {
		console.error('storage file proxy error:', err)
		return NextResponse.json(
			{ error: 'Failed to resolve file' },
			{ status: 500 },
		)
	}
}
