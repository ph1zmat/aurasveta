import { adminEventBus } from '@/lib/realtime/adminevents'
import { NextResponse } from 'next/server'
import {
	getCmsRoleForUserId,
	getSessionFromRequestHeaders,
} from '@/lib/auth/request-auth'

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'content-type, authorization, x-session-token',
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: Request) {
	try {
		const session = await getSessionFromRequestHeaders(request.headers)
		if (!session?.user) {
			return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders() })
		}

		const role = await getCmsRoleForUserId(session.user.id)
		if (!role) {
			return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders() })
		}

		const testOrderId = `test-${Date.now()}`
		adminEventBus.publish({
			type: 'order.created',
			orderId: testOrderId,
			total: 1234,
			createdAt: new Date().toISOString(),
		})

		return NextResponse.json(
			{ ok: true, orderId: testOrderId },
			{ headers: corsHeaders() },
		)
	} catch {
		return NextResponse.json(
			{ error: 'INTERNAL_SERVER_ERROR' },
			{ status: 500, headers: corsHeaders() },
		)
	}
}
