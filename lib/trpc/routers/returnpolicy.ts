import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
	ReturnFees,
	ReturnMethod,
	ReturnPolicyCategory,
} from '@prisma/client'
import { createTRPCRouter, adminProcedure, baseProcedure } from '../init'

const returnPolicyCreateSchema = z.object({
	code: z
		.string()
		.trim()
		.min(2, 'Код обязателен')
		.max(64)
		.regex(/^[a-z0-9-]+$/i, 'Код может содержать только буквы, цифры и дефис'),
	name: z.string().trim().min(2, 'Название обязательно').max(255),
	isActive: z.boolean().default(true),
	returnPolicyCategory: z.nativeEnum(ReturnPolicyCategory),
	merchantReturnDays: z.number().int().min(0).max(3650).nullable().optional(),
	returnMethod: z.nativeEnum(ReturnMethod),
	returnFees: z.nativeEnum(ReturnFees),
	policyUrl: z.string().url('Некорректный URL политики').nullable().optional(),
	notes: z.string().trim().max(2000).nullable().optional(),
})

const returnPolicyUpdateSchema = returnPolicyCreateSchema.partial().extend({
	id: z.string(),
})

function validateReturnWindow(input: {
	returnPolicyCategory?: ReturnPolicyCategory
	merchantReturnDays?: number | null
}) {
	if (
		input.returnPolicyCategory === ReturnPolicyCategory.FINITE_WINDOW &&
		(input.merchantReturnDays == null || input.merchantReturnDays < 1)
	) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Для FINITE_WINDOW нужно указать merchantReturnDays > 0.',
		})
	}
}

export const returnPolicyRouter = createTRPCRouter({
	getAll: baseProcedure.query(({ ctx }) => {
		return ctx.prisma.returnPolicy.findMany({
			orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
		})
	}),

	getById: baseProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.prisma.returnPolicy.findUnique({ where: { id: input } })
	}),

	create: adminProcedure
		.input(returnPolicyCreateSchema)
		.mutation(async ({ ctx, input }) => {
			validateReturnWindow(input)

			try {
				return await ctx.prisma.returnPolicy.create({
					data: {
						code: input.code,
						name: input.name,
						isActive: input.isActive,
						returnPolicyCategory: input.returnPolicyCategory,
						merchantReturnDays: input.merchantReturnDays ?? null,
						returnMethod: input.returnMethod,
						returnFees: input.returnFees,
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
		.input(returnPolicyUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			validateReturnWindow(input)

			const { id, ...data } = input

			return ctx.prisma.returnPolicy.update({
				where: { id },
				data: {
					...(data.code !== undefined ? { code: data.code } : {}),
					...(data.name !== undefined ? { name: data.name } : {}),
					...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
					...(data.returnPolicyCategory !== undefined
						? { returnPolicyCategory: data.returnPolicyCategory }
						: {}),
					...(data.merchantReturnDays !== undefined
						? { merchantReturnDays: data.merchantReturnDays ?? null }
						: {}),
					...(data.returnMethod !== undefined ? { returnMethod: data.returnMethod } : {}),
					...(data.returnFees !== undefined ? { returnFees: data.returnFees } : {}),
					...(data.policyUrl !== undefined ? { policyUrl: data.policyUrl ?? null } : {}),
					...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.returnPolicy.delete({ where: { id: input } })
	}),

	archive: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.returnPolicy.update({
			where: { id: input },
			data: {
				isActive: false,
				isDefault: false,
			},
		})
	}),

	setDefault: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.$transaction(async tx => {
			const target = await tx.returnPolicy.findUnique({ where: { id: input } })
			if (!target) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Policy не найдена.' })
			}

			await tx.returnPolicy.updateMany({
				where: { isDefault: true },
				data: { isDefault: false },
			})

			return tx.returnPolicy.update({
				where: { id: input },
				data: {
					isDefault: true,
					isActive: true,
				},
			})
		})
	}),
})
