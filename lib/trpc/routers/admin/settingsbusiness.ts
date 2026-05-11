import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { Prisma, type StoreSettings } from '@prisma/client'
import { createTRPCRouter, adminProcedure, baseProcedure } from '../../init'

const socialLinkSchema = z.object({
	platform: z.string().min(1),
	url: z.string().url(),
})

const SHOP_INFO_KEY = 'shop.info'

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

type LegacyShopInfo = {
	phone?: string | null
	additionalPhone?: string | null
	email?: string | null
	supportEmail?: string | null
	address?: string | null
	city?: string | null
	postalCode?: string | null
	workingHours?: Record<string, string> | null
	socialLinks?: Array<{ platform: string; url: string }> | null
	aboutUs?: string | null
	legalInfo?: Record<string, string> | null
	logoUrl?: string | null
	faviconUrl?: string | null
}

function asStringRecord(value: unknown): Record<string, string> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string',
		),
	)
}

function asSocialLinks(
	value: unknown,
): Array<{ platform: string; url: string }> | null {
	if (!Array.isArray(value)) return null
	return value.flatMap(item => {
		if (
			item &&
			typeof item === 'object' &&
			'platform' in item &&
			'url' in item &&
			typeof item.platform === 'string' &&
			typeof item.url === 'string'
		) {
			return [{ platform: item.platform, url: item.url }]
		}
		return []
	})
}

function getLegacyShopInfo(value: unknown): LegacyShopInfo | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	const record = value as Record<string, unknown>
	return {
		phone: typeof record.phone === 'string' ? record.phone : null,
		additionalPhone:
			typeof record.additionalPhone === 'string' ? record.additionalPhone : null,
		email: typeof record.email === 'string' ? record.email : null,
		supportEmail:
			typeof record.supportEmail === 'string' ? record.supportEmail : null,
		address: typeof record.address === 'string' ? record.address : null,
		city: typeof record.city === 'string' ? record.city : null,
		postalCode: typeof record.postalCode === 'string' ? record.postalCode : null,
		workingHours: asStringRecord(record.workingHours),
		socialLinks: asSocialLinks(record.socialLinks),
		aboutUs: typeof record.aboutUs === 'string' ? record.aboutUs : null,
		legalInfo: asStringRecord(record.legalInfo),
		logoUrl: typeof record.logoUrl === 'string' ? record.logoUrl : null,
		faviconUrl: typeof record.faviconUrl === 'string' ? record.faviconUrl : null,
	}
}

function pickNonEmptyString(
	...values: Array<string | null | undefined>
): string | null {
	for (const value of values) {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value
		}
	}
	return null
}

function pickNonEmptyRecord(
	...values: Array<Record<string, string> | null | undefined>
): Record<string, string> {
	for (const value of values) {
		if (value && Object.keys(value).length > 0) {
			return value
		}
	}
	return {}
}

function pickNonEmptySocialLinks(
	...values: Array<Array<{ platform: string; url: string }> | null | undefined>
): Array<{ platform: string; url: string }> {
	for (const value of values) {
		if (value && value.length > 0) {
			return value
		}
	}
	return []
}

function mergeSettingsSources(
	storeSettings: StoreSettings | null,
	legacy: LegacyShopInfo | null,
) {
	const storeWorkingHours = asStringRecord(storeSettings?.workingHours)
	const storeLegalInfo = asStringRecord(storeSettings?.legalInfo)
	const storeSocialLinks = asSocialLinks(storeSettings?.socialLinks)

	return {
		phone: pickNonEmptyString(storeSettings?.phone, legacy?.phone) ?? '',
		additionalPhone:
			pickNonEmptyString(storeSettings?.additionalPhone, legacy?.additionalPhone) ??
			null,
		email: pickNonEmptyString(storeSettings?.email, legacy?.email) ?? '',
		supportEmail:
			pickNonEmptyString(storeSettings?.supportEmail, legacy?.supportEmail) ?? null,
		address: pickNonEmptyString(storeSettings?.address, legacy?.address) ?? '',
		city: pickNonEmptyString(storeSettings?.city, legacy?.city) ?? null,
		postalCode:
			pickNonEmptyString(storeSettings?.postalCode, legacy?.postalCode) ?? null,
		workingHours: pickNonEmptyRecord(storeWorkingHours, legacy?.workingHours),
		socialLinks: pickNonEmptySocialLinks(storeSocialLinks, legacy?.socialLinks),
		aboutUs: pickNonEmptyString(storeSettings?.aboutUs, legacy?.aboutUs) ?? null,
		legalInfo: pickNonEmptyRecord(storeLegalInfo, legacy?.legalInfo),
		logoUrl: pickNonEmptyString(storeSettings?.logoUrl, legacy?.logoUrl) ?? null,
		faviconUrl:
			pickNonEmptyString(storeSettings?.faviconUrl, legacy?.faviconUrl) ?? null,
	}
}

function toLegacyShopInfoPayload(storeSettings: StoreSettings) {
	return {
		phone: storeSettings.phone,
		additionalPhone: storeSettings.additionalPhone,
		email: storeSettings.email,
		supportEmail: storeSettings.supportEmail,
		address: storeSettings.address,
		city: storeSettings.city,
		postalCode: storeSettings.postalCode,
		workingHours: asStringRecord(storeSettings.workingHours) ?? {},
		socialLinks: asSocialLinks(storeSettings.socialLinks) ?? [],
		aboutUs: storeSettings.aboutUs,
		legalInfo: asStringRecord(storeSettings.legalInfo) ?? {},
		logoUrl: storeSettings.logoUrl,
		faviconUrl: storeSettings.faviconUrl,
	}
}

export const settingsBusinessRouter = createTRPCRouter({
	/**
	 * Публичный endpoint — безопасные данные магазина без adminProcedure.
	 * Возвращает только публичные контактные поля.
	 */
	getPublic: baseProcedure.query(async ({ ctx }) => {
		const settings = await ctx.prisma.storeSettings.findUnique({ where: { id: 1 } })
		if (!settings) {
			const legacy = await ctx.prisma.setting.findUnique({ where: { key: SHOP_INFO_KEY } })
			if (!legacy) return null
			const info = getLegacyShopInfo(legacy.value)
			if (!info) return null
			return {
				phone: info.phone ?? null,
				additionalPhone: info.additionalPhone ?? null,
				email: info.email ?? null,
				address: info.address ?? null,
				city: info.city ?? null,
				workingHours: info.workingHours ?? {},
				socialLinks: info.socialLinks ?? [],
				logoUrl: info.logoUrl ?? null,
			}
		}
		return {
			phone: settings.phone,
			additionalPhone: settings.additionalPhone,
			email: settings.email,
			address: settings.address,
			city: settings.city,
			workingHours: asStringRecord(settings.workingHours),
			socialLinks: asSocialLinks(settings.socialLinks),
			logoUrl: settings.logoUrl,
		}
	}),

	getInfo: adminProcedure.query(async ({ ctx }) => {
		const [storeSettings, legacySetting] = await Promise.all([
			ctx.prisma.storeSettings.findUnique({ where: { id: 1 } }),
			ctx.prisma.setting.findUnique({ where: { key: SHOP_INFO_KEY } }),
		])

		if (!storeSettings && !legacySetting) return null

		return mergeSettingsSources(
			storeSettings,
			getLegacyShopInfo(legacySetting?.value),
		)
	}),

	updateInfo: adminProcedure
		.input(updateStoreSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			const [existing, legacySetting] = await Promise.all([
				ctx.prisma.storeSettings.findUnique({ where: { id: 1 } }),
				ctx.prisma.setting.findUnique({ where: { key: SHOP_INFO_KEY } }),
			])
			const legacy = getLegacyShopInfo(legacySetting?.value)

			const currentWorkingHours =
				asStringRecord(existing?.workingHours) ?? legacy?.workingHours ?? {}

			const currentSocialLinks =
				asSocialLinks(existing?.socialLinks) ?? legacy?.socialLinks ?? []

			const mergedWorkingHours = input.workingHours ?? currentWorkingHours
			const mergedSocialLinks = input.socialLinks ?? currentSocialLinks
			const currentLegalInfo =
				asStringRecord(existing?.legalInfo) ?? legacy?.legalInfo ?? {}

			const legalInfoValue =
				input.legalInfo === undefined
					? existing?.legalInfo === null
						? Object.keys(currentLegalInfo).length > 0
							? currentLegalInfo
							: Prisma.DbNull
						: existing?.legalInfo ??
							(Object.keys(currentLegalInfo).length > 0
								? currentLegalInfo
								: Prisma.DbNull)
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
					phone: baseData.phone ?? legacy?.phone ?? '',
					email: baseData.email ?? legacy?.email ?? '',
					address: baseData.address ?? legacy?.address ?? '',
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

			await ctx.prisma.setting.upsert({
				where: { key: SHOP_INFO_KEY },
				create: {
					key: SHOP_INFO_KEY,
					value: toLegacyShopInfoPayload(updated) as never,
					type: 'json',
					isPublic: false,
					group: 'shop',
					description: 'Бизнес-информация о магазине',
				},
				update: {
					value: toLegacyShopInfoPayload(updated) as never,
					type: 'json',
					isPublic: false,
					group: 'shop',
					description: 'Бизнес-информация о магазине',
				},
			})

			revalidatePath('/admin/settings')
			revalidatePath('/')
			revalidatePath('/', 'layout')
			return updated
		}),
})
