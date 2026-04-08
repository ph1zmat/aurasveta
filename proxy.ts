import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/admin']
const authPaths = ['/login', '/register']

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

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
	matcher: ['/admin/:path*', '/login', '/register'],
}
