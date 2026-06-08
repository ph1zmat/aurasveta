import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'
import { access, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { deleteFiles, listFiles, uploadFile } from '../lib/storage'
import { CATEGORY_DEFINITIONS } from '../prisma/seedcatalog'
import {
	BRAND_PROPERTY_DEFINITIONS,
	PROPERTY_SLUG_MAP,
} from '../prisma/seeds/seedBrandProperties'
import { createRawBrandProducts } from '../prisma/seeds/seedBrands'
import type {
	SeedProductDefinition,
	SeedPropertyDefinition,
} from '../prisma/seeds/seedTypes'
import { getStorageFileUrl } from '../shared/lib/storagefileurl'

/**
 * Ручной refresh брендового каталога.
 *
 * По умолчанию работает в dry-run и ничего не меняет.
 * Для реального запуска передайте --apply.
 *
 * Поддерживаемые флаги:
 *   --apply
 *   --reset-users
 *   --reset-orders
 *   --wipe-product-storage
 *   --skip-image-upload
 *   --storage-prefix=products
 */

const isProduction = process.env.NODE_ENV === 'production'
const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'

if (isProduction && !allowProductionSeed) {
	throw new Error(
		'Catalog refresh is not allowed in production without ALLOW_PRODUCTION_SEED=true',
	)
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is not set. Run with: npx tsx --require dotenv/config scripts/catalog-refresh.ts',
	)
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const DEFAULT_STORAGE_PREFIX =
	process.env.CATALOG_REFRESH_STORAGE_PREFIX?.trim() || 'products'

const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
}

const ALLOWED_PROPERTY_SLUGS = new Set([
	'brand',
	'weight_netto',
	'diameter_mm',
	'height_mm',
	'light_source',
	'lamp_count',
	'lampshade_material',
	'lampshade_color',
	'frame_color',
	'product_type',
	'length_mm',
	'frame_material',
])

type RefreshOptions = {
	apply: boolean
	resetUsers: boolean
	resetOrders: boolean
	wipeProductStorage: boolean
	uploadImages: boolean
	storagePrefix: string
}

type AdminCredentials = {
	email: string
	password: string | null
}

type PreparedPropertyValue = {
	rawKey: string
	propertySlug: string
	valueString: string
}

type PreparedImage = {
	sourcePath: string
	localPath: string
	isMain: boolean
}

type PreparedProduct = {
	name: string
	slug: string
	originalSlug: string
	description: string | null
	price: number
	compareAtPrice: number | null
	stock: number
	sku: string | null
	categorySlug: string
	brand: string
	brandCountry: string
	badges: string[]
	rating: number
	reviewsCount: number
	metaTitle: string
	metaDesc: string
	propertyValues: PreparedPropertyValue[]
	images: PreparedImage[]
}

type CategoryDefinitionRecord = {
	slug: string
	name: string
	description: string | null
	parentSlug: string | null
}

type CategoryRecord = {
	id: string
	slug: string
	parentId: string | null
}

type PropertyRecord = {
	id: string
	slug: string
}

type ValidationIssues = {
	duplicateSlugs: Map<string, string[]>
	duplicateSkus: Map<string, string[]>
	unresolvedPropertyKeys: Set<string>
	missingImagePaths: string[]
	missingCategorySlugs: string[]
}

function envFlag(name: string, defaultValue = false): boolean {
	const rawValue = process.env[name]?.trim().toLowerCase()
	if (!rawValue) return defaultValue
	return ['1', 'true', 'yes', 'on', 'да'].includes(rawValue)
}

function parseOptions(args: string[]): RefreshOptions {
	const apply = args.includes('--apply')
	const resetUsers =
		args.includes('--reset-users') || envFlag('RESET_USERS', false)
	const resetOrders =
		args.includes('--reset-orders') || envFlag('RESET_ORDERS', false)
	const wipeProductStorage =
		args.includes('--wipe-product-storage') ||
		envFlag('RESET_PRODUCT_STORAGE', false)
	const uploadImages =
		!args.includes('--skip-image-upload') && envFlag('SEED_UPLOAD_IMAGES', true)
	const storagePrefixArg = args.find(arg => arg.startsWith('--storage-prefix='))
	const storagePrefix =
		storagePrefixArg?.slice(storagePrefixArg.indexOf('=') + 1).trim() ||
		DEFAULT_STORAGE_PREFIX

	return {
		apply,
		resetUsers,
		resetOrders,
		wipeProductStorage,
		uploadImages,
		storagePrefix: normalizeStoragePrefix(storagePrefix),
	}
}

function normalizeStoragePrefix(value: string): string {
	const normalized = value.trim().replace(/^\/+|\/+$/g, '')
	return normalized || 'products'
}

function serializePropertyValue(value: string | number | boolean): string {
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false'
	}

	return String(value).trim()
}

function normalizeSeedProductSlug(slug: string): string {
	return slug
		.trim()
		.toLowerCase()
		.replace(/[\\/]+/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function toSafeSegment(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-zа-яё0-9._-]+/gi, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function extToMime(extension: string): string {
	return EXT_TO_MIME[extension.toLowerCase()] ?? 'application/octet-stream'
}

function buildPropertyDefinitionMap(): Map<string, SeedPropertyDefinition> {
	const definitions = new Map<string, SeedPropertyDefinition>()

	for (const definition of BRAND_PROPERTY_DEFINITIONS) {
		definitions.set(definition.slug, definition)
	}

	for (const [name, slug] of Object.entries(PROPERTY_SLUG_MAP)) {
		if (!definitions.has(slug)) {
			definitions.set(slug, {
				slug,
				name,
				hasPhoto:
					slug === 'color' ||
					slug.endsWith('_color') ||
					slug.includes('color_'),
			})
		}
	}

	return definitions
}

function resolvePropertySlug(
	rawKey: string,
	propertyDefinitions: Map<string, SeedPropertyDefinition>,
): string | null {
	const key = rawKey.trim()
	if (!key) return null

	if (PROPERTY_SLUG_MAP[key]) {
		return PROPERTY_SLUG_MAP[key]!
	}

	if (propertyDefinitions.has(key)) {
		return key
	}

	return null
}

function resolveLocalSeedImagePath(seedPath: string): string {
	const relativePath = seedPath.replace(/^[/\\]+/, '')
	const resolvedPath = path.resolve(PUBLIC_DIR, relativePath)

	if (!resolvedPath.startsWith(PUBLIC_DIR)) {
		throw new Error(`Недопустимый путь изображения вне public/: ${seedPath}`)
	}

	return resolvedPath
}

function normalizePreparedImages(
	images: SeedProductDefinition['images'],
): PreparedImage[] {
	const deduplicated = new Map<string, PreparedImage>()

	for (const image of images) {
		const sourcePath = image.path.trim()
		if (!sourcePath) continue

		const localPath = resolveLocalSeedImagePath(sourcePath)
		if (!existsSync(localPath)) {
			continue
		}

		if (!deduplicated.has(sourcePath)) {
			deduplicated.set(sourcePath, {
				sourcePath,
				localPath,
				isMain: Boolean(image.isMain),
			})
		}
	}

	const normalized = [...deduplicated.values()]
	if (normalized.length === 0) {
		return []
	}

	if (!normalized.some(image => image.isMain)) {
		normalized[0] = {
			...normalized[0],
			isMain: true,
		}
	}

	return normalized.map((image, index) => ({
		...image,
		isMain: image.isMain || index === 0,
	}))
}

function normalizePreparedPropertyValues(params: {
	product: SeedProductDefinition
	propertyDefinitions: Map<string, SeedPropertyDefinition>
	unresolvedPropertyKeys: Set<string>
}): PreparedPropertyValue[] {
	const deduplicated = new Map<string, PreparedPropertyValue>()

	for (const propertyValue of params.product.propertyValues) {
		const propertySlug = resolvePropertySlug(
			propertyValue.key,
			params.propertyDefinitions,
		)

		if (!propertySlug) {
			params.unresolvedPropertyKeys.add(propertyValue.key.trim())
			continue
		}

		if (!ALLOWED_PROPERTY_SLUGS.has(propertySlug)) {
			continue
		}

		const valueString = serializePropertyValue(propertyValue.value)
		if (!valueString) continue

		const key = `${propertySlug}::${valueString}`
		if (!deduplicated.has(key)) {
			deduplicated.set(key, {
				rawKey: propertyValue.key.trim(),
				propertySlug,
				valueString,
			})
		}
	}

	return [...deduplicated.values()]
}

function prepareSeedProducts(rawProducts: SeedProductDefinition[]): {
	products: PreparedProduct[]
	unresolvedPropertyKeys: Set<string>
	slugChanges: Array<{ before: string; after: string }>
} {
	const propertyDefinitions = buildPropertyDefinitionMap()
	const unresolvedPropertyKeys = new Set<string>()
	const slugChanges: Array<{ before: string; after: string }> = []

	const products = rawProducts.map<PreparedProduct>(product => {
		const normalizedSlug = normalizeSeedProductSlug(product.slug)
		if (normalizedSlug !== product.slug.trim()) {
			slugChanges.push({
				before: product.slug,
				after: normalizedSlug,
			})
		}

		return {
			name: product.name.trim(),
			slug: normalizedSlug,
			originalSlug: product.slug,
			description: product.description,
			price: product.price,
			compareAtPrice: product.compareAtPrice,
			stock: product.stock,
			sku: product.sku.trim() || null,
			categorySlug: product.categorySlug.trim(),
			brand: product.brand.trim(),
			brandCountry: product.brandCountry.trim(),
			badges: [...product.badges],
			rating: product.rating,
			reviewsCount: product.reviewsCount,
			metaTitle: product.metaTitle.trim(),
			metaDesc: product.metaDesc.trim(),
			propertyValues: normalizePreparedPropertyValues({
				product,
				propertyDefinitions,
				unresolvedPropertyKeys,
			}),
			images: normalizePreparedImages(product.images),
		}
	})

	return {
		products,
		unresolvedPropertyKeys,
		slugChanges,
	}
}

function deduplicateProducts(products: PreparedProduct[]): PreparedProduct[] {
	const seenSlugs = new Set<string>()
	const seenSkus = new Set<string>()
	const deduplicated: PreparedProduct[] = []

	for (const product of products) {
		if (seenSlugs.has(product.slug)) {
			continue
		}

		if (product.sku && seenSkus.has(product.sku)) {
			continue
		}

		seenSlugs.add(product.slug)
		if (product.sku) {
			seenSkus.add(product.sku)
		}
		deduplicated.push(product)
	}

	return deduplicated
}

function collectDuplicateProductSlugs(
	products: PreparedProduct[],
): Map<string, string[]> {
	const seen = new Map<string, string[]>()

	for (const product of products) {
		const existing = seen.get(product.slug) ?? []
		existing.push(`${product.brand} :: ${product.originalSlug}`)
		seen.set(product.slug, existing)
	}

	return new Map([...seen.entries()].filter(([, values]) => values.length > 1))
}

function collectDuplicateSkus(
	products: PreparedProduct[],
): Map<string, string[]> {
	const seen = new Map<string, string[]>()

	for (const product of products) {
		if (!product.sku) continue
		const existing = seen.get(product.sku) ?? []
		existing.push(`${product.brand} :: ${product.slug}`)
		seen.set(product.sku, existing)
	}

	return new Map([...seen.entries()].filter(([, values]) => values.length > 1))
}

function buildCategoryDefinitionMap(): Map<string, CategoryDefinitionRecord> {
	const definitions = new Map<string, CategoryDefinitionRecord>()

	for (const category of CATEGORY_DEFINITIONS) {
		definitions.set(category.slug, {
			slug: category.slug,
			name: category.name,
			description: category.description ?? null,
			parentSlug: null,
		})

		for (const child of category.children ?? []) {
			definitions.set(child.slug, {
				slug: child.slug,
				name: child.name,
				description: child.description ?? null,
				parentSlug: category.slug,
			})
		}
	}

	return definitions
}

function planCategoryCreation(params: {
	usedCategorySlugs: Set<string>
	existingCategories: Map<string, CategoryRecord>
	definitions: Map<string, CategoryDefinitionRecord>
}): {
	missingUnknown: string[]
	createOrder: CategoryDefinitionRecord[]
} {
	const missingUnknown: string[] = []
	const createSlugs = new Set<string>()

	for (const categorySlug of params.usedCategorySlugs) {
		if (params.existingCategories.has(categorySlug)) {
			continue
		}

		const definition = params.definitions.get(categorySlug)
		if (!definition) {
			missingUnknown.push(categorySlug)
			continue
		}

		createSlugs.add(categorySlug)
		if (
			definition.parentSlug &&
			!params.existingCategories.has(definition.parentSlug)
		) {
			createSlugs.add(definition.parentSlug)
		}
	}

	const createOrder = [...createSlugs]
		.map(slug => params.definitions.get(slug))
		.filter((value): value is CategoryDefinitionRecord => Boolean(value))
		.sort((left, right) => {
			const leftWeight = left.parentSlug ? 1 : 0
			const rightWeight = right.parentSlug ? 1 : 0
			if (leftWeight !== rightWeight) {
				return leftWeight - rightWeight
			}
			return left.slug.localeCompare(right.slug)
		})

	return {
		missingUnknown,
		createOrder,
	}
}

function collectUsedPropertySlugs(products: PreparedProduct[]): Set<string> {
	const usedPropertySlugs = new Set<string>()

	for (const product of products) {
		for (const propertyValue of product.propertyValues) {
			usedPropertySlugs.add(propertyValue.propertySlug)
		}
	}

	return usedPropertySlugs
}

function createCollisionSafeValueSlug(
	valueString: string,
	knownSlugs: Map<string, string>,
): string {
	const baseSlug = toSafeSegment(valueString).replace(/\./g, '_') || 'value'
	const normalizedBase = baseSlug.slice(0, 96)
	const existingForBase = knownSlugs.get(normalizedBase)

	if (!existingForBase || existingForBase === valueString) {
		return normalizedBase
	}

	const hash = createHash('sha1').update(valueString).digest('hex').slice(0, 8)
	const hashedSlug = `${normalizedBase.slice(0, 84)}-${hash}`
	const existingForHashed = knownSlugs.get(hashedSlug)

	if (existingForHashed && existingForHashed !== valueString) {
		throw new Error(
			`Не удалось подобрать уникальный slug значения свойства для "${valueString}"`,
		)
	}

	return hashedSlug
}

function collectPlannedPropertyValues(products: PreparedProduct[]) {
	const plannedValues = new Map<
		string,
		Map<string, { value: string; slug: string }>
	>()
	const knownSlugsByProperty = new Map<string, Map<string, string>>()

	for (const product of products) {
		for (const propertyValue of product.propertyValues) {
			let valuesByProperty = plannedValues.get(propertyValue.propertySlug)
			if (!valuesByProperty) {
				valuesByProperty = new Map()
				plannedValues.set(propertyValue.propertySlug, valuesByProperty)
			}

			if (valuesByProperty.has(propertyValue.valueString)) {
				continue
			}

			let knownSlugs = knownSlugsByProperty.get(propertyValue.propertySlug)
			if (!knownSlugs) {
				knownSlugs = new Map()
				knownSlugsByProperty.set(propertyValue.propertySlug, knownSlugs)
			}

			const slug = createCollisionSafeValueSlug(
				propertyValue.valueString,
				knownSlugs,
			)
			knownSlugs.set(slug, propertyValue.valueString)
			valuesByProperty.set(propertyValue.valueString, {
				value: propertyValue.valueString,
				slug,
			})
		}
	}

	return plannedValues
}

async function findMissingImagePaths(
	images: PreparedImage[],
): Promise<string[]> {
	const uniquePaths = [...new Set(images.map(image => image.localPath))]
	const missing: string[] = []

	for (let index = 0; index < uniquePaths.length; index += 200) {
		const batch = uniquePaths.slice(index, index + 200)
		const results = await Promise.all(
			batch.map(async localPath => {
				try {
					await access(localPath)
					return null
				} catch {
					return localPath
				}
			}),
		)

		for (const localPath of results) {
			if (localPath) {
				missing.push(localPath)
			}
		}
	}

	return missing.sort((left, right) => left.localeCompare(right))
}

async function createManyInBatches<T>(params: {
	label: string
	items: T[]
	batchSize: number
	run: (batch: T[]) => Promise<void>
}) {
	for (let index = 0; index < params.items.length; index += params.batchSize) {
		const batch = params.items.slice(index, index + params.batchSize)
		await params.run(batch)

		if (
			(index / params.batchSize + 1) % 5 === 0 ||
			index + params.batchSize >= params.items.length
		) {
			console.log(
				`📦 ${params.label}: ${Math.min(index + batch.length, params.items.length)}/${params.items.length}`,
			)
		}
	}
}

function getAdminCredentials(): AdminCredentials | null {
	const email = process.env.CATALOG_ADMIN_EMAIL?.trim() || ''
	const password = process.env.CATALOG_ADMIN_PASSWORD?.trim() || ''

	if (!email && !password) {
		return null
	}

	if (!email) {
		throw new Error(
			'CATALOG_ADMIN_EMAIL задан не полностью: отсутствует email администратора.',
		)
	}

	return {
		email,
		password: password || null,
	}
}

async function seedCredentialAccount(params: {
	userId: string
	password: string
}) {
	const passwordHash = await hashPassword(params.password)

	await prisma.account.upsert({
		where: {
			providerId_providerAccountId: {
				providerId: 'credential',
				providerAccountId: params.userId,
			},
		},
		update: {
			password: passwordHash,
		},
		create: {
			accountId: params.userId,
			userId: params.userId,
			providerId: 'credential',
			providerAccountId: params.userId,
			password: passwordHash,
		},
	})
}

async function ensureAdminUser(
	credentials: AdminCredentials | null,
): Promise<{ id: string; email: string }> {
	if (credentials?.email) {
		const existingAdmin = await prisma.user.findUnique({
			where: { email: credentials.email },
			select: { id: true, email: true },
		})

		if (!credentials.password && !existingAdmin) {
			throw new Error(
				'Для создания нового администратора требуется CATALOG_ADMIN_PASSWORD.',
			)
		}

		const admin = existingAdmin
			? await prisma.user.update({
					where: { email: credentials.email },
					data: {
						name: 'Администратор',
						role: 'ADMIN',
						emailVerified: true,
					},
					select: { id: true, email: true },
				})
			: await prisma.user.create({
					data: {
						email: credentials.email,
						name: 'Администратор',
						role: 'ADMIN',
						emailVerified: true,
					},
					select: { id: true, email: true },
				})

		if (credentials.password) {
			await seedCredentialAccount({
				userId: admin.id,
				password: credentials.password,
			})
		}

		return {
			id: admin.id,
			email: admin.email,
		}
	}

	const existingAdmin = await prisma.user.findFirst({
		where: { role: 'ADMIN' },
		orderBy: { createdAt: 'asc' },
		select: { id: true, email: true },
	})

	if (!existingAdmin) {
		throw new Error(
			'В базе нет администратора. Укажите CATALOG_ADMIN_EMAIL и CATALOG_ADMIN_PASSWORD.',
		)
	}

	return existingAdmin
}

async function resetUsersAndCreateAdmin(
	credentials: AdminCredentials | null,
): Promise<{ id: string; email: string }> {
	if (!credentials?.email || !credentials.password) {
		throw new Error(
			'Для --reset-users обязательны CATALOG_ADMIN_EMAIL и CATALOG_ADMIN_PASSWORD.',
		)
	}

	await prisma.session.deleteMany()
	await prisma.account.deleteMany()
	await prisma.verification.deleteMany()
	await prisma.user.deleteMany()

	return ensureAdminUser(credentials)
}

async function clearProductDomainData(effectiveResetOrders: boolean) {
	if (!effectiveResetOrders) {
		const existingOrders = await prisma.order.count()
		if (existingOrders > 0) {
			throw new Error(
				`Найдены существующие заказы (${existingOrders}). Для refresh нужен флаг --reset-orders или --reset-users.`,
			)
		}
	}

	await prisma.searchQuery.deleteMany()
	await prisma.productView.deleteMany()
	await prisma.compareItem.deleteMany()
	await prisma.favorite.deleteMany()

	if (effectiveResetOrders) {
		await prisma.orderItem.deleteMany()
		await prisma.order.deleteMany()
	}

	await prisma.anonymousSession.deleteMany()
	await prisma.cart.deleteMany()
	await prisma.productPropertyValue.deleteMany()
	await prisma.productImage.deleteMany()
	await prisma.seoMetadata.deleteMany({
		where: { targetType: 'product' },
	})
	await prisma.product.deleteMany()
}

async function ensureCategories(params: {
	usedCategorySlugs: Set<string>
	createOrder: CategoryDefinitionRecord[]
}): Promise<Map<string, CategoryRecord>> {
	for (const definition of params.createOrder) {
		const existing = await prisma.category.findUnique({
			where: { slug: definition.slug },
			select: { id: true },
		})

		if (existing) {
			continue
		}

		const parentId = definition.parentSlug
			? ((
					await prisma.category.findUnique({
						where: { slug: definition.parentSlug },
						select: { id: true },
					})
				)?.id ?? null)
			: null

		await prisma.category.create({
			data: {
				name: definition.name,
				slug: definition.slug,
				description: definition.description,
				parentId,
			},
		})
	}

	const categories = await prisma.category.findMany({
		where: {
			slug: {
				in: [...params.usedCategorySlugs],
			},
		},
		select: {
			id: true,
			slug: true,
			parentId: true,
		},
	})

	return new Map(categories.map(category => [category.slug, category]))
}

async function ensureProperties(
	usedPropertySlugs: Set<string>,
	propertyDefinitions: Map<string, SeedPropertyDefinition>,
): Promise<Map<string, PropertyRecord>> {
	const propertySlugs = [...usedPropertySlugs].sort((left, right) =>
		left.localeCompare(right),
	)

	const existingProperties = await prisma.property.findMany({
		where: {
			slug: { in: propertySlugs },
		},
		select: {
			id: true,
			slug: true,
		},
	})
	const existingPropertySlugs = new Set(
		existingProperties.map(property => property.slug),
	)

	const missingDefinitions = propertySlugs
		.filter(slug => !existingPropertySlugs.has(slug))
		.map(slug => propertyDefinitions.get(slug))
		.filter((value): value is SeedPropertyDefinition => Boolean(value))

	if (missingDefinitions.length > 0) {
		await createManyInBatches({
			label: 'Свойства добавлены',
			items: missingDefinitions,
			batchSize: 100,
			run: async batch => {
				await prisma.property.createMany({
					data: batch.map(definition => ({
						slug: definition.slug,
						name: definition.name,
						hasPhoto: Boolean(definition.hasPhoto),
					})),
					skipDuplicates: true,
				})
			},
		})
	}

	const properties = await prisma.property.findMany({
		where: {
			slug: { in: propertySlugs },
		},
		select: {
			id: true,
			slug: true,
		},
	})

	return new Map(properties.map(property => [property.slug, property]))
}

async function ensurePropertyValues(params: {
	preparedProducts: PreparedProduct[]
	propertyBySlug: Map<string, PropertyRecord>
}): Promise<Map<string, string>> {
	const plannedValues = collectPlannedPropertyValues(params.preparedProducts)
	const propertyIds = [...params.propertyBySlug.values()].map(
		property => property.id,
	)
	const propertySlugById = new Map(
		[...params.propertyBySlug.entries()].map(([slug, property]) => [
			property.id,
			slug,
		]),
	)

	const existingPropertyValues = await prisma.propertyValue.findMany({
		where: {
			propertyId: { in: propertyIds },
		},
		select: {
			id: true,
			propertyId: true,
			value: true,
			slug: true,
		},
	})

	const existingState = new Map<
		string,
		{
			byValue: Map<string, string>
			bySlug: Map<string, string>
		}
	>()

	for (const existing of existingPropertyValues) {
		const propertySlug = propertySlugById.get(existing.propertyId)
		if (!propertySlug) continue

		let state = existingState.get(propertySlug)
		if (!state) {
			state = {
				byValue: new Map(),
				bySlug: new Map(),
			}
			existingState.set(propertySlug, state)
		}

		state.byValue.set(existing.value, existing.id)
		state.bySlug.set(existing.slug, existing.value)
	}

	const missingRows: Prisma.PropertyValueCreateManyInput[] = []

	for (const [propertySlug, valuesByString] of plannedValues.entries()) {
		const property = params.propertyBySlug.get(propertySlug)
		if (!property) {
			throw new Error(`Свойство не найдено после upsert: ${propertySlug}`)
		}

		let state = existingState.get(propertySlug)
		if (!state) {
			state = {
				byValue: new Map(),
				bySlug: new Map(),
			}
			existingState.set(propertySlug, state)
		}

		for (const { value, slug: plannedSlug } of valuesByString.values()) {
			if (state.byValue.has(value)) {
				continue
			}

			let propertyValueSlug = plannedSlug
			const conflictingValue = state.bySlug.get(propertyValueSlug)
			if (conflictingValue && conflictingValue !== value) {
				propertyValueSlug = createCollisionSafeValueSlug(value, state.bySlug)
			}

			state.bySlug.set(propertyValueSlug, value)
			state.byValue.set(value, '__pending__')
			missingRows.push({
				propertyId: property.id,
				value,
				slug: propertyValueSlug,
				order: Math.max(state.bySlug.size - 1, 0),
			})
		}
	}

	if (missingRows.length > 0) {
		await createManyInBatches({
			label: 'Значения свойств добавлены',
			items: missingRows,
			batchSize: 500,
			run: async batch => {
				await prisma.propertyValue.createMany({
					data: batch,
					skipDuplicates: true,
				})
			},
		})
	}

	const finalPropertyValues = await prisma.propertyValue.findMany({
		where: {
			propertyId: { in: propertyIds },
		},
		select: {
			id: true,
			propertyId: true,
			value: true,
		},
	})

	const propertyValueIdByPropertyAndValue = new Map<string, string>()
	for (const propertyValue of finalPropertyValues) {
		const propertySlug = propertySlugById.get(propertyValue.propertyId)
		if (!propertySlug) continue
		propertyValueIdByPropertyAndValue.set(
			`${propertySlug}::${propertyValue.value}`,
			propertyValue.id,
		)
	}

	return propertyValueIdByPropertyAndValue
}

function buildProductRows(params: {
	preparedProducts: PreparedProduct[]
	categoryBySlug: Map<string, CategoryRecord>
	adminId: string
}): Prisma.ProductCreateManyInput[] {
	return params.preparedProducts.map(product => {
		const category = params.categoryBySlug.get(product.categorySlug)

		if (!category) {
			throw new Error(`Категория не найдена для slug: ${product.categorySlug}`)
		}

		return {
			name: product.name,
			slug: product.slug,
			description: product.description,
			price: product.price,
			compareAtPrice: product.compareAtPrice,
			stock: product.stock,
			sku: product.sku,
			categoryId: category.id,
			rootCategoryId: category.parentId,
			subcategoryId: category.parentId ? category.id : null,
			isActive: true,
			brand: product.brand,
			brandCountry: product.brandCountry,
			rating: product.rating,
			reviewsCount: product.reviewsCount,
			badges: product.badges as Prisma.InputJsonValue,
			metaTitle: product.metaTitle,
			metaDesc: product.metaDesc,
			userId: params.adminId,
		}
	})
}

async function insertProducts(productRows: Prisma.ProductCreateManyInput[]) {
	await createManyInBatches({
		label: 'Товары добавлены',
		items: productRows,
		batchSize: 100,
		run: async batch => {
			await prisma.product.createMany({
				data: batch,
			})
		},
	})
}

async function insertProductPropertyValues(params: {
	preparedProducts: PreparedProduct[]
	productIdBySlug: Map<string, string>
	propertyBySlug: Map<string, PropertyRecord>
	propertyValueIdByPropertyAndValue: Map<string, string>
}) {
	const rows: Prisma.ProductPropertyValueCreateManyInput[] = []

	for (const product of params.preparedProducts) {
		const productId = params.productIdBySlug.get(product.slug)
		if (!productId) {
			throw new Error(`ID товара не найден после вставки: ${product.slug}`)
		}

		for (const propertyValue of product.propertyValues) {
			const property = params.propertyBySlug.get(propertyValue.propertySlug)
			if (!property) {
				throw new Error(
					`Свойство не найдено после upsert: ${propertyValue.propertySlug}`,
				)
			}

			const propertyValueId = params.propertyValueIdByPropertyAndValue.get(
				`${propertyValue.propertySlug}::${propertyValue.valueString}`,
			)
			if (!propertyValueId) {
				throw new Error(
					`Значение свойства не найдено: ${propertyValue.propertySlug} = ${propertyValue.valueString}`,
				)
			}

			rows.push({
				productId,
				propertyId: property.id,
				propertyValueId,
			})
		}
	}

	if (rows.length === 0) {
		return
	}

	await createManyInBatches({
		label: 'Связи товар-свойство добавлены',
		items: rows,
		batchSize: 1000,
		run: async batch => {
			await prisma.productPropertyValue.createMany({
				data: batch,
				skipDuplicates: true,
			})
		},
	})
}

function buildStorageKey(params: {
	storagePrefix: string
	product: PreparedProduct
	image: PreparedImage
	imageIndex: number
}): string {
	const extension = path.extname(params.image.localPath).toLowerCase()
	const fileStem = path.basename(params.image.localPath, extension)
	const safeFileStem = toSafeSegment(fileStem) || 'image'
	const brandSegment = toSafeSegment(params.product.brand) || 'brand'
	const productSegment = toSafeSegment(params.product.slug) || 'product'

	return [
		params.storagePrefix,
		brandSegment,
		productSegment,
		`${String(params.imageIndex + 1).padStart(2, '0')}-${safeFileStem}${extension}`,
	].join('/')
}

async function uploadProductImages(params: {
	preparedProducts: PreparedProduct[]
	productIdBySlug: Map<string, string>
	storagePrefix: string
}): Promise<Prisma.ProductImageCreateManyInput[]> {
	const tasks = params.preparedProducts.flatMap(product => {
		const productId = params.productIdBySlug.get(product.slug)
		if (!productId) {
			throw new Error(
				`ID товара не найден для загрузки изображения: ${product.slug}`,
			)
		}

		return product.images.map((image, imageIndex) => ({
			product,
			productId,
			image,
			imageIndex,
		}))
	})

	if (tasks.length === 0) {
		return []
	}

	const rows: Prisma.ProductImageCreateManyInput[] = []

	await createManyInBatches({
		label: 'Изображения загружены в S3',
		items: tasks,
		batchSize: 12,
		run: async batch => {
			const batchRows = await Promise.all(
				batch.map(async task => {
					const fileBuffer = await readFile(task.image.localPath)
					const key = buildStorageKey({
						storagePrefix: params.storagePrefix,
						product: task.product,
						image: task.image,
						imageIndex: task.imageIndex,
					})
					const mimeType = extToMime(path.extname(task.image.localPath))

					await uploadFile(key, fileBuffer, mimeType)

					return {
						productId: task.productId,
						url: getStorageFileUrl(key),
						key,
						originalName: path.basename(task.image.localPath),
						size: fileBuffer.byteLength,
						mimeType,
						order: task.imageIndex,
						isMain: task.image.isMain || task.imageIndex === 0,
					}
				}),
			)

			rows.push(...batchRows)
		},
	})

	return rows
}

async function insertProductImages(rows: Prisma.ProductImageCreateManyInput[]) {
	if (rows.length === 0) {
		return
	}

	await createManyInBatches({
		label: 'Записи product_images добавлены',
		items: rows,
		batchSize: 500,
		run: async batch => {
			await prisma.productImage.createMany({
				data: batch,
			})
		},
	})
}

function printSampleList(title: string, values: readonly string[], limit = 10) {
	if (values.length === 0) return
	console.log(`⚠️ ${title}:`)
	for (const value of values.slice(0, limit)) {
		console.log(`   • ${value}`)
	}
	if (values.length > limit) {
		console.log(`   … ещё ${values.length - limit}`)
	}
}

function printCollisionMap(
	title: string,
	collisions: Map<string, string[]>,
	limit = 10,
) {
	if (collisions.size === 0) return
	console.log(`⚠️ ${title}:`)
	for (const [key, values] of [...collisions.entries()].slice(0, limit)) {
		console.log(`   • ${key}`)
		for (const value of values.slice(0, 3)) {
			console.log(`     - ${value}`)
		}
		if (values.length > 3) {
			console.log(`     … ещё ${values.length - 3}`)
		}
	}
	if (collisions.size > limit) {
		console.log(`   … ещё коллизий: ${collisions.size - limit}`)
	}
}

async function main() {
	const options = parseOptions(process.argv.slice(2))
	const effectiveResetOrders = options.resetOrders || options.resetUsers
	const adminCredentials = getAdminCredentials()

	console.log('🧭 Подготовка refresh брендового каталога...')
	console.log(`Режим: ${options.apply ? 'apply' : 'dry-run'}`)
	console.log(
		`Флаги: resetUsers=${options.resetUsers}, resetOrders=${effectiveResetOrders}, wipeProductStorage=${options.wipeProductStorage}, uploadImages=${options.uploadImages}`,
	)

	const rawProducts = createRawBrandProducts()
	const {
		products: preparedProducts,
		unresolvedPropertyKeys,
		slugChanges,
	} = prepareSeedProducts(rawProducts)

	const duplicateSlugs = collectDuplicateProductSlugs(preparedProducts)
	const duplicateSkus = collectDuplicateSkus(preparedProducts)
	const allPreparedImages = preparedProducts.flatMap(product => product.images)
	const missingImagePaths = options.uploadImages
		? await findMissingImagePaths(allPreparedImages)
		: []

	// ДЕДУПЛИКАЦИЯ ДЛЯ БЕЗОПАСНОГО ИМПОРТА
	const deduplicatedProducts = deduplicateProducts(preparedProducts)

	const categoryDefinitions = buildCategoryDefinitionMap()
	const usedCategorySlugs = new Set(
		deduplicatedProducts.map(product => product.categorySlug),
	)
	const existingCategories = await prisma.category.findMany({
		select: {
			id: true,
			slug: true,
			parentId: true,
		},
	})
	const existingCategoryBySlug = new Map(
		existingCategories.map(category => [category.slug, category]),
	)
	const categoryPlan = planCategoryCreation({
		usedCategorySlugs,
		existingCategories: existingCategoryBySlug,
		definitions: categoryDefinitions,
	})

	const propertyDefinitions = buildPropertyDefinitionMap()
	const usedPropertySlugs = collectUsedPropertySlugs(deduplicatedProducts)
	const dynamicPropertyDefinitions = [...usedPropertySlugs].filter(
		slug =>
			!BRAND_PROPERTY_DEFINITIONS.some(definition => definition.slug === slug),
	)

	const [
		currentProductCount,
		currentProductImageCount,
		currentUserCount,
		currentOrderCount,
	] = await Promise.all([
		prisma.product.count(),
		prisma.productImage.count(),
		prisma.user.count(),
		prisma.order.count(),
	])

	const storagePrefix = `${options.storagePrefix}/`
	const currentStorageKeys = options.wipeProductStorage
		? await listFiles(storagePrefix)
		: []

	const issues: ValidationIssues = {
		duplicateSlugs,
		duplicateSkus,
		unresolvedPropertyKeys,
		missingImagePaths,
		missingCategorySlugs: categoryPlan.missingUnknown,
	}

	console.log('')
	console.log('## Сводка preflight')
	console.log(`Сырой объём товаров: ${rawProducts.length}`)
	console.log(`После нормализации slug: ${preparedProducts.length}`)
	console.log(`После дедупликации (уникальных): ${deduplicatedProducts.length}`)
	console.log(`Изменённых slug: ${slugChanges.length}`)
	console.log(`Уникальных категорий в сидов: ${usedCategorySlugs.size}`)
	console.log(`Категорий к созданию: ${categoryPlan.createOrder.length}`)
	console.log(`Используемых свойств: ${usedPropertySlugs.size}`)
	console.log(
		`Динамически выведенных свойств: ${dynamicPropertyDefinitions.length}`,
	)
	console.log(`Текущих товаров в БД: ${currentProductCount}`)
	console.log(`Текущих изображений товаров в БД: ${currentProductImageCount}`)
	console.log(`Текущих пользователей: ${currentUserCount}`)
	console.log(`Текущих заказов: ${currentOrderCount}`)
	if (options.wipeProductStorage) {
		console.log(
			`Ключей в S3 под префиксом ${storagePrefix}: ${currentStorageKeys.length}`,
		)
	}
	if (adminCredentials?.email) {
		console.log(`Администратор для refresh: ${adminCredentials.email}`)
	}
	console.log('')

	printCollisionMap('Коллизии slug после нормализации', duplicateSlugs)
	printCollisionMap('Дубликаты SKU', duplicateSkus)
	printSampleList(
		'Неизвестные ключи характеристик',
		[...unresolvedPropertyKeys].sort((left, right) =>
			left.localeCompare(right),
		),
	)
	printSampleList('Отсутствующие изображения в public/', missingImagePaths)
	printSampleList('Неизвестные categorySlug', categoryPlan.missingUnknown)

	if (slugChanges.length > 0) {
		printSampleList(
			'Примеры изменённых slug',
			slugChanges.map(change => `${change.before} -> ${change.after}`),
		)
	}

	if (issues.missingCategorySlugs.length > 0) {
		throw new Error(
			'Preflight завершился критическими ошибками: обнаружены неизвестные categorySlug!',
		)
	}

	if (!options.apply) {
		console.log(
			'✅ Dry-run de-duplication safe. Dry-run завершён без критических ошибок. Изменения не применялись.',
		)
		return
	}

	console.log('')
	console.log('🚨 Запуск apply-режима refresh каталога...')

	await clearProductDomainData(effectiveResetOrders)
	console.log('✅ Товарный домен очищен')

	if (options.wipeProductStorage) {
		const deletedStorageKeys = await deleteFiles(currentStorageKeys)
		console.log(`✅ Старые product-ключи удалены из S3: ${deletedStorageKeys}`)
	}

	const admin = options.resetUsers
		? await resetUsersAndCreateAdmin(adminCredentials)
		: await ensureAdminUser(adminCredentials)
	console.log(`✅ Администратор готов: ${admin.email}`)

	const categoryBySlug = await ensureCategories({
		usedCategorySlugs,
		createOrder: categoryPlan.createOrder,
	})
	console.log(`✅ Категории готовы: ${categoryBySlug.size}`)

	const propertyBySlug = await ensureProperties(
		usedPropertySlugs,
		propertyDefinitions,
	)
	console.log(`✅ Свойства готовы: ${propertyBySlug.size}`)

	const productRows = buildProductRows({
		preparedProducts: deduplicatedProducts,
		categoryBySlug,
		adminId: admin.id,
	})
	await insertProducts(productRows)

	const createdProducts = await prisma.product.findMany({
		select: { id: true, slug: true },
	})
	const productIdBySlug = new Map(
		createdProducts.map(product => [product.slug, product.id]),
	)
	console.log(`✅ Товары созданы: ${createdProducts.length}`)

	const propertyValueIdByPropertyAndValue = await ensurePropertyValues({
		preparedProducts: deduplicatedProducts,
		propertyBySlug,
	})
	console.log(
		`✅ Значения свойств готовы: ${propertyValueIdByPropertyAndValue.size}`,
	)

	await insertProductPropertyValues({
		preparedProducts: deduplicatedProducts,
		productIdBySlug,
		propertyBySlug,
		propertyValueIdByPropertyAndValue,
	})
	console.log('✅ Связи товар-свойство записаны')

	if (options.uploadImages) {
		const imageRows = await uploadProductImages({
			preparedProducts: deduplicatedProducts,
			productIdBySlug,
			storagePrefix: options.storagePrefix,
		})
		await insertProductImages(imageRows)
		console.log(`✅ Изображения загружены и записаны: ${imageRows.length}`)
	} else {
		console.log('⚠️ Загрузка изображений отключена флагом --skip-image-upload')
	}

	const [finalProductCount, finalImageCount] = await Promise.all([
		prisma.product.count(),
		prisma.productImage.count(),
	])
	console.log('')
	console.log('🎉 Refresh каталога завершён')
	console.log(`Итог товаров: ${finalProductCount}`)
	console.log(`Итог product_images: ${finalImageCount}`)
}

main()
	.catch(error => {
		console.error('❌ Catalog refresh failed:', error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
