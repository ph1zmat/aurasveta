import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'anon-session-id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function generateSessionId(): string {
	if (typeof randomUUID === 'function') {
		return randomUUID()
	}
	return randomBytes(16).toString('hex')
}

function signSessionId(sessionId: string): string {
	const secret = process.env.BETTER_AUTH_SECRET
	if (!secret) throw new Error('BETTER_AUTH_SECRET is required')
	return createHmac('sha256', secret).update(sessionId).digest('hex')
}

export async function GET() {
	const cookieStore = await cookies()
	const existing = cookieStore.get(COOKIE_NAME)

	if (existing) {
		const [sessionId, signature] = existing.value.split('.')
		if (sessionId && signature) {
			const expected = signSessionId(sessionId)
			if (
				expected.length === signature.length &&
				timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
			) {
				return NextResponse.json({ sessionId })
			}
		}
	}

	// Generate new session
	const sessionId = generateSessionId()
	const signature = signSessionId(sessionId)
	const cookieValue = `${sessionId}.${signature}`

	const response = NextResponse.json({ sessionId })
	response.cookies.set(COOKIE_NAME, cookieValue, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE,
		path: '/',
	})

	return response
}
