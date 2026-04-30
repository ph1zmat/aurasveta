import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/auth'

export const createTRPCContext = async (opts: { headers: Headers }) => {
	// Desktop app (Electron) can't reliably set/read cookies in fetch.
	// Support passing the better-auth session token via Authorization/X-Session-Token,
	// and translate it to a Cookie header for better-auth.
	const effectiveHeaders = new Headers(opts.headers)
	const tokenFromAuth =
		effectiveHeaders
			.get('authorization')
			?.match(/^Bearer\s+(.+)$/i)?.[1]
			?.trim() ??
		effectiveHeaders.get('x-session-token')?.trim() ??
		null

	if (tokenFromAuth) {
		const existingCookie = effectiveHeaders.get('cookie') ?? ''
		if (!/better-auth\.session_token=/.test(existingCookie)) {
			const cookieToAdd = `better-auth.session_token=${tokenFromAuth}`
			effectiveHeaders.set(
				'cookie',
				existingCookie ? `${existingCookie}; ${cookieToAdd}` : cookieToAdd,
			)
		}
	}

	const session = await auth.api.getSession({
		headers: effectiveHeaders,
	})

	return {
		prisma,
		session,
		userId: session?.user?.id,
	}
}

const t = initTRPC
	.context<Awaited<ReturnType<typeof createTRPCContext>>>()
	.create({
		transformer: superjson,
	})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Необходима авторизация',
		})
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			userId: ctx.session.user.id,
		},
	})
})

type SessionShape = Awaited<ReturnType<typeof auth.api.getSession>>

function getUserRole(session: SessionShape): string | undefined {
	// better-auth additionalFields injects role into session.user
	return (session?.user as Record<string, unknown>)?.role as string | undefined
}

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Необходима авторизация',
		})
	}
	const role = getUserRole(ctx.session)
	if (role !== 'ADMIN') {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Недостаточно прав' })
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			userId: ctx.session.user.id,
		},
	})
})

export const editorProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Необходима авторизация',
		})
	}
	const role = getUserRole(ctx.session)
	if (role !== 'ADMIN' && role !== 'EDITOR') {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Недостаточно прав' })
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			userId: ctx.session.user.id,
		},
	})
})
