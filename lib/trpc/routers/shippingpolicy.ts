import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, adminProcedure, baseProcedure } from '../init'

const shippingPolicyCreateSchema = z.object({
	code: z
		.string()
		.trim()
		.min(2, 'Код обязателен')
		.max(64)
		.regex(/^[a-z0-9-]+$/i, 'Код может содержать только буквы, цифры и дефис'),
	name: z.string().trim().min(2, 'Название обязательно').max(255),
	isActive: z.boolean().default(true),
	countryCode: z.string().trim().length(2).transform(value => value.toUpperCase()),
	region: z.string().trim().max(255).nullable().optional(),
	currency: z.string().trim().length(3).transform(value => value.toUpperCase()),
	shippingRate: z.number().min(0).nullable().optional(),
	minTransitDays: z.number().int().min(0).nullable().optional(),
	maxTransitDays: z.number().int().min(0).nullable().optional(),
	freeShippingThreshold: z.number().min(0).nullable().optional(),
	policyUrl: z.string().url('Некорректный URL политики').nullable().optional(),
	notes: z.string().trim().max(2000).nullable().optional(),
})

const shippingPolicyUpdateSchema = shippingPolicyCreateSchema.partial().extend({
	id: z.string(),
})

function validateTransitWindow(input: {
	minTransitDays?: number | null
	maxTransitDays?: number | null
}) {
	if (
		input.minTransitDays != null &&
		input.maxTransitDays != null &&
		input.minTransitDays > input.maxTransitDays
	) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Минимальный срок доставки не может быть больше максимального.',
		})
	}
}

export const shippingPolicyRouter = createTRPCRouter({
	getAll: baseProcedure.query(({ ctx }) => {
		return ctx.prisma.shippingPolicy.findMany({
			orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
		})
	}),

	getById: baseProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.prisma.shippingPolicy.findUnique({ where: { id: input } })
	}),

	create: adminProcedure
		.input(shippingPolicyCreateSchema)
		.mutation(async ({ ctx, input }) => {
			validateTransitWindow(input)

			try {
				return await ctx.prisma.shippingPolicy.create({
					data: {
						code: input.code,
						name: input.name,
						isActive: input.isActive,
						countryCode: input.countryCode,
						region: input.region ?? null,
						currency: input.currency,
						shippingRate: input.shippingRate ?? null,
						minTransitDays: input.minTransitDays ?? null,
						maxTransitDays: input.maxTransitDays ?? null,
						freeShippingThreshold: input.freeShippingThreshold ?? null,
						policyUrl: input.policyUrl ?? null,
						notes: input.notes ?? null,
					},
				})
			} catch {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Не удалось создать policy. Проверьте уникальность кода.',
				})
			}
		}),

	update: adminProcedure
		.input(shippingPolicyUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			validateTransitWindow(input)

			const { id, ...data } = input

			return ctx.prisma.shippingPolicy.update({
				where: { id },
				data: {
					...(data.code !== undefined ? { code: data.code } : {}),
					...(data.name !== undefined ? { name: data.name } : {}),
					...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
					...(data.countryCode !== undefined ? { countryCode: data.countryCode } : {}),
					...(data.region !== undefined ? { region: data.region ?? null } : {}),
					...(data.currency !== undefined ? { currency: data.currency } : {}),
					...(data.shippingRate !== undefined ? { shippingRate: data.shippingRate ?? null } : {}),
					...(data.minTransitDays !== undefined ? { minTransitDays: data.minTransitDays ?? null } : {}),
					...(data.maxTransitDays !== undefined ? { maxTransitDays: data.maxTransitDays ?? null } : {}),
					...(data.freeShippingThreshold !== undefined
						? { freeShippingThreshold: data.freeShippingThreshold ?? null }
						: {}),
					...(data.policyUrl !== undefined ? { policyUrl: data.policyUrl ?? null } : {}),
					...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.shippingPolicy.delete({ where: { id: input } })
	}),

	archive: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.shippingPolicy.update({
			where: { id: input },
			data: {
				isActive: false,
				isDefault: false,
			},
		})
	}),

	setDefault: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.$transaction(async tx => {
			const target = await tx.shippingPolicy.findUnique({ where: { id: input } })
			if (!target) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Policy не найдена.' })
			}

			await tx.shippingPolicy.updateMany({
				where: { isDefault: true },
				data: { isDefault: false },
			})

			return tx.shippingPolicy.update({
				where: { id: input },
				data: {
					isDefault: true,
					isActive: true,
				},
			})
		})
	}),
})
