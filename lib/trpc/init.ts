import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/auth'

export const createTRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth.api.getSession({
		headers: opts.headers,
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

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Необходима авторизация',
		})
	}
	const user = await ctx.prisma.user.findUnique({
		where: { id: ctx.session.user.id },
		select: { role: true },
	})
	if (user?.role !== 'ADMIN') {
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
	const user = await ctx.prisma.user.findUnique({
		where: { id: ctx.session.user.id },
		select: { role: true },
	})
	if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR') {
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
