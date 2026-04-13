import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'anon-session-id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function generateSessionId(): string {
	return crypto.randomUUID()
}

function signSessionId(sessionId: string): string {
	const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret'
	return crypto.createHmac('sha256', secret).update(sessionId).digest('hex')
}

export async function GET() {
	const cookieStore = await cookies()
	const existing = cookieStore.get(COOKIE_NAME)

	if (existing) {
		const [sessionId, signature] = existing.value.split('.')
		if (sessionId && signature && signSessionId(sessionId) === signature) {
			return NextResponse.json({ sessionId })
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
