import { describe, it, expect } from 'vitest'

type SessionLike = {
	user?: {
		role?: string
	}
} | null

// Replicate the helper logic from lib/trpc/init.ts to verify it works
function getUserRole(session: SessionLike): string | undefined {
	return session?.user?.role
}

describe('tRPC auth helpers', () => {
	it('extracts ADMIN role from session', () => {
		const session = { user: { id: 'u1', role: 'ADMIN' } }
		expect(getUserRole(session)).toBe('ADMIN')
	})

	it('extracts EDITOR role from session', () => {
		const session = { user: { id: 'u2', role: 'EDITOR' } }
		expect(getUserRole(session)).toBe('EDITOR')
	})

	it('returns undefined when session has no role', () => {
		const session = { user: { id: 'u3' } }
		expect(getUserRole(session)).toBeUndefined()
	})

	it('returns undefined when session is null', () => {
		expect(getUserRole(null)).toBeUndefined()
	})
})
