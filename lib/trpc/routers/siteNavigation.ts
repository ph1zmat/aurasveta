import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SiteNavZone } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'

// ─── Zod schemas ────────────────────────────────────────────────────────────

const zoneValues = Object.values(SiteNavZone) as [SiteNavZone, ...SiteNavZone[]]

const navItemInputSchema = z.object({
	pageId: z.string().min(1),
	zone: z.enum(zoneValues),
	order: z.number().int().min(0).optional().default(0),
	labelOverride: z.string().optional().nullable(),
	isVisible: z.boolean().optional().default(true),
})

const visibilityConfigSchema = z.object({
	showPhone: z.boolean().optional(),
	showAdditionalPhone: z.boolean().optional(),
	showEmail: z.boolean().optional(),
	showAddress: z.boolean().optional(),
	showWorkingHours: z.boolean().optional(),
	showSocialLinks: z.boolean().optional(),
})

// ─── Router ─────────────────────────────────────────────────────────────────

export const siteNavigationRouter = createTRPCRouter({
	/**
	 * Public: полный конфиг layout для header/footer (ссылки + visibility).
	 * Используется в layout.tsx (Server Component) и виджетах.
	 */
	getPublicLayoutConfig: baseProcedure.query(async ({ ctx }) => {
		const [navItems, storeSettings] = await Promise.all([
			ctx.prisma.siteNavItem.findMany({
				where: { isVisible: true },
				include: {
					page: {
						select: {
							id: true,
							title: true,
							slug: true,
							status: true,
						},
					},
				},
				orderBy: [{ zone: 'asc' }, { order: 'asc' }],
			}),
			ctx.prisma.storeSettings.findUnique({ where: { id: 1 } }),
		])

		// Для публичной навигации выбираем данные ПО ЗОНАМ:
		// если в зоне есть опубликованные элементы — показываем их,
		// иначе (например, после первичного seed) показываем видимые DRAFT в этой зоне.
		const sourceItems = (Object.values(SiteNavZone) as SiteNavZone[]).flatMap(
			zone => {
				const zoneItems = navItems.filter(item => item.zone === zone)
				const publishedZoneItems = zoneItems.filter(
					item => item.page.status === 'PUBLISHED',
				)
				return publishedZoneItems.length > 0 ? publishedZoneItems : zoneItems
			},
		)

		const headerConfig =
			(storeSettings?.headerConfig as Record<string, unknown> | null) ?? {}
		const footerConfig =
			(storeSettings?.footerConfig as Record<string, unknown> | null) ?? {}

		return {
			navItems: sourceItems.map(item => ({
				id: item.id,
				pageId: item.pageId,
				zone: item.zone,
				order: item.order,
				label: item.labelOverride ?? item.page.title,
				href: `/pages/${item.page.slug}`,
			})),
			store: {
				phone: storeSettings?.phone ?? null,
				additionalPhone: storeSettings?.additionalPhone ?? null,
				email: storeSettings?.email ?? null,
				address: storeSettings?.address ?? null,
				city: storeSettings?.city ?? null,
				workingHours:
					(storeSettings?.workingHours as Record<string, string> | null) ?? {},
				socialLinks:
					(storeSettings?.socialLinks as Array<{
						platform: string
						url: string
					}> | null) ?? [],
			},
			headerVisibility: {
				showPhone: headerConfig.showPhone !== false,
				showAdditionalPhone: headerConfig.showAdditionalPhone !== false,
				showEmail: Boolean(headerConfig.showEmail),
				showAddress: Boolean(headerConfig.showAddress),
				showWorkingHours: headerConfig.showWorkingHours !== false,
				showSocialLinks: Boolean(headerConfig.showSocialLinks),
			},
			footerVisibility: {
				showPhone: footerConfig.showPhone !== false,
				showAdditionalPhone: footerConfig.showAdditionalPhone !== false,
				showEmail: footerConfig.showEmail !== false,
				showAddress: footerConfig.showAddress !== false,
				showWorkingHours: footerConfig.showWorkingHours !== false,
				showSocialLinks: footerConfig.showSocialLinks !== false,
			},
		}
	}),

	/**
	 * Admin: список страниц подходящих для навигации (только PUBLISHED + DRAFT).
	 */
	listPagesForNav: adminProcedure.query(async ({ ctx }) => {
		return ctx.prisma.page.findMany({
			where: {
				status: { in: ['PUBLISHED', 'DRAFT'] },
				isSystem: false,
			},
			select: {
				id: true,
				title: true,
				slug: true,
				status: true,
				kind: true,
			},
			orderBy: { title: 'asc' },
		})
	}),

	/**
	 * Admin: полный конфиг для редактора (включая скрытые).
	 */
	getLayoutConfig: adminProcedure.query(async ({ ctx }) => {
		const [navItems, storeSettings] = await Promise.all([
			ctx.prisma.siteNavItem.findMany({
				include: {
					page: {
						select: { id: true, title: true, slug: true, status: true },
					},
				},
				orderBy: [{ zone: 'asc' }, { order: 'asc' }],
			}),
			ctx.prisma.storeSettings.findUnique({ where: { id: 1 } }),
		])

		return {
			navItems: navItems.map(item => ({
				id: item.id,
				pageId: item.pageId,
				zone: item.zone,
				order: item.order,
				labelOverride: item.labelOverride,
				isVisible: item.isVisible,
				page: item.page,
			})),
			headerConfig:
				(storeSettings?.headerConfig as Record<string, unknown> | null) ?? {},
			footerConfig:
				(storeSettings?.footerConfig as Record<string, unknown> | null) ?? {},
		}
	}),

	/**
	 * Admin: сохранить все nav-элементы конкретной зоны (bulk replace).
	 */
	saveZoneItems: adminProcedure
		.input(
			z.object({
				zone: z.enum(zoneValues),
				items: z.array(navItemInputSchema),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { zone, items } = input

			// Нормализуем order
			const normalized = items.map((item, idx) => ({
				...item,
				order: idx,
				zone,
			}))

			await ctx.prisma.$transaction(async tx => {
				// Удаляем старые записи зоны
				await tx.siteNavItem.deleteMany({ where: { zone } })

				// Создаём новые
				if (normalized.length > 0) {
					await tx.siteNavItem.createMany({
						data: normalized.map(item => ({
							pageId: item.pageId,
							zone: item.zone,
							order: item.order,
							labelOverride: item.labelOverride ?? null,
							isVisible: item.isVisible,
						})),
					})
				}
			})

			revalidatePath('/', 'layout')
			return { success: true }
		}),

	/**
	 * Admin: обновить видимость инфо-элементов для header/footer.
	 */
	saveVisibilityConfig: adminProcedure
		.input(
			z.object({
				header: visibilityConfigSchema.optional(),
				footer: visibilityConfigSchema.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.prisma.storeSettings.findUnique({
				where: { id: 1 },
			})

			const currentHeader =
				(existing?.headerConfig as Record<string, unknown> | null) ?? {}
			const currentFooter =
				(existing?.footerConfig as Record<string, unknown> | null) ?? {}

			const newHeader = input.header
				? { ...currentHeader, ...input.header }
				: currentHeader
			const newFooter = input.footer
				? { ...currentFooter, ...input.footer }
				: currentFooter

			await ctx.prisma.storeSettings.upsert({
				where: { id: 1 },
				create: {
					id: 1,
					phone: '',
					email: '',
					address: '',
					headerConfig: newHeader as never,
					footerConfig: newFooter as never,
				},
				update: {
					headerConfig: newHeader as never,
					footerConfig: newFooter as never,
				},
			})

			revalidatePath('/', 'layout')
			return { success: true }
		}),
})
