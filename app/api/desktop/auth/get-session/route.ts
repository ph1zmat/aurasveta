import { NextResponse } from 'next/server'
import { getSessionFromRequestHeaders } from '@/lib/auth/request-auth'

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
	try {
		const session = await getSessionFromRequestHeaders(request.headers)
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
	} catch {
		return NextResponse.json(
			{ error: 'INTERNAL_SERVER_ERROR' },
			{
				status: 500,
				headers: { 'Access-Control-Allow-Origin': '*' },
			},
		)
	}
}

