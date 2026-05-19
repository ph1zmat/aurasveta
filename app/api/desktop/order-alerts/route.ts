import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCmsAccessFromRequestHeaders } from '@/lib/auth/request-auth'

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

function responseHeaders() {
	return {
		...corsHeaders(),
		'Cache-Control': 'no-store',
	}
}

function parseSince(value: string | null) {
	if (!value) {
		return null
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: Request) {
	try {
		const access = await getCmsAccessFromRequestHeaders(request.headers)
		if (!access) {
			return NextResponse.json(
				{ error: 'UNAUTHORIZED' },
				{ status: 401, headers: responseHeaders() },
			)
		}

		const { searchParams } = new URL(request.url)
		const bootstrap = searchParams.get('bootstrap') === '1'
		const sinceParam = searchParams.get('since')
		const since = parseSince(sinceParam)

		if (sinceParam && !since) {
			return NextResponse.json(
				{ error: 'INVALID_SINCE_CURSOR' },
				{ status: 400, headers: responseHeaders() },
			)
		}

		const cursor = new Date().toISOString()

		if (bootstrap || !since) {
			return NextResponse.json(
				{ items: [], cursor },
				{ headers: responseHeaders() },
			)
		}

		const items = await prisma.order.findMany({
			where: {
				createdAt: { gte: since },
			},
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
			take: 100,
			select: {
				id: true,
				total: true,
				createdAt: true,
			},
		})

		return NextResponse.json(
			{
				items: items.map(item => ({
					orderId: item.id,
					total: item.total,
					createdAt: item.createdAt.toISOString(),
				})),
				cursor,
			},
			{ headers: responseHeaders() },
		)
	} catch {
		return NextResponse.json(
			{ error: 'INTERNAL_SERVER_ERROR' },
			{ status: 500, headers: responseHeaders() },
		)
	}
}