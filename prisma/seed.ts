import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'
import {
	CATEGORY_DEFINITIONS,
	CONTENT_PAGES,
	createCatalogProducts,
	PROPERTY_DEFINITIONS,
	SEARCH_QUERIES,
} from './seed-catalog'

if (process.env.NODE_ENV === 'production') {
	throw new Error('Seeding is not allowed in production')
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is not set. Run with: npx tsx --require dotenv/config prisma/seed.ts',
	)
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })

const REQUIRED_TABLES = [
	'users',
	'accounts',
	'categories',
	'properties',
	'product_property_values',
	'products',
	'pages',
	'page_versions',
	'webhooks',
] as const

type ExistingTableRow = {
	table_name: string
}

async function getExistingPublicTables(): Promise<Set<string>> {
	const rows = await prisma.$queryRaw<ExistingTableRow[]>`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
	`

	return new Set(rows.map(row => row.table_name))
}

function assertRequiredTables(existingTables: Set<string>) {
	const missingTables = REQUIRED_TABLES.filter(tableName => !existingTables.has(tableName))

	if (missingTables.length > 0) {
		throw new Error(
			`Database is missing required tables for seed: ${missingTables.join(', ')}. ` +
				'Apply the Prisma migrations before running the seed.',
		)
	}
}

async function runIfTableExists(params: {
	existingTables: Set<string>
	tableName: string
	label: string
	action: () => Promise<void>
}) {
	if (!params.existingTables.has(params.tableName)) {
		console.warn(
			`⚠️ Skipping ${params.label}: table "${params.tableName}" is missing in the current database.`,
		)
		return false
	}

	await params.action()
	return true
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

		if ((index / params.batchSize + 1) % 5 === 0 || index + params.batchSize >= params.items.length) {
			console.log(
				`📦 ${params.label}: ${Math.min(index + batch.length, params.items.length)}/${params.items.length}`,
			)
		}
	}
}

function serializePropertyValue(value: string | number | boolean): string {
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false'
	}

	return String(value)
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

async function clearCatalogData(existingTables: Set<string>) {
	await runIfTableExists({
		existingTables,
		tableName: 'search_queries',
		label: 'search query cleanup',
		action: () => prisma.searchQuery.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'product_views',
		label: 'product view cleanup',
		action: () => prisma.productView.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'compare_items',
		label: 'compare item cleanup',
		action: () => prisma.compareItem.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'favorites',
		label: 'favorite cleanup',
		action: () => prisma.favorite.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'order_items',
		label: 'order item cleanup',
		action: () => prisma.orderItem.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'orders',
		label: 'order cleanup',
		action: () => prisma.order.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'anonymous_sessions',
		label: 'anonymous session cleanup',
		action: () => prisma.anonymousSession.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'carts',
		label: 'cart cleanup',
		action: () => prisma.cart.deleteMany().then(() => undefined),
	})

	await prisma.productPropertyValue.deleteMany()

	await runIfTableExists({
		existingTables,
		tableName: 'product_images',
		label: 'product image cleanup',
		action: () => prisma.productImage.deleteMany().then(() => undefined),
	})

	await runIfTableExists({
		existingTables,
		tableName: 'seo_metadata',
		label: 'SEO metadata cleanup',
		action: () => prisma.seoMetadata.deleteMany().then(() => undefined),
	})

	await prisma.product.deleteMany()
	await prisma.category.deleteMany()
	await prisma.property.deleteMany()
	await prisma.webhook.deleteMany()
}

async function seedCategories() {
	const categoryIds = new Map<string, string>()

	for (const category of CATEGORY_DEFINITIONS) {
		const createdCategory = await prisma.category.create({
			data: {
				name: category.name,
				slug: category.slug,
				description: category.description,
			},
		})

		categoryIds.set(category.slug, createdCategory.id)

		for (const child of category.children ?? []) {
			const createdChild = await prisma.category.create({
				data: {
					name: child.name,
					slug: child.slug,
					description: child.description,
					parentId: createdCategory.id,
				},
			})

			categoryIds.set(child.slug, createdChild.id)
		}
	}

	return categoryIds
}

async function seedProperties() {
	// Returns Map<propertySlug, { propertyId, valueMap: Map<stringifiedValue, propertyValueId> }>
	const result = new Map<string, { propertyId: string; valueMap: Map<string, string> }>()

	for (const property of PROPERTY_DEFINITIONS) {
		const createdProperty = await prisma.property.upsert({
			where: { slug: property.slug },
			update: { name: property.name },
			create: { slug: property.slug, name: property.name, hasPhoto: false },
		})

		const valueMap = new Map<string, string>()

		if (property.options && property.options.length > 0) {
			for (let i = 0; i < property.options.length; i++) {
				const optionValue = property.options[i]
				const slug = optionValue
					.toLowerCase()
					.replace(/[^a-zа-яё0-9]+/gi, '_')
					.replace(/^_|_$/g, '') || `val_${i}`
				const created = await prisma.propertyValue.upsert({
					where: { propertyId_slug: { propertyId: createdProperty.id, slug } },
					update: { value: optionValue, order: i },
					create: { propertyId: createdProperty.id, value: optionValue, slug, order: i },
				})
				valueMap.set(optionValue, created.id)
			}
		}

		result.set(property.slug, { propertyId: createdProperty.id, valueMap })
	}

	return result
}

async function seedProducts(params: {
	adminId: string
	categoryIds: Map<string, string>
	propertyData: Map<string, { propertyId: string; valueMap: Map<string, string> }>
}) {
	const catalogProducts = createCatalogProducts()
	const productRows: Prisma.ProductCreateManyInput[] = []

	for (const product of catalogProducts) {
		const categoryId = params.categoryIds.get(product.categorySlug)

		if (!categoryId) {
			throw new Error(`Category not found for slug: ${product.categorySlug}`)
		}

		productRows.push({
			name: product.name,
			slug: product.slug,
			description: product.description,
			price: product.price,
			compareAtPrice: product.compareAtPrice,
			stock: product.stock,
			sku: product.sku,
			categoryId,
			isActive: true,
			brand: product.brand,
			brandCountry: product.brandCountry,
			rating: product.rating,
			reviewsCount: product.reviewsCount,
			badges: product.badges as Prisma.InputJsonValue,
			metaTitle: product.metaTitle,
			metaDesc: product.metaDesc,
			userId: params.adminId,
		})
	}

	await createManyInBatches({
		label: 'Products inserted',
		items: productRows,
		batchSize: 50,
		run: async batch => {
			await prisma.product.createMany({
				data: batch,
			})
		},
	})

	const createdProducts = await prisma.product.findMany({
		where: {
			slug: {
				in: catalogProducts.map(product => product.slug),
			},
		},
		select: {
			id: true,
			slug: true,
		},
	})

	const productIdsBySlug = new Map(
		createdProducts.map(product => [product.slug, product.id]),
	)

	const resolvedPropertyRows: Prisma.ProductPropertyValueCreateManyInput[] = []

	for (const product of catalogProducts) {
		const productId = productIdsBySlug.get(product.slug)

		if (!productId) {
			throw new Error(`Product ID not found after createMany for slug: ${product.slug}`)
		}

		for (const pv of product.propertyValues) {
			const propData = params.propertyData.get(pv.key)

			if (!propData) {
				// Property not seeded — skip silently
				continue
			}

			const stringValue = serializePropertyValue(pv.value)
			let propertyValueId = propData.valueMap.get(stringValue)

			// For properties without predefined options, create PropertyValue on the fly
			if (!propertyValueId) {
				const slug = stringValue
					.toLowerCase()
					.replace(/[^a-zа-яё0-9.]+/gi, '_')
					.replace(/^_|_$/g, '') || 'val'
				const created = await prisma.propertyValue.upsert({
					where: { propertyId_slug: { propertyId: propData.propertyId, slug } },
					update: { value: stringValue },
					create: { propertyId: propData.propertyId, value: stringValue, slug, order: propData.valueMap.size },
				})
				propertyValueId = created.id
				propData.valueMap.set(stringValue, created.id)
			}

			resolvedPropertyRows.push({
				productId,
				propertyId: propData.propertyId,
				propertyValueId,
			})
		}
	}

	await createManyInBatches({
		label: 'Product properties inserted',
		items: resolvedPropertyRows,
		batchSize: 500,
		run: async batch => {
			await prisma.productPropertyValue.createMany({
				data: batch,
				skipDuplicates: true,
			})
		},
	})

	return createdProducts
}

async function seedPages(adminId: string) {
	for (const pageData of CONTENT_PAGES) {
		const page = await prisma.page.upsert({
			where: { slug: pageData.slug },
			update: {
				title: pageData.title,
				content: pageData.content,
				metaTitle: pageData.metaTitle,
				metaDesc: pageData.metaDesc,
				isPublished: pageData.isPublished,
				publishedAt: pageData.isPublished ? new Date('2025-01-15T09:00:00.000Z') : null,
				authorId: adminId,
			},
			create: {
				title: pageData.title,
				slug: pageData.slug,
				content: pageData.content,
				metaTitle: pageData.metaTitle,
				metaDesc: pageData.metaDesc,
				isPublished: pageData.isPublished,
				publishedAt: pageData.isPublished ? new Date('2025-01-15T09:00:00.000Z') : null,
				authorId: adminId,
			},
		})

		await prisma.pageVersion.deleteMany({
			where: { pageId: page.id },
		})

		await prisma.pageVersion.create({
			data: {
				pageId: page.id,
				title: pageData.title,
				content: pageData.content,
				metaTitle: pageData.metaTitle,
				metaDesc: pageData.metaDesc,
				version: 1,
				createdBy: adminId,
			},
		})
	}
}

async function seedWebhook() {
	await prisma.webhook.create({
		data: {
			url: 'https://webhook.site/test',
			events: ['product.created', 'product.updated', 'order.created'],
		},
	})
}

async function seedBehavioralData(params: {
	userId: string
	products: Array<{ id: string; slug: string }>
	existingTables: Set<string>
}) {
	const hasProductViews = params.existingTables.has('product_views')
	const hasSearchQueries = params.existingTables.has('search_queries')

	if (!hasProductViews && !hasSearchQueries) {
		console.warn(
			'⚠️ Skipping behavioral seed data: tables "product_views" and "search_queries" are missing.',
		)
		return
	}

	const productViews: Prisma.ProductViewCreateManyInput[] = []
	const sessions = Array.from({ length: 12 }, (_, index) => `seed-session-${String(index + 1).padStart(3, '0')}`)

	for (const [sessionIndex, sessionId] of sessions.entries()) {
		for (let offset = 0; offset < 10; offset += 1) {
			const product = params.products[(sessionIndex * 7 + offset) % params.products.length]
			const viewedAt = new Date(Date.UTC(2025, 0, 20 - sessionIndex, 9 + offset, 0, 0))

			productViews.push({
				sessionId,
				userId: sessionIndex === 0 ? params.userId : null,
				productId: product.id,
				viewedAt,
			})
		}
	}

	if (hasProductViews) {
		await prisma.productView.createMany({
			data: productViews,
		})
	} else {
		console.warn('⚠️ Skipping product view seed: table "product_views" is missing.')
	}

	const searchQueryRows: Prisma.SearchQueryCreateManyInput[] = SEARCH_QUERIES.flatMap((query, queryIndex) => {
		return Array.from({ length: 3 }, (_, occurrenceIndex) => ({
			sessionId: sessions[(queryIndex + occurrenceIndex) % sessions.length]!,
			userId: queryIndex % 5 === 0 ? params.userId : null,
			query,
			createdAt: new Date(Date.UTC(2025, 0, 10 + queryIndex, 8 + occurrenceIndex, 15, 0)),
		}))
	})

	if (hasSearchQueries) {
		await prisma.searchQuery.createMany({
			data: searchQueryRows,
		})
	} else {
		console.warn('⚠️ Skipping search query seed: table "search_queries" is missing.')
	}
}

async function seedSectionTypes() {
	const SECTION_TYPES: Array<{
		name: string
		component: string
		configSchema: Prisma.InputJsonValue
	}> = [
		{
			name: 'Баннер',
			component: 'Banner',
			configSchema: {
				type: 'object',
				properties: {
					pageSlug: { type: 'string' },
					overrideImage: { type: 'string' },
					overrideLink: { type: 'string' },
				},
			},
		},
		{
			name: 'Сетка товаров',
			component: 'ProductGrid',
			configSchema: {
				type: 'object',
				properties: {
					source: {
						type: 'string',
						enum: ['promotion', 'novelty', 'popular', 'property'],
					},
					propertyValueId: { type: 'string' },
					limit: { type: 'number', default: 8 },
					sortBy: {
						type: 'string',
						enum: ['newest', 'price_asc', 'price_desc', 'popular'],
					},
					viewAllHref: { type: 'string' },
					viewAllLabel: { type: 'string' },
				},
			},
		},
		{
			name: 'Карусель брендов',
			component: 'BrandCarousel',
			configSchema: {
				type: 'object',
				properties: { propertySlug: { type: 'string', default: 'brand' } },
			},
		},
		{
			name: 'Карусель категорий',
			component: 'CategoryCarousel',
			configSchema: {
				type: 'object',
				properties: { parentId: { type: 'string' } },
			},
		},
		{ name: 'Наши преимущества', component: 'Advantages', configSchema: {} },
		{ name: 'О нас', component: 'AboutText', configSchema: {} },
		{ name: 'Вы смотрели', component: 'SeenProducts', configSchema: {} },
	]

	const typeIds = new Map<string, string>()

	for (const st of SECTION_TYPES) {
		const created = await prisma.sectionType.upsert({
			where: { component: st.component },
			update: { name: st.name, configSchema: st.configSchema },
			create: {
				name: st.name,
				component: st.component,
				configSchema: st.configSchema,
			},
		})
		typeIds.set(st.component, created.id)
	}

	const defaultSections: Array<{
		order: number
		component: string
		title?: string
		config?: Prisma.InputJsonValue
	}> = [
		{ order: 1, component: 'Banner', title: 'Добро пожаловать', config: { pageSlug: 'welcome' } },
		{ order: 2, component: 'ProductGrid', title: 'Акции и скидки', config: { source: 'promotion', limit: 8 } },
		{ order: 3, component: 'BrandCarousel', title: 'Бренды', config: { propertySlug: 'brand' } },
		{ order: 4, component: 'Advantages', title: 'Наши преимущества', config: {} },
	]

	for (const section of defaultSections) {
		const sectionTypeId = typeIds.get(section.component)
		if (!sectionTypeId) continue

		const existing = await prisma.homeSection.findFirst({ where: { order: section.order } })
		if (existing) {
			await prisma.homeSection.update({
				where: { id: existing.id },
				data: {
					sectionTypeId,
					title: section.title,
					config: (section.config ?? {}) as Prisma.InputJsonValue,
					isActive: true,
				},
			})
		} else {
			await prisma.homeSection.create({
				data: {
					sectionTypeId,
					order: section.order,
					title: section.title,
					config: (section.config ?? {}) as Prisma.InputJsonValue,
					isActive: true,
				},
			})
		}
	}

	return typeIds
}

async function seedCmsSettings() {
	const rows: Array<{
		key: string
		value: Prisma.InputJsonValue
		type: string
		group: string
		description?: string
		isPublic?: boolean
	}> = [
		{
			key: 'site_name',
			value: 'Aurasveta',
			type: 'string',
			group: 'general',
			description: 'Название сайта',
			isPublic: true,
		},
		{
			key: 'home_popular_queries',
			value: ['стул', 'лампа', 'диван', 'шкаф'],
			type: 'array',
			group: 'home',
			description: 'Популярные поисковые запросы на главной',
			isPublic: true,
		},
		{
			key: 'footer_links',
			value: [
				{ text: 'Контакты', url: '/contacts' },
				{ text: 'Доставка', url: '/delivery' },
			],
			type: 'json',
			group: 'footer',
			description: 'Ссылки в футере',
			isPublic: true,
		},
	]

	for (const row of rows) {
		await prisma.setting.upsert({
			where: { key: row.key },
			update: {
				value: row.value,
				type: row.type,
				group: row.group,
				description: row.description,
				isPublic: row.isPublic ?? true,
			},
			create: {
				key: row.key,
				value: row.value,
				type: row.type,
				group: row.group,
				description: row.description,
				isPublic: row.isPublic ?? true,
			},
		})
	}
}

async function seedCmsProperties() {
	const defaults = [
		{
			name: 'Бренд',
			slug: 'brand',
			hasPhoto: true,
			values: ['IKEA', 'H&M Home', 'Zara Home'],
		},
		{
			name: 'Расположение',
			slug: 'location',
			hasPhoto: true,
			values: ['Для спальни', 'Для гостиной', 'Для кухни'],
		},
		{
			name: 'Цвет',
			slug: 'color',
			hasPhoto: true,
			values: ['Белый', 'Черный', 'Бежевый'],
		},
	]

	for (const prop of defaults) {
		const created = await prisma.property.upsert({
			where: { slug: prop.slug },
			update: { name: prop.name, hasPhoto: prop.hasPhoto },
			create: { slug: prop.slug, name: prop.name, hasPhoto: prop.hasPhoto },
		})

		for (let i = 0; i < prop.values.length; i++) {
			const value = prop.values[i]
			const slug = value
				.toLowerCase()
				.replace(/[^a-zа-яё0-9]+/gi, '-')
				.replace(/^-+|-+$/g, '')

			await prisma.propertyValue.upsert({
				where: { propertyId_slug: { propertyId: created.id, slug } },
				update: { value, order: i, photo: '/placeholder.svg' },
				create: {
					propertyId: created.id,
					value,
					slug,
					order: i,
					photo: '/placeholder.svg',
				},
			})
		}
	}
}

async function seedWelcomePage(adminId: string) {
	await prisma.page.upsert({
		where: { slug: 'welcome' },
		update: {
			title: 'Добро пожаловать',
			isPublished: true,
			publishedAt: new Date(),
			authorId: adminId,
			content: '<h2>Добро пожаловать в Aurasveta</h2><p>Управляйте контентом через CMS.</p>',
			contentBlocks: [
				{ type: 'heading', data: { text: 'Добро пожаловать в Aurasveta', level: 2 } },
				{ type: 'paragraph', data: { text: 'Управляйте контентом через CMS.' } },
			],
			showAsBanner: true,
			bannerLink: '/pages/welcome',
			isSystem: false,
		},
		create: {
			title: 'Добро пожаловать',
			slug: 'welcome',
			isPublished: true,
			publishedAt: new Date(),
			authorId: adminId,
			content: '<h2>Добро пожаловать в Aurasveta</h2><p>Управляйте контентом через CMS.</p>',
			contentBlocks: [
				{ type: 'heading', data: { text: 'Добро пожаловать в Aurasveta', level: 2 } },
				{ type: 'paragraph', data: { text: 'Управляйте контентом через CMS.' } },
			],
			showAsBanner: true,
			bannerLink: '/pages/welcome',
			isSystem: false,
		},
	})
}

async function main() {
	console.log('🌱 Seeding database...')

	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {
			name: 'Администратор',
			role: 'ADMIN',
			emailVerified: true,
		},
		create: {
			email: 'admin@example.com',
			name: 'Администратор',
			role: 'ADMIN',
			emailVerified: true,
		},
	})

	const user = await prisma.user.upsert({
		where: { email: 'user@example.com' },
		update: {
			name: 'Иван Петров',
			role: 'USER',
			emailVerified: true,
			phone: '+375291234567',
		},
		create: {
			email: 'user@example.com',
			name: 'Иван Петров',
			role: 'USER',
			emailVerified: true,
			phone: '+375291234567',
		},
	})

	await seedCredentialAccount({
		userId: admin.id,
		password: 'admin123',
	})

	await seedCredentialAccount({
		userId: user.id,
		password: 'user123',
	})

	console.log('✅ Users prepared')

	const existingTables = await getExistingPublicTables()
	assertRequiredTables(existingTables)

	await clearCatalogData(existingTables)
	console.log('✅ Old catalog data removed')

	const categoryIds = await seedCategories()
	console.log(`✅ Categories created: ${categoryIds.size}`)

	const propertyData = await seedProperties()
	console.log(`✅ Properties created: ${propertyData.size}`)

	const products = await seedProducts({
		adminId: admin.id,
		categoryIds,
		propertyData,
	})
	console.log(`✅ Products created: ${products.length}`)

	await seedPages(admin.id)
	console.log(`✅ Content pages created: ${CONTENT_PAGES.length}`)

	await seedWebhook()
	console.log('✅ Webhook created')

	await seedBehavioralData({
		userId: user.id,
		products,
		existingTables,
	})
	console.log('✅ Product views and search queries created')

	await runIfTableExists({
		existingTables,
		tableName: 'section_types',
		label: 'section types',
		action: async () => {
			const typeIds = await seedSectionTypes()
			console.log(`✅ SectionTypes upserted: ${typeIds.size}; HomeSections seeded`)
		},
	})

	await runIfTableExists({
		existingTables,
		tableName: 'settings',
		label: 'cms settings',
		action: async () => {
			await seedCmsSettings()
			console.log('✅ CMS settings upserted')
		},
	})

	await seedCmsProperties()
	console.log('✅ CMS properties upserted')

	await seedWelcomePage(admin.id)
	console.log('✅ Welcome page upserted')

	console.log('🎉 Seeding complete!')
}

main()
	.catch(error => {
		console.error('❌ Seed failed:', error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
