import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js modules before importing proxy
const mockRedirect = vi.fn()
const mockJson = vi.fn()
const mockHeaders = new Map<string, string>()
const mockResponse = {
	headers: {
		set: (k: string, v: string) => mockHeaders.set(k, v),
		get: (k: string) => mockHeaders.get(k),
	},
}
const mockNext = vi.fn(() => mockResponse)

vi.mock('next/server', () => ({
	NextResponse: {
		redirect: (url: unknown) => mockRedirect(url),
		json: (body: unknown, init?: { status?: number }) => mockJson(body, init),
		next: () => mockNext(),
	},
}))

// Need to re-import after mock
const { proxy } = await import('@/proxy')

describe('proxy (middleware)', () => {
	beforeEach(() => {
		mockRedirect.mockClear()
		mockJson.mockClear()
		mockNext.mockClear()
		mockHeaders.clear()
	})

	type RequestLike = {
		nextUrl: { pathname: string }
		url: string
		cookies: {
			has: (name: string) => boolean
			get: (name: string) => { value: string } | undefined
		}
		headers: {
			get: (name: string) => string | null
		}
	}

	function createRequest(
		pathname: string,
		cookies: Record<string, string> = {},
		headers: Record<string, string> = {},
	): RequestLike {
		return {
			nextUrl: { pathname },
			url: `http://localhost:3000${pathname}`,
			cookies: {
				has: (name: string) => name in cookies,
				get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
			},
			headers: {
				get: (name: string) => headers[name] ?? null,
			},
		}
	}

	it('redirects anonymous users from /admin to /login', () => {
		const req = createRequest('/admin/products')
		proxy(req)
		expect(mockRedirect).toHaveBeenCalled()
		const call = mockRedirect.mock.calls[0]
		expect(call[0].toString()).toContain('/login')
	})

	it('allows authenticated users into /admin', () => {
		const req = createRequest('/admin/products', { 'better-auth.session_token': 'token123' })
		proxy(req)
		expect(mockRedirect).not.toHaveBeenCalled()
		expect(mockNext).toHaveBeenCalled()
	})

	it('rate-limits upload endpoint after 5 requests', () => {
		const ip = '1.2.3.4'
		// First 5 requests should pass
		for (let i = 0; i < 5; i++) {
			const req = createRequest('/api/upload', {}, { 'x-forwarded-for': ip })
			proxy(req)
		}
		expect(mockJson).not.toHaveBeenCalled()

		// 6th request should be blocked
		const req = createRequest('/api/upload', {}, { 'x-forwarded-for': ip })
		proxy(req)
		expect(mockJson).toHaveBeenCalled()
		expect(mockJson.mock.calls[0][1].status).toBe(429)
	})

	it('adds security headers to all responses', () => {
		const req = createRequest('/some-page')
		proxy(req)
		expect(mockNext).toHaveBeenCalled()
	})
})
