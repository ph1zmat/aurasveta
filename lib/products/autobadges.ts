import type { Prisma, PrismaClient } from '@prisma/client'

type ProductWithBadgeSource = {
	id: string
	createdAt: Date | string
	price?: number | null
	compareAtPrice?: number | null
	badges?: unknown
}

type PropertySignal = {
	propertySlug: string
	propertyName: string
	valueSlug: string
	value: string
}

export type ProductWithAutoBadges<T extends ProductWithBadgeSource> = Omit<
	T,
	'badges'
> & {
	badges: string[]
}

const MANAGED_BADGES = new Set(['Хит', 'Новинка', 'LED', 'Smart', 'Акция', 'Скидка'])

const DEFAULT_AUTO_BADGE_SETTINGS = {
	newWindowDays: 2,
	hitWindowDays: 30,
	hitMinViews: 20,
	hitMinOrders: 3,
	enableHit: true,
	enableNew: true,
	enableLed: true,
	enableSmart: true,
	enableSale: true,
} as const

const AUTO_BADGE_SETTING_KEYS = {
	newWindowDays: 'autoBadges.newWindowDays',
	hitWindowDays: 'autoBadges.hitWindowDays',
	hitMinViews: 'autoBadges.hitMinViews',
	hitMinOrders: 'autoBadges.hitMinOrders',
	enableHit: 'autoBadges.enableHit',
	enableNew: 'autoBadges.enableNew',
	enableLed: 'autoBadges.enableLed',
	enableSmart: 'autoBadges.enableSmart',
	enableSale: 'autoBadges.enableSale',
} as const

export type AutoBadgeSettings = {
	newWindowDays: number
	hitWindowDays: number
	hitMinViews: number
	hitMinOrders: number
	enableHit: boolean
	enableNew: boolean
	enableLed: boolean
	enableSmart: boolean
	enableSale: boolean
}

function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value)
}

function unique<T>(values: readonly T[]): T[] {
	return Array.from(new Set(values))
}

function normalizeText(value: string): string {
	return value.trim().toLowerCase()
}

function parseCustomBadges(source: unknown): string[] {
	if (!Array.isArray(source)) return []
	return source
		.filter((item): item is string => typeof item === 'string')
		.map(item => item.trim())
		.filter(Boolean)
		.filter(item => !MANAGED_BADGES.has(item))
}

function parsePositiveInt(
	value: unknown,
	fallback: number,
	params?: { min?: number; max?: number },
) {
	const parsed =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number(value)
				: Number.NaN

	if (!Number.isFinite(parsed)) return fallback
	const normalized = Math.trunc(parsed)

	const min = params?.min ?? Number.NEGATIVE_INFINITY
	const max = params?.max ?? Number.POSITIVE_INFINITY
	return Math.min(max, Math.max(min, normalized))
}

function readBooleanSetting(value: unknown, fallback: boolean): boolean {
	if (typeof value === 'boolean') return value
	if (value === 'true') return true
	if (value === 'false') return false
	if (typeof value === 'number') return value !== 0
	return fallback
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
	return patterns.some(pattern => pattern.test(text))
}

function hasLedSignal(signals: readonly PropertySignal[]): boolean {
	const ledPatterns = [/\bled\b/i, /светодиод/i, /диод/i]
	const ledPropertyPatterns = [
		/source/i,
		/light/i,
		/lamp/i,
		/base/i,
		/bulb/i,
		/тип/i,
		/источник/i,
		/ламп/i,
	]

	return signals.some(signal => {
		const haystack = `${signal.propertySlug} ${signal.propertyName} ${signal.valueSlug} ${signal.value}`
		const normalized = normalizeText(haystack)
		return (
			matchesAny(normalized, ledPatterns) &&
			matchesAny(normalized, ledPropertyPatterns)
		)
	})
}

function hasSmartSignal(signals: readonly PropertySignal[]): boolean {
	const smartPatterns = [
		/\bsmart\b/i,
		/умн/i,
		/wi[\s-]?fi/i,
		/bluetooth/i,
		/zigbee/i,
		/matter/i,
		/alice/i,
	]
	const smartPropertyPatterns = [
		/control/i,
		/smart/i,
		/connect/i,
		/wireless/i,
		/управ/i,
		/подключ/i,
		/сценар/i,
	]

	return signals.some(signal => {
		const haystack = `${signal.propertySlug} ${signal.propertyName} ${signal.valueSlug} ${signal.value}`
		const normalized = normalizeText(haystack)
		return (
			matchesAny(normalized, smartPatterns) ||
			(matchesAny(normalized, smartPropertyPatterns) &&
				matchesAny(normalized, smartPatterns))
		)
	})
}

async function getSignalsByProductId(
	db: PrismaClient | Prisma.TransactionClient,
	productIds: readonly string[],
): Promise<Map<string, PropertySignal[]>> {
	if (productIds.length === 0) return new Map()

	const rows = await db.productPropertyValue.findMany({
		where: { productId: { in: [...productIds] } },
		select: {
			productId: true,
			property: { select: { slug: true, name: true } },
			propertyValue: { select: { slug: true, value: true } },
		},
	})

	const grouped = new Map<string, PropertySignal[]>()
	for (const row of rows) {
		if (!row.propertyValue) continue
		const signals = grouped.get(row.productId) ?? []
		signals.push({
			propertySlug: row.property.slug,
			propertyName: row.property.name,
			valueSlug: row.propertyValue.slug,
			value: row.propertyValue.value,
		})
		grouped.set(row.productId, signals)
	}

	return grouped
}

export async function getAutoBadgeSettings(
	db: PrismaClient | Prisma.TransactionClient,
): Promise<AutoBadgeSettings> {
	const settings = await db.setting.findMany({
		where: {
			key: {
				in: Object.values(AUTO_BADGE_SETTING_KEYS),
			},
		},
		select: { key: true, value: true },
	})

	const map = new Map(settings.map(item => [item.key, item.value]))

	return {
		newWindowDays: parsePositiveInt(
			map.get(AUTO_BADGE_SETTING_KEYS.newWindowDays),
			DEFAULT_AUTO_BADGE_SETTINGS.newWindowDays,
			{ min: 1, max: 30 },
		),
		hitWindowDays: parsePositiveInt(
			map.get(AUTO_BADGE_SETTING_KEYS.hitWindowDays),
			DEFAULT_AUTO_BADGE_SETTINGS.hitWindowDays,
			{ min: 1, max: 365 },
		),
		hitMinViews: parsePositiveInt(
			map.get(AUTO_BADGE_SETTING_KEYS.hitMinViews),
			DEFAULT_AUTO_BADGE_SETTINGS.hitMinViews,
			{ min: 1, max: 100000 },
		),
		hitMinOrders: parsePositiveInt(
			map.get(AUTO_BADGE_SETTING_KEYS.hitMinOrders),
			DEFAULT_AUTO_BADGE_SETTINGS.hitMinOrders,
			{ min: 1, max: 100000 },
		),
		enableHit: readBooleanSetting(map.get(AUTO_BADGE_SETTING_KEYS.enableHit), DEFAULT_AUTO_BADGE_SETTINGS.enableHit),
		enableNew: readBooleanSetting(map.get(AUTO_BADGE_SETTING_KEYS.enableNew), DEFAULT_AUTO_BADGE_SETTINGS.enableNew),
		enableLed: readBooleanSetting(map.get(AUTO_BADGE_SETTING_KEYS.enableLed), DEFAULT_AUTO_BADGE_SETTINGS.enableLed),
		enableSmart: readBooleanSetting(map.get(AUTO_BADGE_SETTING_KEYS.enableSmart), DEFAULT_AUTO_BADGE_SETTINGS.enableSmart),
		enableSale: readBooleanSetting(map.get(AUTO_BADGE_SETTING_KEYS.enableSale), DEFAULT_AUTO_BADGE_SETTINGS.enableSale),
	}
}

export function getNewSinceDate(
	settings: Pick<AutoBadgeSettings, 'newWindowDays'>,
	now = new Date(),
) {
	const since = new Date(now)
	since.setDate(since.getDate() - settings.newWindowDays)
	return since
}

export function getHitSinceDate(
	settings: Pick<AutoBadgeSettings, 'hitWindowDays'>,
	now = new Date(),
) {
	const since = new Date(now)
	since.setDate(since.getDate() - settings.hitWindowDays)
	return since
}

async function getViewCountsByProductId(
	db: PrismaClient | Prisma.TransactionClient,
	productIds: readonly string[],
	since: Date,
): Promise<Map<string, number>> {
	if (productIds.length === 0) return new Map()

	const rows = await db.productView.groupBy({
		by: ['productId'],
		where: {
			productId: { in: [...productIds] },
			viewedAt: { gte: since },
		},
		_count: { productId: true },
	})

	return new Map(rows.map(row => [row.productId, row._count.productId]))
}

async function getOrderCountsByProductId(
	db: PrismaClient | Prisma.TransactionClient,
	productIds: readonly string[],
	since: Date,
): Promise<Map<string, number>> {
	if (productIds.length === 0) return new Map()

	const rows = await db.orderItem.groupBy({
		by: ['productId'],
		where: {
			productId: { in: [...productIds] },
			order: {
				status: { not: 'CANCELLED' },
				createdAt: { gte: since },
			},
		},
		_sum: { quantity: true },
	})

	return new Map(rows.map(row => [row.productId, row._sum.quantity ?? 0]))
}

export async function attachAutoBadges<T extends ProductWithBadgeSource>(params: {
	db: PrismaClient | Prisma.TransactionClient
	products: readonly T[]
	now?: Date
	settings?: AutoBadgeSettings
}): Promise<ProductWithAutoBadges<T>[]> {
	const { db, products } = params
	const now = params.now ?? new Date()
	const settings = params.settings ?? (await getAutoBadgeSettings(db))
	const productIds = products.map(product => product.id)

	const sinceNew = getNewSinceDate(settings, now)
	const sinceHit = getHitSinceDate(settings, now)

	const [signalsByProductId, viewsByProductId, ordersByProductId] =
		await Promise.all([
			getSignalsByProductId(db, productIds),
			getViewCountsByProductId(db, productIds, sinceHit),
			getOrderCountsByProductId(db, productIds, sinceHit),
		])

	return products.map(product => {
		const signals = signalsByProductId.get(product.id) ?? []
		const views = viewsByProductId.get(product.id) ?? 0
		const orders = ordersByProductId.get(product.id) ?? 0

		const isNew = toDate(product.createdAt) >= sinceNew
		const isHit =
			views >= settings.hitMinViews || orders >= settings.hitMinOrders
		const hasSale =
			typeof product.compareAtPrice === 'number' &&
			typeof product.price === 'number' &&
			product.compareAtPrice > product.price

		const autoBadges: string[] = []
		if (settings.enableHit && isHit) autoBadges.push('Хит')
		if (settings.enableNew && isNew) autoBadges.push('Новинка')
		if (settings.enableLed && hasLedSignal(signals)) autoBadges.push('LED')
		if (settings.enableSmart && hasSmartSignal(signals)) autoBadges.push('Smart')
		if (settings.enableSale && hasSale) autoBadges.push('Акция')

		const badges = unique([...autoBadges, ...parseCustomBadges(product.badges)])

		return {
			...product,
			badges,
		}
	})
}
