import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	API_CORS_ALLOWED_ORIGINS,
	getAllowedOrigin,
} from '@/lib/config/origins'

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

/*
 * CORS helper for API routes
 */
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
	const origin = getAllowedOrigin(
		request.headers.get('origin'),
		API_CORS_ALLOWED_ORIGINS,
	)
	if (origin) {
		response.headers.set('Access-Control-Allow-Origin', origin)
		response.headers.set('Access-Control-Allow-Credentials', 'true')
		response.headers.set(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, OPTIONS, PATCH',
		)
		response.headers.set(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization, X-Session-Token',
		)
	}
	return response
}

function addSecurityHeaders(response: NextResponse): NextResponse {
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-XSS-Protection', '1; mode=block')
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
	return response
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const host = request.headers.get('host') ?? ''
	const ip = getClientIp(request)
	cleanStaleEntries()

	// Canonical host redirect: www -> non-www
	if (host.toLowerCase().startsWith('www.aurasveta.by')) {
		const targetUrl = new URL(request.url)
		targetUrl.hostname = 'aurasveta.by'
		targetUrl.protocol = 'https:'
		return NextResponse.redirect(targetUrl, 301)
	}

	// ── CORS & rate limiting for API routes ──
	if (pathname.startsWith('/api/')) {
		const origin = request.headers.get('origin') ?? ''
		const corsOrigin = getAllowedOrigin(origin, API_CORS_ALLOWED_ORIGINS)

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
			pathname.includes('/api/trpc/auth.register') ||
			pathname.includes('auth.signIn') ||
			pathname.includes('auth.signUp')
		) {
			if (!rateLimit(`auth:${ip}`, 10, 600_000)) {
				return NextResponse.json(
					{ error: 'Слишком много попыток. Попробуйте позже' },
					{ status: 429 },
				)
			}
		}

		if (pathname.includes('/api/trpc/search') || pathname.includes('search')) {
			if (!rateLimit(`search:${ip}`, 30, 60_000)) {
				return NextResponse.json(
					{ error: 'Слишком много запросов' },
					{ status: 429 },
				)
			}
		}
	}

	// better-auth session cookie
	const sessionCookie =
		request.cookies.get('better-auth.session_token') ??
		request.cookies.get('__Secure-better-auth.session_token')

	const isAuthenticated = !!sessionCookie?.value

	// Redirect unauthenticated users away from protected routes
	if (protectedPaths.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('callbackUrl', pathname)
		return NextResponse.redirect(loginUrl)
	}

	// Redirect authenticated users away from auth pages
	if (authPaths.some((p) => pathname.startsWith(p)) && isAuthenticated) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	const response = NextResponse.next()

	// Security headers
	addSecurityHeaders(response)

	// CORS
	if (pathname.startsWith('/api/')) {
		addCorsHeaders(response, request)
	}

	return response
}



