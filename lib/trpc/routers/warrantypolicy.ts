import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { WarrantyScope } from '@prisma/client'
import { createTRPCRouter, adminProcedure, baseProcedure } from '../init'

const warrantyPolicyCreateSchema = z.object({
	code: z
		.string()
		.trim()
		.min(2, 'Код обязателен')
		.max(64)
		.regex(/^[a-z0-9-]+$/i, 'Код может содержать только буквы, цифры и дефис'),
	name: z.string().trim().min(2, 'Название обязательно').max(255),
	isActive: z.boolean().default(true),
	durationMonths: z.number().int().min(0).max(600).nullable().optional(),
	warrantyScope: z.nativeEnum(WarrantyScope),
	policyUrl: z.string().url('Некорректный URL политики').nullable().optional(),
	notes: z.string().trim().max(2000).nullable().optional(),
})

const warrantyPolicyUpdateSchema = warrantyPolicyCreateSchema.partial().extend({
	id: z.string(),
})

export const warrantyPolicyRouter = createTRPCRouter({
	getAll: baseProcedure.query(({ ctx }) => {
		return ctx.prisma.warrantyPolicy.findMany({
			orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
		})
	}),

	getById: baseProcedure.input(z.string()).query(({ ctx, input }) => {
		return ctx.prisma.warrantyPolicy.findUnique({ where: { id: input } })
	}),

	create: adminProcedure
		.input(warrantyPolicyCreateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.prisma.warrantyPolicy.create({
					data: {
						code: input.code,
						name: input.name,
						isActive: input.isActive,
						durationMonths: input.durationMonths ?? null,
						warrantyScope: input.warrantyScope,
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
		.input(warrantyPolicyUpdateSchema)
		.mutation(({ ctx, input }) => {
			const { id, ...data } = input
			return ctx.prisma.warrantyPolicy.update({
				where: { id },
				data: {
					...(data.code !== undefined ? { code: data.code } : {}),
					...(data.name !== undefined ? { name: data.name } : {}),
					...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
					...(data.durationMonths !== undefined
						? { durationMonths: data.durationMonths ?? null }
						: {}),
					...(data.warrantyScope !== undefined
						? { warrantyScope: data.warrantyScope }
						: {}),
					...(data.policyUrl !== undefined ? { policyUrl: data.policyUrl ?? null } : {}),
					...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
				},
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.warrantyPolicy.delete({ where: { id: input } })
	}),

	archive: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
		return ctx.prisma.warrantyPolicy.update({
			where: { id: input },
			data: {
				isActive: false,
				isDefault: false,
			},
		})
	}),

	setDefault: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.$transaction(async tx => {
			const target = await tx.warrantyPolicy.findUnique({ where: { id: input } })
			if (!target) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Policy не найдена.' })
			}

			await tx.warrantyPolicy.updateMany({
				where: { isDefault: true },
				data: { isDefault: false },
			})

			return tx.warrantyPolicy.update({
				where: { id: input },
				data: {
					isDefault: true,
					isActive: true,
				},
			})
		})
	}),
})
