import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/admin']
const authPaths = ['/login', '/register']

// In-memory rate limiter (for single-instance deployments; use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function rateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): boolean {
	const now = Date.now()
	const entry = rateLimitStore.get(key)

	if (!entry || now > entry.resetAt) {
		rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
		return true
	}

	if (entry.count >= maxRequests) return false

	entry.count++
	return true
}

function getClientIp(request: NextRequest): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown'
	)
}

// Cleanup stale entries lazily on each request (avoids setInterval in edge runtime)
let lastCleanup = 0
function cleanStaleEntries() {
	const now = Date.now()
	if (now - lastCleanup < 60_000) return
	lastCleanup = now
	for (const [key, entry] of rateLimitStore) {
		if (now > entry.resetAt) rateLimitStore.delete(key)
	}
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const ip = getClientIp(request)
	cleanStaleEntries()

	// CORS & rate limiting for API routes
	if (pathname.startsWith('/api/')) {
		const origin = request.headers.get('origin') ?? ''
		const isDev = process.env.NODE_ENV !== 'production'
		const prodOrigins = ['https://aurasveta.ru']
		const devOrigins = [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8081',
			'http://127.0.0.1:5173',
			'http://127.0.0.1:8081',
		]
		const allowedOrigins = isDev ? [...prodOrigins, ...devOrigins] : prodOrigins
		const corsOrigin = allowedOrigins.includes(origin) ? origin : ''

		// OPTIONS preflight — return immediately with CORS headers
		if (request.method === 'OPTIONS') {
			return new NextResponse(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': corsOrigin,
					'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
					'Access-Control-Allow-Headers':
						'content-type, authorization, x-session-token, cookie',
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Max-Age': '86400',
				},
			})
		}

		// Rate limiting (runs before route handlers)
		if (pathname.startsWith('/api/upload')) {
			if (!rateLimit(`upload:${ip}`, 5, 60_000)) {
				return NextResponse.json(
					{ error: 'Слишком много запросов' },
					{ status: 429 },
				)
			}
		}

		if (
			pathname.includes('/api/trpc/auth.login') ||
			pathname.includes('/api/trpc/auth.register')
		) {
			if (!rateLimit(`auth:${ip}`, 10, 600_000)) {
				return NextResponse.json(
					{ error: 'Слишком много попыток. Попробуйте позже' },
					{ status: 429 },
				)
			}
		}

		if (pathname.includes('/api/trpc/search')) {
			if (!rateLimit(`search:${ip}`, 30, 60_000)) {
				return NextResponse.json(
					{ error: 'Слишком много запросов' },
					{ status: 429 },
				)
			}
		}

		// Don't add CORS headers here — route handlers (/api/trpc, /api/auth) add their own.
		// Adding them here would cause duplicate Access-Control-Allow-Origin, which browsers reject.
		return NextResponse.next()
	}

	// better-auth session cookie
	const sessionCookie =
		request.cookies.get('better-auth.session_token') ??
		request.cookies.get('__Secure-better-auth.session_token')

	const isAuthenticated = !!sessionCookie?.value

	// Redirect unauthenticated users away from protected routes
	if (protectedPaths.some(p => pathname.startsWith(p)) && !isAuthenticated) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('callbackUrl', pathname)
		return NextResponse.redirect(loginUrl)
	}

	// Redirect authenticated users away from auth pages
	if (authPaths.some(p => pathname.startsWith(p)) && isAuthenticated) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/api/:path*', '/admin/:path*', '/login', '/register'],
}
