import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, adminProcedure } from '../init'
import { validateWebhookUrl } from '@/shared/lib/validateUrl'

function assertSafeUrl(url: string) {
	const result = validateWebhookUrl(url)
	if (!result.valid) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: result.reason ?? 'Невалидный URL',
		})
	}
}

export const webhooksRouter = createTRPCRouter({
	getAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.webhook.findMany({
			orderBy: { createdAt: 'desc' },
		})
	}),

	create: adminProcedure
		.input(
			z.object({
				url: z.string().url(),
				events: z.array(z.string()).min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertSafeUrl(input.url)
			return ctx.prisma.webhook.create({ data: input })
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				url: z.string().url().optional(),
				events: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (input.url) assertSafeUrl(input.url)
			const { id, ...data } = input
			return ctx.prisma.webhook.update({ where: { id }, data })
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.webhook.delete({ where: { id: input } })
	}),

	test: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const webhook = await ctx.prisma.webhook.findUnique({
			where: { id: input },
		})
		if (!webhook) return { success: false, error: 'Webhook not found' }

		assertSafeUrl(webhook.url)

		try {
			const res = await fetch(webhook.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					event: 'test',
					data: { message: 'Test webhook from Аура Света CMS' },
					timestamp: new Date().toISOString(),
				}),
			})
			return { success: res.ok, status: res.status }
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error',
			}
		}
	}),
})
