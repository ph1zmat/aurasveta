import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { createTRPCRouter, adminProcedure } from '../../init'

const socialLinkSchema = z.object({
	platform: z.string().min(1),
	url: z.string().url(),
})

const workingHoursSchema = z.record(z.string(), z.string())
const legalInfoSchema = z.record(z.string(), z.string())

const updateStoreSettingsSchema = z.object({
	phone: z.string().min(1).optional(),
	additionalPhone: z.string().optional().nullable(),
	email: z.string().email().optional(),
	supportEmail: z.string().email().optional().nullable(),
	address: z.string().min(1).optional(),
	city: z.string().optional().nullable(),
	postalCode: z.string().optional().nullable(),
	workingHours: workingHoursSchema.optional(),
	socialLinks: z.array(socialLinkSchema).optional(),
	aboutUs: z.string().optional().nullable(),
	legalInfo: legalInfoSchema.optional().nullable(),
	logoUrl: z.string().optional().nullable(),
	faviconUrl: z.string().optional().nullable(),
})

export const settingsBusinessRouter = createTRPCRouter({
	getInfo: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.storeSettings.findUnique({ where: { id: 1 } })
	}),

	updateInfo: adminProcedure
		.input(updateStoreSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.prisma.storeSettings.findUnique({ where: { id: 1 } })

			const currentWorkingHours =
				existing && typeof existing.workingHours === 'object' && existing.workingHours
					? (existing.workingHours as Record<string, string>)
					: {}

			const currentSocialLinks =
				existing && Array.isArray(existing.socialLinks)
					? (existing.socialLinks as Array<{ platform: string; url: string }>)
					: []

			const mergedWorkingHours = input.workingHours ?? currentWorkingHours
			const mergedSocialLinks = input.socialLinks ?? currentSocialLinks
			const legalInfoValue =
				input.legalInfo === undefined
					? existing?.legalInfo === null
						? Prisma.DbNull
						: existing?.legalInfo
					: input.legalInfo === null
						? Prisma.DbNull
						: input.legalInfo

			const baseData = {
				phone: input.phone,
				additionalPhone: input.additionalPhone,
				email: input.email,
				supportEmail: input.supportEmail,
				address: input.address,
				city: input.city,
				postalCode: input.postalCode,
				workingHours: mergedWorkingHours,
				socialLinks: mergedSocialLinks,
				aboutUs: input.aboutUs,
				legalInfo: legalInfoValue,
				logoUrl: input.logoUrl,
				faviconUrl: input.faviconUrl,
			}

			const updated = await ctx.prisma.storeSettings.upsert({
				where: { id: 1 },
				create: {
					id: 1,
					phone: baseData.phone ?? '',
					email: baseData.email ?? '',
					address: baseData.address ?? '',
					additionalPhone: baseData.additionalPhone ?? null,
					supportEmail: baseData.supportEmail ?? null,
					city: baseData.city ?? null,
					postalCode: baseData.postalCode ?? null,
					workingHours: baseData.workingHours,
					socialLinks: baseData.socialLinks,
					aboutUs: baseData.aboutUs ?? null,
					legalInfo: baseData.legalInfo ?? Prisma.DbNull,
					logoUrl: baseData.logoUrl ?? null,
					faviconUrl: baseData.faviconUrl ?? null,
				},
				update: {
					phone: baseData.phone,
					additionalPhone: baseData.additionalPhone,
					email: baseData.email,
					supportEmail: baseData.supportEmail,
					address: baseData.address,
					city: baseData.city,
					postalCode: baseData.postalCode,
					workingHours: baseData.workingHours,
					socialLinks: baseData.socialLinks,
					aboutUs: baseData.aboutUs,
					legalInfo: baseData.legalInfo,
					logoUrl: baseData.logoUrl,
					faviconUrl: baseData.faviconUrl,
				},
			})

			revalidatePath('/admin/settings')
			revalidatePath('/')
			return updated
		}),
})
