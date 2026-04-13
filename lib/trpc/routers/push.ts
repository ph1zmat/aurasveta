import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'

export const pushRouter = createTRPCRouter({
	/** Зарегистрировать устройство для push-уведомлений */
	register: protectedProcedure
		.input(
			z.object({
				platform: z.enum(['FCM', 'WEB_PUSH']),
				token: z.string().min(1),
				endpoint: z.string().optional(),
				p256dh: z.string().optional(),
				authKey: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.pushDevice.upsert({
				where: { token: input.token },
				create: {
					userId: ctx.userId,
					platform: input.platform,
					token: input.token,
					endpoint: input.endpoint ?? null,
					p256dh: input.p256dh ?? null,
					authKey: input.authKey ?? null,
					active: true,
				},
				update: {
					userId: ctx.userId,
					active: true,
					endpoint: input.endpoint ?? undefined,
					p256dh: input.p256dh ?? undefined,
					authKey: input.authKey ?? undefined,
				},
			})
		}),

	/** Отключить устройство от push-уведомлений */
	unregister: protectedProcedure
		.input(z.object({ token: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.pushDevice.updateMany({
				where: { token: input.token, userId: ctx.userId },
				data: { active: false },
			})
			return { success: true }
		}),

	/** Получить список устройств текущего пользователя */
	getMyDevices: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.pushDevice.findMany({
			where: { userId: ctx.userId, active: true },
			select: { id: true, platform: true, createdAt: true },
		})
	}),
})
