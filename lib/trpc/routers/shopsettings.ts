import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTRPCRouter, adminProcedure } from '../init'

const SocialLinkSchema = z.object({
	platform: z.string(),
	url: z.string(),
})

const WorkingHoursSchema = z.record(z.string(), z.string())

const ShopInfoSchema = z.object({
	phone: z.string().optional(),
	additionalPhone: z.string().optional(),
	email: z.string().optional(),
	supportEmail: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	postalCode: z.string().optional(),
	workingHours: WorkingHoursSchema.optional(),
	socialLinks: z.array(SocialLinkSchema).optional(),
	aboutUs: z.string().optional(),
	legalInfo: z.record(z.string(), z.string()).optional(),
	logoUrl: z.string().optional(),
	faviconUrl: z.string().optional(),
})

export type ShopInfo = z.infer<typeof ShopInfoSchema>

// Все поля магазина хранятся в таблице Setting с ключом "shop.info"
const SHOP_INFO_KEY = 'shop.info'

export const shopSettingsRouter = createTRPCRouter({
	getInfo: adminProcedure.query(async ({ ctx }) => {
		const setting = await ctx.prisma.setting.findUnique({
			where: { key: SHOP_INFO_KEY },
		})
		if (!setting) return null
		return setting.value as ShopInfo
	}),

	updateInfo: adminProcedure.input(ShopInfoSchema).mutation(async ({ ctx, input }) => {
		// Читаем текущее значение, чтобы сделать partial update
		const existing = await ctx.prisma.setting.findUnique({
			where: { key: SHOP_INFO_KEY },
		})
		const current = (existing?.value ?? {}) as ShopInfo
		const merged = { ...current, ...input }

		await ctx.prisma.setting.upsert({
			where: { key: SHOP_INFO_KEY },
			create: {
				key: SHOP_INFO_KEY,
				value: merged as never,
				type: 'json',
				isPublic: false,
				group: 'shop',
				description: 'Бизнес-информация о магазине',
			},
			update: {
				value: merged as never,
			},
		})

		revalidatePath('/', 'layout')
		return merged
	}),
})
