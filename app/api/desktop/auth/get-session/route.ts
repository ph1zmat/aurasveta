import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

function getTokenFromRequestHeaders(headers: Headers): string | null {
	const authHeader = headers.get('authorization')
	const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
	if (bearer) return bearer
	const xToken = headers.get('x-session-token')?.trim()
	return xToken || null
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
		},
	})
}

export async function GET(request: Request) {
	const token = getTokenFromRequestHeaders(request.headers)
	if (!token) {
		return NextResponse.json(
			{ error: 'UNAUTHORIZED' },
			{
				status: 401,
				headers: { 'Access-Control-Allow-Origin': '*' },
			},
		)
	}

	const headers = new Headers()
	headers.set('cookie', `better-auth.session_token=${token}`)

	const session = await auth.api.getSession({ headers })
	if (!session?.user) {
		return NextResponse.json(
			{ error: 'UNAUTHORIZED' },
			{
				status: 401,
				headers: { 'Access-Control-Allow-Origin': '*' },
			},
		)
	}

	return NextResponse.json(session, {
		headers: { 'Access-Control-Allow-Origin': '*' },
	})
}

