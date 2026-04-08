import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is not set. Run with: npx tsx --require dotenv/config prisma/seed.ts',
	)
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })

async function main() {
	console.log('🌱 Seeding database...')

	// ── Admin user (better-auth stores password in Account) ──
	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			name: 'Администратор',
			role: 'ADMIN',
			emailVerified: true,
		},
	})

	// better-auth credential account with proper hash
	const adminPasswordHash = await hashPassword('admin123')
	await prisma.account.upsert({
		where: {
			providerId_providerAccountId: {
				providerId: 'credential',
				providerAccountId: admin.id,
			},
		},
		update: { password: adminPasswordHash },
		create: {
			accountId: admin.id,
			userId: admin.id,
			providerId: 'credential',
			providerAccountId: admin.id,
			password: adminPasswordHash,
		},
	})

	// ── Regular user ──
	const user = await prisma.user.upsert({
		where: { email: 'user@example.com' },
		update: {},
		create: {
			email: 'user@example.com',
			name: 'Иван Петров',
			role: 'USER',
			emailVerified: true,
			phone: '+375291234567',
		},
	})

	const userPasswordHash = await hashPassword('admin123')
	await prisma.account.upsert({
		where: {
			providerId_providerAccountId: {
				providerId: 'credential',
				providerAccountId: user.id,
			},
		},
		update: { password: userPasswordHash },
		create: {
			accountId: user.id,
			userId: user.id,
			providerId: 'credential',
			providerAccountId: user.id,
			password: userPasswordHash,
		},
	})

	console.log('✅ Users created')

	// ── Categories (hierarchical) ──
	const electronics = await prisma.category.upsert({
		where: { slug: 'lustry' },
		update: {},
		create: {
			name: 'Люстры',
			slug: 'lustry',
			description: 'Потолочные люстры для дома',
			image: '/images/categories/lustry.jpg',
		},
	})

	await prisma.category.upsert({
		where: { slug: 'lustry-potolochnye' },
		update: {},
		create: {
			name: 'Потолочные люстры',
			slug: 'lustry-potolochnye',
			parentId: electronics.id,
		},
	})

	await prisma.category.upsert({
		where: { slug: 'lustry-podvesnye' },
		update: {},
		create: {
			name: 'Подвесные люстры',
			slug: 'lustry-podvesnye',
			parentId: electronics.id,
		},
	})

	const bra = await prisma.category.upsert({
		where: { slug: 'bra' },
		update: {},
		create: {
			name: 'Бра',
			slug: 'bra',
			description: 'Настенные бра и светильники',
			image: '/images/categories/bra.jpg',
		},
	})

	await prisma.category.upsert({
		where: { slug: 'bra-klassicheskie' },
		update: {},
		create: {
			name: 'Классические бра',
			slug: 'bra-klassicheskie',
			parentId: bra.id,
		},
	})

	await prisma.category.upsert({
		where: { slug: 'bra-sovremennye' },
		update: {},
		create: {
			name: 'Современные бра',
			slug: 'bra-sovremennye',
			parentId: bra.id,
		},
	})

	const torshery = await prisma.category.upsert({
		where: { slug: 'torshery' },
		update: {},
		create: {
			name: 'Торшеры',
			slug: 'torshery',
			description: 'Напольные торшеры',
			image: '/images/categories/torshery.jpg',
		},
	})

	const spoty = await prisma.category.upsert({
		where: { slug: 'spoty' },
		update: {},
		create: {
			name: 'Споты',
			slug: 'spoty',
			description: 'Точечные светильники',
			image: '/images/categories/spoty.jpg',
		},
	})

	const ulichnye = await prisma.category.upsert({
		where: { slug: 'ulichnye' },
		update: {},
		create: {
			name: 'Уличные светильники',
			slug: 'ulichnye',
			description: 'Наружное освещение',
			image: '/images/categories/ulichnye.jpg',
		},
	})

	const ledLenty = await prisma.category.upsert({
		where: { slug: 'svetodiodnye-lenty' },
		update: {},
		create: {
			name: 'Светодиодные ленты',
			slug: 'svetodiodnye-lenty',
			description: 'LED ленты и профили',
			image: '/images/categories/led.jpg',
		},
	})

	const nastolnye = await prisma.category.upsert({
		where: { slug: 'nastolnye-lampy' },
		update: {},
		create: {
			name: 'Настольные лампы',
			slug: 'nastolnye-lampy',
			description: 'Настольные светильники',
			image: '/images/categories/nastolnye.jpg',
		},
	})

	void [electronics, bra, torshery, spoty, ulichnye, ledLenty, nastolnye]

	console.log('✅ Categories created')

	// ── Properties ──
	const colorProp = await prisma.property.upsert({
		where: { key: 'color' },
		update: {},
		create: {
			key: 'color',
			name: 'Цвет',
			type: 'SELECT',
			options: ['Белый', 'Чёрный', 'Золотой', 'Серебристый', 'Бронзовый'],
		},
	})

	const materialProp = await prisma.property.upsert({
		where: { key: 'material' },
		update: {},
		create: {
			key: 'material',
			name: 'Материал',
			type: 'SELECT',
			options: ['Металл', 'Стекло', 'Хрусталь', 'Дерево', 'Пластик'],
		},
	})

	const styleProp = await prisma.property.upsert({
		where: { key: 'style' },
		update: {},
		create: {
			key: 'style',
			name: 'Стиль',
			type: 'SELECT',
			options: ['Классический', 'Современный', 'Лофт', 'Минимализм', 'Прованс'],
		},
	})

	const lampCountProp = await prisma.property.upsert({
		where: { key: 'lamp_count' },
		update: {},
		create: { key: 'lamp_count', name: 'Количество ламп', type: 'NUMBER' },
	})

	const powerProp = await prisma.property.upsert({
		where: { key: 'power' },
		update: {},
		create: { key: 'power', name: 'Мощность (Вт)', type: 'NUMBER' },
	})

	await prisma.property.upsert({
		where: { key: 'brand' },
		update: {},
		create: { key: 'brand', name: 'Бренд', type: 'STRING' },
	})

	const ipRatingProp = await prisma.property.upsert({
		where: { key: 'ip_rating' },
		update: {},
		create: {
			key: 'ip_rating',
			name: 'Степень защиты (IP)',
			type: 'SELECT',
			options: ['IP20', 'IP44', 'IP54', 'IP65', 'IP67'],
		},
	})

	await prisma.property.upsert({
		where: { key: 'dimmable' },
		update: {},
		create: { key: 'dimmable', name: 'Диммирование', type: 'BOOLEAN' },
	})

	console.log('✅ Properties created')

	// ── Products ──
	const productData = [
		{
			name: 'Люстра Elegance Gold 8',
			slug: 'lustry-elegance-gold-8',
			price: 15990,
			compareAtPrice: 19990,
			stock: 12,
			sku: 'LU-EG-008',
			categoryId: electronics.id,
			brand: 'Maytoni',
			brandCountry: 'Германия',
			images: ['/images/products/lustre-1.jpg'],
			badges: ['Хит'],
			rating: 4.8,
			reviewsCount: 24,
		},
		{
			name: 'Люстра Crystal Dream 6',
			slug: 'lustry-crystal-dream-6',
			price: 24500,
			stock: 5,
			sku: 'LU-CD-006',
			categoryId: electronics.id,
			brand: 'Favourite',
			brandCountry: 'Германия',
			images: ['/images/products/lustre-2.jpg'],
			badges: ['Новинка'],
			rating: 4.9,
			reviewsCount: 12,
		},
		{
			name: 'Люстра Modern Ring LED',
			slug: 'lustry-modern-ring-led',
			price: 32000,
			compareAtPrice: 38000,
			stock: 8,
			sku: 'LU-MR-LED',
			categoryId: electronics.id,
			brand: 'ST Luce',
			brandCountry: 'Италия',
			images: ['/images/products/lustre-3.jpg'],
			badges: ['Хит', 'LED'],
			rating: 4.7,
			reviewsCount: 18,
		},
		{
			name: 'Люстра Provance White 5',
			slug: 'lustry-provance-white-5',
			price: 11990,
			stock: 15,
			sku: 'LU-PW-005',
			categoryId: electronics.id,
			brand: 'Arte Lamp',
			brandCountry: 'Италия',
			images: ['/images/products/lustre-4.jpg'],
			rating: 4.5,
			reviewsCount: 8,
		},
		{
			name: 'Люстра Loft Industrial',
			slug: 'lustry-loft-industrial',
			price: 8990,
			compareAtPrice: 11990,
			stock: 20,
			sku: 'LU-LI-001',
			categoryId: electronics.id,
			brand: 'Lussole',
			brandCountry: 'Италия',
			images: ['/images/products/lustre-5.jpg'],
			badges: ['Скидка'],
			rating: 4.3,
			reviewsCount: 31,
		},

		{
			name: 'Бра Classic Arm Bronze',
			slug: 'bra-classic-arm-bronze',
			price: 4990,
			stock: 25,
			sku: 'BR-CA-BRZ',
			categoryId: bra.id,
			brand: 'Maytoni',
			brandCountry: 'Германия',
			images: ['/images/products/bra-1.jpg'],
			rating: 4.6,
			reviewsCount: 14,
		},
		{
			name: 'Бра Modern Glass Tube',
			slug: 'bra-modern-glass-tube',
			price: 6500,
			compareAtPrice: 7990,
			stock: 10,
			sku: 'BR-MG-TB',
			categoryId: bra.id,
			brand: 'Odeon Light',
			brandCountry: 'Италия',
			images: ['/images/products/bra-2.jpg'],
			badges: ['Новинка'],
			rating: 4.7,
			reviewsCount: 6,
		},
		{
			name: 'Бра Minimalist Wall LED',
			slug: 'bra-minimalist-wall-led',
			price: 3490,
			stock: 30,
			sku: 'BR-MW-LED',
			categoryId: bra.id,
			brand: 'Elektrostandard',
			brandCountry: 'Россия',
			images: ['/images/products/bra-3.jpg'],
			badges: ['LED'],
			rating: 4.4,
			reviewsCount: 22,
		},

		{
			name: 'Торшер Arc Floor Chrome',
			slug: 'torsher-arc-floor-chrome',
			price: 12990,
			stock: 7,
			sku: 'TR-AF-CHR',
			categoryId: torshery.id,
			brand: 'ST Luce',
			brandCountry: 'Италия',
			images: ['/images/products/torsher-1.jpg'],
			badges: ['Хит'],
			rating: 4.8,
			reviewsCount: 16,
		},
		{
			name: 'Торшер Tripod Wood',
			slug: 'torsher-tripod-wood',
			price: 9990,
			compareAtPrice: 13990,
			stock: 4,
			sku: 'TR-TW-001',
			categoryId: torshery.id,
			brand: 'Lussole',
			brandCountry: 'Италия',
			images: ['/images/products/torsher-2.jpg'],
			badges: ['Скидка'],
			rating: 4.5,
			reviewsCount: 9,
		},
		{
			name: 'Торшер Reading LED Flex',
			slug: 'torsher-reading-led-flex',
			price: 7490,
			stock: 18,
			sku: 'TR-RL-FLX',
			categoryId: torshery.id,
			brand: 'Arte Lamp',
			brandCountry: 'Италия',
			images: ['/images/products/torsher-3.jpg'],
			badges: ['LED'],
			rating: 4.3,
			reviewsCount: 7,
		},

		{
			name: 'Спот встраиваемый LED 12W',
			slug: 'spot-vstraivaemyj-led-12w',
			price: 1990,
			stock: 50,
			sku: 'SP-VL-12W',
			categoryId: spoty.id,
			brand: 'Elektrostandard',
			brandCountry: 'Россия',
			images: ['/images/products/spot-1.jpg'],
			badges: ['LED'],
			rating: 4.6,
			reviewsCount: 45,
		},
		{
			name: 'Спот поворотный тройной',
			slug: 'spot-povorotnyj-trojnoj',
			price: 5490,
			stock: 15,
			sku: 'SP-PT-003',
			categoryId: spoty.id,
			brand: 'Arte Lamp',
			brandCountry: 'Италия',
			images: ['/images/products/spot-2.jpg'],
			rating: 4.4,
			reviewsCount: 11,
		},
		{
			name: 'Спот трековый GU10 Black',
			slug: 'spot-trekovyj-gu10-black',
			price: 2990,
			compareAtPrice: 3990,
			stock: 35,
			sku: 'SP-TG-BLK',
			categoryId: spoty.id,
			brand: 'Novotech',
			brandCountry: 'Венгрия',
			images: ['/images/products/spot-3.jpg'],
			badges: ['Скидка'],
			rating: 4.2,
			reviewsCount: 19,
		},

		{
			name: 'Уличный светильник столбик',
			slug: 'ulichnyj-svetilnik-stolbik',
			price: 8990,
			stock: 10,
			sku: 'UL-SS-001',
			categoryId: ulichnye.id,
			brand: 'Novotech',
			brandCountry: 'Венгрия',
			images: ['/images/products/outdoor-1.jpg'],
			badges: ['IP65'],
			rating: 4.7,
			reviewsCount: 13,
		},
		{
			name: 'Уличный фасадный LED Up/Down',
			slug: 'ulichnyj-fasadnyj-led',
			price: 4990,
			compareAtPrice: 6990,
			stock: 20,
			sku: 'UL-FL-UD',
			categoryId: ulichnye.id,
			brand: 'Elektrostandard',
			brandCountry: 'Россия',
			images: ['/images/products/outdoor-2.jpg'],
			badges: ['LED', 'Скидка'],
			rating: 4.5,
			reviewsCount: 27,
		},
		{
			name: 'Уличный подвесной фонарь',
			slug: 'ulichnyj-podvesnoj-fonar',
			price: 11990,
			stock: 6,
			sku: 'UL-PF-001',
			categoryId: ulichnye.id,
			brand: 'Maytoni',
			brandCountry: 'Германия',
			images: ['/images/products/outdoor-3.jpg'],
			rating: 4.8,
			reviewsCount: 5,
		},

		{
			name: 'LED лента 5м тёплый белый',
			slug: 'led-lenta-5m-teplyj-belyj',
			price: 1490,
			stock: 100,
			sku: 'LD-5T-WW',
			categoryId: ledLenty.id,
			brand: 'Gauss',
			brandCountry: 'Россия',
			images: ['/images/products/led-1.jpg'],
			rating: 4.3,
			reviewsCount: 56,
		},
		{
			name: 'LED лента RGB 5м с пультом',
			slug: 'led-lenta-rgb-5m-pult',
			price: 2990,
			compareAtPrice: 3990,
			stock: 40,
			sku: 'LD-5R-RGB',
			categoryId: ledLenty.id,
			brand: 'Gauss',
			brandCountry: 'Россия',
			images: ['/images/products/led-2.jpg'],
			badges: ['Хит', 'Скидка'],
			rating: 4.6,
			reviewsCount: 78,
		},
		{
			name: 'LED профиль алюминиевый 2м',
			slug: 'led-profil-alyuminievyj-2m',
			price: 890,
			stock: 60,
			sku: 'LD-PA-2M',
			categoryId: ledLenty.id,
			brand: 'Arlight',
			brandCountry: 'Россия',
			images: ['/images/products/led-3.jpg'],
			rating: 4.1,
			reviewsCount: 12,
		},

		{
			name: 'Настольная лампа Office LED',
			slug: 'nastolnaya-lampa-office-led',
			price: 3990,
			stock: 22,
			sku: 'NL-OL-LED',
			categoryId: nastolnye.id,
			brand: 'Elektrostandard',
			brandCountry: 'Россия',
			images: ['/images/products/desk-1.jpg'],
			badges: ['LED'],
			rating: 4.5,
			reviewsCount: 33,
		},
		{
			name: 'Настольная лампа Tiffany',
			slug: 'nastolnaya-lampa-tiffany',
			price: 14990,
			stock: 3,
			sku: 'NL-TF-001',
			categoryId: nastolnye.id,
			brand: 'Favourite',
			brandCountry: 'Германия',
			images: ['/images/products/desk-2.jpg'],
			badges: ['Премиум'],
			rating: 4.9,
			reviewsCount: 4,
		},
		{
			name: 'Настольная лампа с зажимом',
			slug: 'nastolnaya-lampa-s-zazhimom',
			price: 2490,
			compareAtPrice: 3490,
			stock: 28,
			sku: 'NL-ZH-001',
			categoryId: nastolnye.id,
			brand: 'Arte Lamp',
			brandCountry: 'Италия',
			images: ['/images/products/desk-3.jpg'],
			badges: ['Скидка'],
			rating: 4.2,
			reviewsCount: 15,
		},

		{
			name: 'Люстра потолочная LED Saturn',
			slug: 'lustry-potolochnaya-led-saturn',
			price: 19990,
			stock: 9,
			sku: 'LU-PL-SAT',
			categoryId: electronics.id,
			brand: 'Citilux',
			brandCountry: 'Дания',
			images: ['/images/products/lustre-6.jpg'],
			badges: ['LED', 'Новинка'],
			rating: 4.7,
			reviewsCount: 10,
		},
		{
			name: 'Люстра каскадная хрустальная',
			slug: 'lustry-kaskadnaya-hrustalnaya',
			price: 45000,
			stock: 2,
			sku: 'LU-KH-001',
			categoryId: electronics.id,
			brand: 'Bohemia',
			brandCountry: 'Чехия',
			images: ['/images/products/lustre-7.jpg'],
			badges: ['Премиум'],
			rating: 5.0,
			reviewsCount: 3,
		},

		{
			name: 'Бра поворотное с выключателем',
			slug: 'bra-povorotnoe-s-vyklyuchatelem',
			price: 3990,
			stock: 17,
			sku: 'BR-PV-SW',
			categoryId: bra.id,
			brand: 'Odeon Light',
			brandCountry: 'Италия',
			images: ['/images/products/bra-4.jpg'],
			rating: 4.3,
			reviewsCount: 19,
		},
		{
			name: 'Бра хрустальное Asfour',
			slug: 'bra-hrustalnoe-asfour',
			price: 8990,
			stock: 6,
			sku: 'BR-HA-001',
			categoryId: bra.id,
			brand: 'Osgona',
			brandCountry: 'Италия',
			images: ['/images/products/bra-5.jpg'],
			badges: ['Премиум'],
			rating: 4.9,
			reviewsCount: 2,
		},
	]

	for (const p of productData) {
		await prisma.product.upsert({
			where: { slug: p.slug },
			update: {},
			create: {
				name: p.name,
				slug: p.slug,
				price: p.price,
				compareAtPrice: p.compareAtPrice,
				stock: p.stock,
				sku: p.sku,
				categoryId: p.categoryId,
				brand: p.brand,
				brandCountry: p.brandCountry,
				images: p.images,
				badges: p.badges ?? [],
				rating: p.rating,
				reviewsCount: p.reviewsCount ?? 0,
				isActive: true,
				userId: admin.id,
			},
		})
	}

	console.log(`✅ ${productData.length} products created`)

	// ── Assign properties to some products ──
	const allProducts = await prisma.product.findMany({
		select: { id: true, slug: true, categoryId: true },
	})

	const propertyAssignments: {
		productSlug: string
		propertyId: string
		value: string
	}[] = [
		{
			productSlug: 'lustry-elegance-gold-8',
			propertyId: colorProp.id,
			value: 'Золотой',
		},
		{
			productSlug: 'lustry-elegance-gold-8',
			propertyId: materialProp.id,
			value: 'Металл',
		},
		{
			productSlug: 'lustry-elegance-gold-8',
			propertyId: styleProp.id,
			value: 'Классический',
		},
		{
			productSlug: 'lustry-elegance-gold-8',
			propertyId: lampCountProp.id,
			value: '8',
		},
		{
			productSlug: 'lustry-elegance-gold-8',
			propertyId: powerProp.id,
			value: '480',
		},

		{
			productSlug: 'lustry-crystal-dream-6',
			propertyId: colorProp.id,
			value: 'Серебристый',
		},
		{
			productSlug: 'lustry-crystal-dream-6',
			propertyId: materialProp.id,
			value: 'Хрусталь',
		},
		{
			productSlug: 'lustry-crystal-dream-6',
			propertyId: styleProp.id,
			value: 'Классический',
		},
		{
			productSlug: 'lustry-crystal-dream-6',
			propertyId: lampCountProp.id,
			value: '6',
		},

		{
			productSlug: 'lustry-modern-ring-led',
			propertyId: colorProp.id,
			value: 'Белый',
		},
		{
			productSlug: 'lustry-modern-ring-led',
			propertyId: materialProp.id,
			value: 'Металл',
		},
		{
			productSlug: 'lustry-modern-ring-led',
			propertyId: styleProp.id,
			value: 'Современный',
		},
		{
			productSlug: 'lustry-modern-ring-led',
			propertyId: powerProp.id,
			value: '120',
		},

		{
			productSlug: 'lustry-loft-industrial',
			propertyId: colorProp.id,
			value: 'Чёрный',
		},
		{
			productSlug: 'lustry-loft-industrial',
			propertyId: styleProp.id,
			value: 'Лофт',
		},
		{
			productSlug: 'lustry-loft-industrial',
			propertyId: materialProp.id,
			value: 'Металл',
		},

		{
			productSlug: 'bra-classic-arm-bronze',
			propertyId: colorProp.id,
			value: 'Бронзовый',
		},
		{
			productSlug: 'bra-classic-arm-bronze',
			propertyId: styleProp.id,
			value: 'Классический',
		},
		{
			productSlug: 'bra-classic-arm-bronze',
			propertyId: materialProp.id,
			value: 'Металл',
		},

		{
			productSlug: 'bra-minimalist-wall-led',
			propertyId: colorProp.id,
			value: 'Белый',
		},
		{
			productSlug: 'bra-minimalist-wall-led',
			propertyId: styleProp.id,
			value: 'Минимализм',
		},
		{
			productSlug: 'bra-minimalist-wall-led',
			propertyId: powerProp.id,
			value: '12',
		},

		{
			productSlug: 'torsher-arc-floor-chrome',
			propertyId: colorProp.id,
			value: 'Серебристый',
		},
		{
			productSlug: 'torsher-arc-floor-chrome',
			propertyId: styleProp.id,
			value: 'Современный',
		},

		{
			productSlug: 'spot-vstraivaemyj-led-12w',
			propertyId: powerProp.id,
			value: '12',
		},
		{
			productSlug: 'spot-vstraivaemyj-led-12w',
			propertyId: ipRatingProp.id,
			value: 'IP44',
		},

		{
			productSlug: 'ulichnyj-svetilnik-stolbik',
			propertyId: ipRatingProp.id,
			value: 'IP65',
		},
		{
			productSlug: 'ulichnyj-svetilnik-stolbik',
			propertyId: colorProp.id,
			value: 'Чёрный',
		},

		{
			productSlug: 'ulichnyj-fasadnyj-led',
			propertyId: ipRatingProp.id,
			value: 'IP65',
		},
		{
			productSlug: 'ulichnyj-fasadnyj-led',
			propertyId: powerProp.id,
			value: '24',
		},

		{
			productSlug: 'led-lenta-5m-teplyj-belyj',
			propertyId: powerProp.id,
			value: '60',
		},
		{
			productSlug: 'led-lenta-rgb-5m-pult',
			propertyId: powerProp.id,
			value: '72',
		},
	]

	for (const pa of propertyAssignments) {
		const product = allProducts.find(p => p.slug === pa.productSlug)
		if (!product) continue

		await prisma.productPropertyValue.upsert({
			where: {
				productId_propertyId: {
					productId: product.id,
					propertyId: pa.propertyId,
				},
			},
			update: { value: pa.value },
			create: {
				productId: product.id,
				propertyId: pa.propertyId,
				value: pa.value,
			},
		})
	}

	console.log('✅ Product properties assigned')

	// ── Content pages ──
	const contentPages = [
		{
			title: 'О нас',
			slug: 'about',
			content: `# О магазине «Аура Света»

Мы — интернет-магазин светильников и люстр в Мозыре, работающий с 2015 года. Предлагаем широкий ассортимент осветительных приборов от ведущих европейских и российских производителей.

## Наши преимущества

- **Более 5000 товаров** в каталоге
- **Бесплатная доставка** по Мозырю
- **Гарантия** от 1 до 5 лет на всю продукцию
- **Профессиональная** консультация по подбору освещения
- **Дизайн-проекты** освещения для дома и офиса

## Контакты

📞 +375 (29) 123-45-67
📧 info@aurasveta.by
📍 г. Мозырь, ул. Интернациональная, 5`,
			metaTitle: 'О магазине Аура Света — интернет-магазин светильников',
			metaDesc:
				'Интернет-магазин люстр и светильников в Мозыре. Более 5000 товаров, бесплатная доставка, гарантия.',
			isPublished: true,
		},
		{
			title: 'Доставка и оплата',
			slug: 'delivery',
			content: `# Доставка и оплата

## Доставка

### По Мозырю
- **Бесплатно** при заказе от 100 BYN
- Стоимость доставки при заказе до 100 BYN — **5 BYN**
- Срок доставки: **1-2 рабочих дня**

### По Беларуси
- Доставка курьерской службой — от **8 BYN**
- Доставка почтой — от **5 BYN**
- Срок доставки: **2-5 рабочих дней**

## Оплата

- Наличными при получении
- Банковская карта (Visa, MasterCard)
- Оплата через ЕРИП
- Безналичный расчёт (для юр. лиц)

## Возврат

Возврат товара надлежащего качества в течение 14 дней с момента покупки.`,
			metaTitle: 'Доставка и оплата — Аура Света',
			metaDesc:
				'Условия доставки и оплаты в интернет-магазине Аура Света. Бесплатная доставка по Мозырю.',
			isPublished: true,
		},
		{
			title: 'Контакты',
			slug: 'contacts',
			content: `# Контакты

## Магазин «Аура Света»

📍 **Адрес:** г. Мозырь, ул. Интернациональная, 5
📞 **Телефон:** +375 (29) 123-45-67
📧 **Email:** info@aurasveta.by

### Режим работы
- Пн–Пт: 9:00 – 19:00
- Сб: 10:00 – 17:00
- Вс: выходной

### Реквизиты
ИП Иванов И.И.
УНП 123456789`,
			metaTitle: 'Контакты — Аура Света',
			metaDesc:
				'Контакты интернет-магазина Аура Света в Мозыре. Адрес, телефон, режим работы.',
			isPublished: true,
		},
	]

	for (const p of contentPages) {
		const page = await prisma.page.upsert({
			where: { slug: p.slug },
			update: {},
			create: {
				title: p.title,
				slug: p.slug,
				content: p.content,
				metaTitle: p.metaTitle,
				metaDesc: p.metaDesc,
				isPublished: p.isPublished,
				publishedAt: p.isPublished ? new Date() : null,
				authorId: admin.id,
			},
		})

		// Create initial version
		const existingVersion = await prisma.pageVersion.findFirst({
			where: { pageId: page.id },
		})
		if (!existingVersion) {
			await prisma.pageVersion.create({
				data: {
					pageId: page.id,
					title: page.title,
					content: page.content,
					metaTitle: page.metaTitle,
					metaDesc: page.metaDesc,
					version: 1,
					createdBy: admin.id,
				},
			})
		}
	}

	console.log('✅ Content pages created')

	// ── Test webhook (optional) ──
	await prisma.webhook.upsert({
		where: { id: 'seed-webhook' },
		update: {},
		create: {
			id: 'seed-webhook',
			url: 'https://webhook.site/test',
			events: ['product.created', 'product.updated', 'order.created'],
		},
	})

	console.log('✅ Test webhook created')
	console.log('🎉 Seeding complete!')
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect())
