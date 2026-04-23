import { PropertyType } from '@prisma/client'
import { generateSlug } from '../shared/lib/generateSlug'

export type SeedCategoryDefinition = {
	name: string
	slug: string
	description: string
	children?: SeedCategoryDefinition[]
}

export type SeedPropertyDefinition = {
	key: string
	name: string
	type: PropertyType
	options?: string[]
}

export type SeedPropertyValue = {
	key: string
	value: string | number | boolean
}

export type SeedProductDefinition = {
	name: string
	slug: string
	description: string
	price: number
	compareAtPrice: number | null
	stock: number
	sku: string
	categorySlug: string
	brand: string
	brandCountry: string
	badges: string[]
	rating: number
	reviewsCount: number
	metaTitle: string
	metaDesc: string
	propertyValues: SeedPropertyValue[]
}

const BRAND_COUNTRIES = {
	Citilux: 'Дания',
	Maytoni: 'Германия',
	Eglo: 'Австрия',
	Lightstar: 'Италия',
	'Arte Lamp': 'Италия',
	'Odeon Light': 'Италия',
	'ST Luce': 'Италия',
	Novotech: 'Венгрия',
	Denkirs: 'Словения',
	Eurosvet: 'Россия',
	Freya: 'Германия',
	'Crystal Lux': 'Испания',
	'Loft IT': 'Испания',
	Elektrostandard: 'Германия',
	Reluce: 'Италия',
	Lumion: 'Италия',
	Feron: 'Россия',
	Werkel: 'Швеция',
	Apeyron: 'Россия',
	Voltega: 'Германия',
	Escada: 'Великобритания',
	'Kink Light': 'Китай',
	'Ambrella Light': 'Китай',
	Favourite: 'Германия',
	IMEX: 'Германия',
	Mantra: 'Испания',
	Saffit: 'Россия',
	Rivoli: 'Италия',
	Velante: 'Италия',
	Omnilux: 'Италия',
	Modelux: 'Китай',
	Aployt: 'Польша',
	Bogates: 'Россия',
	Arlight: 'Россия',
	Uniel: 'Китай',
} as const

type BrandName = keyof typeof BRAND_COUNTRIES

type SeedSubcategory = {
	name: string
	slug: string
	productLabel: string
	placement: string
	purpose: string
	mountingType: string
}

type LightingGeneratorOptions = {
	categoryCode: string
	topCategoryName: string
	productTypeValue: string
	count: number
	brands: readonly BrandName[]
	subcategories: readonly SeedSubcategory[]
	series: readonly string[]
	stylePool: readonly string[]
	materialPool: readonly string[]
	colorPool: readonly string[]
	basePool: readonly string[]
	powerRange: readonly [number, number]
	lampCountRange: readonly [number, number]
	outdoor?: boolean
	allowSmart?: boolean
	allowBattery?: boolean
	allowSolar?: boolean
	ledBias?: boolean
	accentPool?: readonly string[]
}

const brandPrefixes: Record<BrandName, string> = {
	Citilux: 'CL',
	Maytoni: 'MOD',
	Eglo: 'EG',
	Lightstar: 'LS',
	'Arte Lamp': 'AL',
	'Odeon Light': 'OD',
	'ST Luce': 'ST',
	Novotech: 'NV',
	Denkirs: 'DK',
	Eurosvet: 'ES',
	Freya: 'FR',
	'Crystal Lux': 'CR',
	'Loft IT': 'LI',
	Elektrostandard: 'EL',
	Reluce: 'RL',
	Lumion: 'LM',
	Feron: 'FN',
	Werkel: 'WK',
	Apeyron: 'AP',
	Voltega: 'VG',
	Escada: 'EC',
	'Kink Light': 'KL',
	'Ambrella Light': 'AM',
	Favourite: 'FV',
	IMEX: 'IM',
	Mantra: 'MN',
	Saffit: 'SF',
	Rivoli: 'RV',
	Velante: 'VL',
	Omnilux: 'OM',
	Modelux: 'ML',
	Aployt: 'AY',
	Bogates: 'BG',
	Arlight: 'AR',
	Uniel: 'UN',
}

const warmTemperatures = ['2700K', '3000K', '3300K'] as const
const neutralTemperatures = ['3000K', '4000K', '4200K'] as const
const smartTemperatures = ['3000K', '4000K', '5500K'] as const

function cycle<T>(items: readonly T[], index: number, stride = 1): T {
	return items[(index * stride) % items.length]!
}

function rangeValue(min: number, max: number, index: number, stride = 1): number {
	if (min === max) return min
	const size = max - min + 1
	return min + ((index * stride) % size)
}

function roundPrice(value: number): number {
	return Math.round(value / 10) * 10
}

function buildModelCode(brand: BrandName, index: number, suffix: string): string {
	const prefix = brandPrefixes[brand]
	const core = 1000 + index * 17
	return `${prefix}${core}${suffix}`
}

function buildSlug(name: string, index: number): string {
	const base = generateSlug(name)
	const suffix = `${index + 1}`
	return `${base}-${suffix}`.slice(0, 100)
}

function buildRating(index: number): number {
	const base = 4.4 + (index % 6) * 0.1
	return Number(Math.min(5, base).toFixed(1))
}

function buildReviewsCount(index: number, bias = 0): number {
	return 4 + ((index * 7 + bias) % 87)
}

function buildCompareAtPrice(price: number, index: number): number | null {
	if (index % 4 !== 0) return null
	const multiplier = 1.12 + (index % 4) * 0.03
	return roundPrice(price * multiplier)
}

function buildBadges(params: {
	compareAtPrice: number | null
	index: number
	led: boolean
	smart: boolean
	outdoor: boolean
}): string[] {
	const badges: string[] = []
	if (params.index % 7 === 0) badges.push('Хит')
	if (params.index % 11 === 0) badges.push('Новинка')
	if (params.led) badges.push('LED')
	if (params.smart) badges.push('Smart')
	if (params.outdoor && params.index % 3 === 0) badges.push('IP65')
	if (params.compareAtPrice) badges.push('Скидка')
	return Array.from(new Set(badges)).slice(0, 3)
}

function buildLightingDescription(params: {
	label: string
	brand: BrandName
	series: string
	style: string
	material: string
	purpose: string
	baseType: string
	lampCount: number
	powerWatts: number
	totalPowerWatts: number
	colorTemperature: string
	luminousFlux: number
	ipRating: string
	dimmable: boolean
	smart: boolean
	outdoor: boolean
	powerSource: string
	accent: string
}): string {
	const sentences = [
		`${params.label} ${params.brand} серии ${params.series} выдержан в стиле ${params.style.toLowerCase()}.`,
		`${params.accent} Корпус сочетает ${params.material.toLowerCase()} и аккуратную отделку под современный интерьер.`,
	]

	if (params.baseType === 'LED') {
		sentences.push(
			`Интегрированный LED-модуль ${params.powerWatts} Вт обеспечивает световой поток около ${params.luminousFlux} лм и цветовую температуру ${params.colorTemperature}.`,
		)
	} else {
		sentences.push(
			`Конструкция рассчитана на ${params.lampCount} ламп с цоколем ${params.baseType}, суммарная мощность до ${params.totalPowerWatts} Вт.`,
		)
	}

	if (params.smart) {
		sentences.push('Поддерживает регулировку яркости и сценарии умного освещения.')
	} else if (params.dimmable) {
		sentences.push('Совместим с диммированием для мягкой настройки атмосферы.')
	}

	if (params.outdoor) {
		sentences.push(
			`Степень защиты ${params.ipRating}, питание ${params.powerSource.toLowerCase()}, подходит для зоны ${params.purpose.toLowerCase()}.`,
		)
	} else {
		sentences.push(`Оптимален для зоны ${params.purpose.toLowerCase()}.`)
	}

	return sentences.join(' ')
}

function createLightingProducts(options: LightingGeneratorOptions): SeedProductDefinition[] {
	return Array.from({ length: options.count }, (_, index) => {
		const subcategory = cycle(options.subcategories, index)
		const brand = cycle(options.brands, index, 2)
		const series = cycle(options.series, index, 3)
		const style = cycle(options.stylePool, index, 2)
		const color = cycle(options.colorPool, index, 3)
		const primaryMaterial = cycle(options.materialPool, index)
		const secondaryMaterial = cycle(options.materialPool, index + 2)
		const material =
			primaryMaterial === secondaryMaterial
				? primaryMaterial
				: `${primaryMaterial}, ${secondaryMaterial}`
		const led = options.ledBias ? index % 3 !== 1 : index % 4 === 0
		const smart = options.allowSmart ? index % 9 === 0 : false
		const battery = options.allowBattery ? index % 10 === 0 : false
		const solar = options.allowSolar ? index % 8 === 0 : false
		const baseType =
			smart || led || battery || solar
				? 'LED'
				: cycle(options.basePool, index, 2)
		const lampCount =
			baseType === 'LED'
				? Math.max(1, Math.min(3, rangeValue(1, 3, index, 2)))
				: rangeValue(options.lampCountRange[0], options.lampCountRange[1], index, 2)
		const powerWatts =
			baseType === 'LED'
				? rangeValue(options.powerRange[0], options.powerRange[1], index, 3)
				: Math.max(5, Math.min(60, rangeValue(5, Math.max(20, options.powerRange[1]), index, 5)))
		const totalPowerWatts =
			baseType === 'LED' ? powerWatts : Math.max(powerWatts, powerWatts * lampCount)
		const colorTemperature = smart
			? cycle(smartTemperatures, index)
			: baseType === 'LED'
				? cycle(neutralTemperatures, index)
				: cycle(warmTemperatures, index)
		const luminousFlux =
			baseType === 'LED'
				? powerWatts * 88 + (index % 5) * 75
				: totalPowerWatts * 12 + (index % 5) * 30
		const roomArea = Math.max(4, Math.round(totalPowerWatts / 12))
		const ipRating = options.outdoor
			? cycle(['IP44', 'IP54', 'IP65'], index, 2)
			: index % 6 === 0
				? 'IP44'
				: 'IP20'
		const dimmable = smart || index % 5 === 0
		const powerSource = solar
			? 'Солнечная батарея'
			: battery
				? 'Аккумулятор'
				: subcategory.productLabel.includes('Магнитная')
					? '24V'
					: 'Сеть 220V'
		const accent = cycle(
			options.accentPool ?? [
				'Модель собрана с акцентом на практичность.',
				'Хорошо смотрится как в жилом, так и в коммерческом пространстве.',
				'Подчеркивает геометрию интерьера и даёт комфортный рассеянный свет.',
			],
			index,
		)
		const vendorCode = buildModelCode(brand, index, options.categoryCode)
		const name = `${subcategory.productLabel} ${brand} ${series} ${vendorCode}`
		const priceBase = rangeValue(options.powerRange[0] * 120, options.powerRange[1] * 520, index, 7)
		const categoryMultiplier = options.outdoor ? 1.08 : 1
		const price = roundPrice(Math.max(190, priceBase * categoryMultiplier))
		const compareAtPrice = buildCompareAtPrice(price, index)
		const badges = buildBadges({ compareAtPrice, index, led, smart, outdoor: Boolean(options.outdoor) })
		const description = buildLightingDescription({
			label: subcategory.productLabel,
			brand,
			series,
			style,
			material,
			purpose: subcategory.purpose,
			baseType,
			lampCount,
			powerWatts,
			totalPowerWatts,
			colorTemperature,
			luminousFlux,
			ipRating,
			dimmable,
			smart,
			outdoor: Boolean(options.outdoor),
			powerSource,
			accent,
		})

		return {
			name,
			slug: buildSlug(name, index),
			description,
			price,
			compareAtPrice,
			stock: rangeValue(3, options.outdoor ? 160 : 90, index, 9),
			sku: `${options.categoryCode}-${String(index + 1).padStart(3, '0')}`,
			categorySlug: subcategory.slug,
			brand,
			brandCountry: BRAND_COUNTRIES[brand],
			badges,
			rating: buildRating(index),
			reviewsCount: buildReviewsCount(index, price % 13),
			metaTitle: `${name} — купить в Аура Света`,
			metaDesc: `${name} в категории «${options.topCategoryName}». ${description.slice(0, 140)}`,
			propertyValues: [
				{ key: 'product_type', value: options.productTypeValue },
				{ key: 'series', value: series },
				{ key: 'style', value: style },
				{ key: 'color', value: color },
				{ key: 'material', value: material },
				{ key: 'placement', value: subcategory.placement },
				{ key: 'purpose', value: subcategory.purpose },
				{ key: 'mounting_type', value: subcategory.mountingType },
				{ key: 'base_type', value: baseType },
				{ key: 'lamp_count', value: lampCount },
				{ key: 'power_watts', value: powerWatts },
				{ key: 'total_power_watts', value: totalPowerWatts },
				{ key: 'luminous_flux_lm', value: luminousFlux },
				{ key: 'color_temperature', value: colorTemperature },
				{ key: 'room_area_m2', value: roomArea },
				{ key: 'ip_rating', value: ipRating },
				{ key: 'dimmable', value: dimmable },
				{ key: 'smart_control', value: smart },
				{ key: 'power_source', value: powerSource },
			],
		}
	})
}

function createElectroProducts(): SeedProductDefinition[] {
	const brands: readonly BrandName[] = ['Werkel', 'Elektrostandard', 'Maytoni', 'Freya', 'Voltega', 'Arlight', 'ST Luce', 'Kink Light']
	const colors = ['Белый', 'Черный матовый', 'Слоновая кость', 'Графит', 'Шампань'] as const
	const socketSeries = ['Slab', 'Stark', 'Favorit', 'Acrylic', 'Senso'] as const
	const switchSeries = ['Stark', 'Favorit', 'Acrylic', 'Classic', 'Frame'] as const
	const dimmerSeries = ['Control', 'Smart Dim', 'Touch', 'Rotary', 'Design'] as const

	return Array.from({ length: 50 }, (_, index) => {
		const group = index % 3
		const brand = cycle(brands, index, 2)
		const color = cycle(colors, index)
		const grounding = group === 0 ? index % 5 !== 1 : false
		const usbPorts = group === 0 && index % 4 === 0 ? 2 : group === 0 && index % 6 === 0 ? 1 : 0
		const controlType = group === 2 ? cycle(['Поворотный', 'Сенсорный', 'Кнопочный', 'Wi‑Fi'], index) : 'Механический'
		const series =
			group === 0 ? cycle(socketSeries, index, 2) : group === 1 ? cycle(switchSeries, index, 2) : cycle(dimmerSeries, index, 2)
		const vendorCode = buildModelCode(brand, index, 'EL')
		const name =
			group === 0
				? `Розетка ${grounding ? 'с заземлением' : 'без заземления'} ${brand} ${series} ${vendorCode}`
				: group === 1
					? `Выключатель ${index % 2 === 0 ? 'одноклавишный' : 'двухклавишный'} ${brand} ${series} ${vendorCode}`
					: `Диммер ${controlType.toLowerCase()} ${brand} ${series} ${vendorCode}`
		const price = roundPrice(
			group === 0
				? 420 + (index % 9) * 230 + usbPorts * 350
				: group === 1
					? 390 + (index % 8) * 210
					: 1290 + (index % 10) * 340,
		)
		const compareAtPrice = buildCompareAtPrice(price, index)
		const badges = buildBadges({ compareAtPrice, index, led: false, smart: controlType === 'Wi‑Fi', outdoor: false })
		const description =
			group === 0
				? `Практичная розетка ${brand} серии ${series} в цвете «${color.toLowerCase()}». ${grounding ? 'Оснащена заземлением.' : 'Подходит для базовых бытовых сценариев.'} ${usbPorts > 0 ? `Имеет ${usbPorts} USB-порт${usbPorts > 1 ? 'а' : ''} для зарядки.` : 'Монтаж стандартный, скрытый.'}`
				: group === 1
					? `Выключатель ${brand} серии ${series} для аккуратной современной установки. Корпус выполнен в оттенке «${color.toLowerCase()}», рассчитан на повседневную нагрузку и чистую интеграцию в интерьер.`
					: `Диммер ${brand} серии ${series} с управлением типа «${controlType.toLowerCase()}». Подходит для управления освещением в жилых и коммерческих помещениях, обеспечивает плавную регулировку яркости.`

		return {
			name,
			slug: buildSlug(name, index),
			description,
			price,
			compareAtPrice,
			stock: 40 + ((index * 9) % 460),
			sku: `ELE-${String(index + 1).padStart(3, '0')}`,
			categorySlug: group === 0 ? 'rozetki' : group === 1 ? 'vyklyuchateli' : 'dimmery',
			brand,
			brandCountry: BRAND_COUNTRIES[brand],
			badges,
			rating: buildRating(index),
			reviewsCount: buildReviewsCount(index, 17),
			metaTitle: `${name} — купить в Аура Света`,
			metaDesc: `${name} в категории «Электротовары». ${description.slice(0, 140)}`,
			propertyValues: [
				{ key: 'product_type', value: 'Электротовар' },
				{ key: 'series', value: series },
				{ key: 'color', value: color },
				{ key: 'material', value: 'Пластик, металл' },
				{ key: 'placement', value: 'Стена' },
				{ key: 'purpose', value: 'Дом' },
				{ key: 'mounting_type', value: 'Встраиваемый' },
				{ key: 'power_source', value: 'Сеть 220V' },
				{ key: 'grounding', value: grounding },
				{ key: 'usb_ports', value: usbPorts },
				{ key: 'control_type', value: controlType },
			],
		}
	})
}

function createInteriorProducts(): SeedProductDefinition[] {
	const products = createLightingProducts({
		categoryCode: 'DEC',
		topCategoryName: 'Предметы интерьера',
		productTypeValue: 'Предмет интерьера',
		count: 50,
		brands: ['Eglo', 'Mantra', 'Reluce', 'Loft IT', 'Apeyron', 'Favourite', 'Lightstar', 'Citilux'],
		subcategories: [
			{
				name: 'Декоративные светильники',
				slug: 'dekorativnye-svetilniki',
				productLabel: 'Декоративный светильник',
				placement: 'Декор',
				purpose: 'Гостиная',
				mountingType: 'Накладной',
			},
			{
				name: 'Подсветка для картин',
				slug: 'podsvetka-dlya-kartin',
				productLabel: 'Подсветка для картин',
				placement: 'Стена',
				purpose: 'Декор',
				mountingType: 'Накладной',
			},
		],
		series: ['Roberval', 'Trazos', 'Pleasure', 'Horse', 'Savant', 'Kimitsu', 'Makilala', 'Azzurra', 'Belette', 'Equilibrium'],
		stylePool: ['Современный', 'Ар-деко', 'Скандинавский', 'Минимализм'],
		materialPool: ['Металл', 'Стекло', 'Хрусталь', 'Керамика', 'Латунь'],
		colorPool: ['Белый', 'Черный', 'Латунь', 'Золото', 'Айвори'],
		basePool: ['E14', 'E27', 'LED'],
		powerRange: [4, 24],
		lampCountRange: [1, 2],
		ledBias: true,
		accentPool: [
			'Создаёт мягкий декоративный акцент в интерьере.',
			'Хорошо работает как атмосферная подсветка и интерьерный объект.',
			'Добавляет визуальную глубину и подчёркивает фактуры отделки.',
		],
	})

	return products.map((product, index) => ({
		...product,
		propertyValues: product.propertyValues.filter(prop => prop.key !== 'room_area_m2').concat([
			{ key: 'shape', value: cycle(['Круг', 'Прямоугольник', 'Шар', 'Цилиндр'], index) },
		]),
	}))
}

function createBulbProducts(): SeedProductDefinition[] {
	const brands: readonly BrandName[] = ['Voltega', 'Feron', 'Saffit', 'Elektrostandard', 'Loft IT', 'Lightstar', 'Maytoni', 'Eglo']
	const bases = ['E27', 'E14', 'GU10', 'GU5.3', 'G9', 'GX53'] as const
	const shapes = ['Груша', 'Шар', 'Свеча', 'Капсула', 'Рефлектор'] as const
	const ledColors = ['2700K', '3000K', '4000K'] as const

	return Array.from({ length: 50 }, (_, index) => {
		const brand = cycle(brands, index, 2)
		const group = index % 3
		const baseType = cycle(bases, index)
		const shape = cycle(shapes, index + 1)
		const powerWatts =
			group === 0 ? rangeValue(5, 15, index, 2) : group === 1 ? rangeValue(25, 100, index, 3) : rangeValue(10, 50, index, 4)
		const equivalentPower =
			group === 0 ? powerWatts * 7 + (index % 3) * 5 : powerWatts
		const colorTemperature =
			group === 0 ? cycle(ledColors, index) : group === 1 ? '2700K' : cycle(['2700K', '3000K'], index)
		const lampType = group === 0 ? 'LED' : group === 1 ? 'Накаливания' : 'Галогенная'
		const dimmable = group !== 1 && index % 5 === 0
		const vendorCode = buildModelCode(brand, index, 'LB')
		const name =
			group === 0
				? `Светодиодная лампа ${brand} ${baseType} ${powerWatts}W ${colorTemperature} ${shape} ${vendorCode}`
				: group === 1
					? `Лампа накаливания ${brand} ${baseType} ${powerWatts}W ${shape} ${vendorCode}`
					: `Галогенная лампа ${brand} ${baseType} ${powerWatts}W ${vendorCode}`
		const price = roundPrice(
			group === 0 ? 70 + powerWatts * 17 + (index % 4) * 20 : group === 1 ? 35 + powerWatts * 4 : 110 + powerWatts * 3,
		)
		const compareAtPrice = buildCompareAtPrice(price, index)
		const badges = buildBadges({ compareAtPrice, index, led: group === 0, smart: dimmable, outdoor: false })
		const description =
			group === 0
				? `LED-лампа ${brand} с цоколем ${baseType}, мощностью ${powerWatts} Вт и температурой ${colorTemperature}. Подходит для бытовых светильников, обеспечивает экономичное и стабильное освещение.`
				: group === 1
					? `Классическая лампа накаливания ${brand} с цоколем ${baseType}. Даёт тёплый уютный свет, подходит для декоративных светильников и винтажных сценариев.`
					: `Галогенная лампа ${brand} с цоколем ${baseType}, рассчитана на ${powerWatts} Вт. Даёт плотный акцентный свет и подходит для спотов, бра и точечных светильников.`

		return {
			name,
			slug: buildSlug(name, index),
			description,
			price,
			compareAtPrice,
			stock: 120 + ((index * 37) % 1900),
			sku: `LMP-${String(index + 1).padStart(3, '0')}`,
			categorySlug:
				group === 0 ? 'svetodiodnye-lampy-led' : group === 1 ? 'lampy-nakalivaniya' : 'galogennye-lampy',
			brand,
			brandCountry: BRAND_COUNTRIES[brand],
			badges,
			rating: buildRating(index),
			reviewsCount: buildReviewsCount(index, 29),
			metaTitle: `${name} — купить в Аура Света`,
			metaDesc: `${name} в категории «Лампочки». ${description.slice(0, 140)}`,
			propertyValues: [
				{ key: 'product_type', value: 'Лампочка' },
				{ key: 'lamp_type', value: lampType },
				{ key: 'base_type', value: baseType },
				{ key: 'shape', value: shape },
				{ key: 'power_watts', value: powerWatts },
				{ key: 'equivalent_power_watts', value: equivalentPower },
				{ key: 'color_temperature', value: colorTemperature },
				{ key: 'dimmable', value: dimmable },
				{ key: 'purpose', value: 'Универсальное освещение' },
				{ key: 'power_source', value: 'Сеть 220V' },
			],
		}
	})
}

export const CATEGORY_DEFINITIONS: SeedCategoryDefinition[] = [
	{
		name: 'Люстры',
		slug: 'lyustry',
		description: 'Потолочные, подвесные, каскадные и хрустальные люстры для гостиной, спальни и кухни.',
		children: [
			{ name: 'Потолочные люстры', slug: 'potolochnye-lyustry', description: 'Компактные модели для стандартной высоты потолка.' },
			{ name: 'Подвесные люстры', slug: 'podvesnye-lyustry', description: 'Акцентные модели над столом, островом или в центре комнаты.' },
			{ name: 'Каскадные люстры', slug: 'kaskadnye-lyustry', description: 'Многоуровневые композиции для высоких помещений.' },
			{ name: 'Хрустальные люстры', slug: 'khrustalnye-lyustry', description: 'Декоративные люстры с кристаллами и эффектной игрой света.' },
		],
	},
	{
		name: 'Светильники',
		slug: 'svetilniki',
		description: 'Потолочные, встраиваемые, точечные и накладные светильники для дома и бизнеса.',
		children: [
			{ name: 'Потолочные светильники', slug: 'potolochnye-svetilniki', description: 'Основной свет для жилых и коммерческих помещений.' },
			{ name: 'Встраиваемые светильники', slug: 'vstraivaemye-svetilniki', description: 'Модели для натяжных и подвесных потолков.' },
			{ name: 'Точечные светильники', slug: 'tochechnye-svetilniki', description: 'Акцентные светильники с направленным светом.' },
			{ name: 'Накладные светильники', slug: 'nakladnye-svetilniki', description: 'Универсальные накладные модели для разных зон.' },
		],
	},
	{
		name: 'Трековые системы',
		slug: 'trekovye-sistemy',
		description: 'Трековые светильники и магнитные системы для гибкого сценарного освещения.',
		children: [
			{ name: 'Трековые светильники', slug: 'trekovye-svetilniki', description: 'Однофазные и дизайнерские решения на шинопроводе.' },
			{ name: 'Магнитные трековые системы', slug: 'magnitnye-trekovye-sistemy', description: 'Системы 24V с линейными и поворотными модулями.' },
		],
	},
	{
		name: 'Бра',
		slug: 'bra',
		description: 'Настенные бра и подсветки для спальни, коридора, ванной и декоративных сценариев.',
		children: [
			{ name: 'Бра с 1 плафоном', slug: 'bra-s-1-plafonom', description: 'Компактные настенные модели для локального света.' },
			{ name: 'Бра с 2 плафонами', slug: 'bra-s-2-plafonami', description: 'Двухрожковые решения для более широкой подсветки.' },
			{ name: 'Подсветка для зеркал', slug: 'podsvetka-dlya-zerkal', description: 'Подсветка для ванной и туалетного столика.' },
		],
	},
	{
		name: 'Споты',
		slug: 'spoty',
		description: 'Потолочные и встраиваемые споты для направленного и акцентного света.',
		children: [
			{ name: 'Потолочные споты', slug: 'potolochnye-spoty', description: 'Споты на штанге и накладные модели.' },
			{ name: 'Встраиваемые споты', slug: 'vstraivaemye-spoty', description: 'Точечные модели для натяжных потолков и ниш.' },
		],
	},
	{
		name: 'Настольные лампы',
		slug: 'nastolnye-lampy',
		description: 'Лампы с абажуром, офисные и декоративные модели для рабочего стола и спальни.',
		children: [
			{ name: 'Настольные лампы с абажуром', slug: 'lampy-s-abazhurom', description: 'Уютные и классические настольные лампы.' },
			{ name: 'Декоративные настольные лампы', slug: 'dekorativnye-nastolnye-lampy', description: 'Дизайнерские интерьерные модели для акцентного света.' },
		],
	},
	{
		name: 'Уличное освещение',
		slug: 'ulichnoe-osveshenie',
		description: 'Фасадные, ландшафтные и прожекторные светильники для улицы.',
		children: [
			{ name: 'Уличные настенные светильники', slug: 'ulichnye-nastennye-svetilniki', description: 'Фасадные и настенные уличные модели.' },
			{ name: 'Ландшафтные светильники', slug: 'landshaftnye-svetilniki', description: 'Садово-парковый свет для дорожек и газонов.' },
			{ name: 'Прожекторы', slug: 'prozhektory', description: 'Прожекторы и мощные световые приборы для наружной установки.' },
		],
	},
	{
		name: 'Торшеры',
		slug: 'torshery',
		description: 'Торшеры для зоны отдыха, чтения и декоративного освещения.',
		children: [
			{ name: 'Торшеры с 1 плафоном', slug: 'torshery-s-1-plafonom', description: 'Универсальные напольные модели для гостиной и спальни.' },
			{ name: 'Торшеры со столиком', slug: 'torshery-so-stolikom', description: 'Практичные модели со встроенной полкой или столиком.' },
		],
	},
	{
		name: 'Электротовары',
		slug: 'elektrotovary',
		description: 'Розетки, выключатели и диммеры для современного монтажа.',
		children: [
			{ name: 'Розетки', slug: 'rozetki', description: 'Обычные, заземлённые и USB-розетки.' },
			{ name: 'Выключатели', slug: 'vyklyuchateli', description: 'Одноклавишные, двухклавишные и проходные выключатели.' },
			{ name: 'Диммеры', slug: 'dimmery', description: 'Механические, сенсорные и smart-диммеры.' },
		],
	},
	{
		name: 'Предметы интерьера',
		slug: 'predmety-interera',
		description: 'Декоративные световые акценты и интерьерная подсветка.',
		children: [
			{ name: 'Декоративные светильники', slug: 'dekorativnye-svetilniki', description: 'Интерьерные декоративные светильники и арт-объекты.' },
			{ name: 'Подсветка для картин', slug: 'podsvetka-dlya-kartin', description: 'Подсветка для картин, постеров и стеновых панно.' },
		],
	},
	{
		name: 'Лампочки',
		slug: 'lampochki',
		description: 'Светодиодные, лампы накаливания и галогенные лампы с разными цоколями.',
		children: [
			{ name: 'Светодиодные лампы (LED)', slug: 'svetodiodnye-lampy-led', description: 'Экономичные LED-лампы для дома и бизнеса.' },
			{ name: 'Лампы накаливания', slug: 'lampy-nakalivaniya', description: 'Классические лампы для тёплого света и ретро-сценариев.' },
			{ name: 'Галогенные лампы', slug: 'galogennye-lampy', description: 'Компактные лампы для спотов и акцентного освещения.' },
		],
	},
]

export const PROPERTY_DEFINITIONS: SeedPropertyDefinition[] = [
	{ key: 'product_type', name: 'Тип товара', type: 'SELECT', options: ['Люстра', 'Светильник', 'Трековая система', 'Бра', 'Спот', 'Настольная лампа', 'Уличный светильник', 'Торшер', 'Электротовар', 'Предмет интерьера', 'Лампочка'] },
	{ key: 'series', name: 'Серия', type: 'STRING' },
	{ key: 'style', name: 'Стиль', type: 'SELECT', options: ['Классический', 'Современный', 'Минимализм', 'Лофт', 'Скандинавский', 'Ар-деко', 'Техно', 'Викторианский'] },
	{ key: 'color', name: 'Цвет', type: 'STRING' },
	{ key: 'material', name: 'Материал', type: 'STRING' },
	{ key: 'placement', name: 'Расположение', type: 'SELECT', options: ['Потолок', 'Подвес', 'Стена', 'Стол', 'Пол', 'Улица', 'Трек', 'Встраиваемый', 'Декор'] },
	{ key: 'purpose', name: 'Назначение', type: 'STRING' },
	{ key: 'mounting_type', name: 'Тип монтажа', type: 'SELECT', options: ['Накладной', 'Встраиваемый', 'Подвесной', 'На штанге', 'На стол', 'Напольный', 'Скрытый', 'На штыре'] },
	{ key: 'base_type', name: 'Цоколь', type: 'SELECT', options: ['E14', 'E27', 'GU10', 'GU5.3', 'GX53', 'G9', 'G4', 'LED', '24V'] },
	{ key: 'lamp_count', name: 'Количество ламп', type: 'NUMBER' },
	{ key: 'power_watts', name: 'Мощность, Вт', type: 'NUMBER' },
	{ key: 'total_power_watts', name: 'Общая мощность, Вт', type: 'NUMBER' },
	{ key: 'luminous_flux_lm', name: 'Световой поток, лм', type: 'NUMBER' },
	{ key: 'color_temperature', name: 'Цветовая температура', type: 'SELECT', options: ['2700K', '3000K', '3300K', '4000K', '4200K', '5500K'] },
	{ key: 'room_area_m2', name: 'Площадь освещения, м²', type: 'NUMBER' },
	{ key: 'ip_rating', name: 'Степень защиты', type: 'SELECT', options: ['IP20', 'IP44', 'IP54', 'IP65'] },
	{ key: 'dimmable', name: 'Диммирование', type: 'BOOLEAN' },
	{ key: 'smart_control', name: 'Умное управление', type: 'BOOLEAN' },
	{ key: 'power_source', name: 'Источник питания', type: 'SELECT', options: ['Сеть 220V', 'Солнечная батарея', 'Аккумулятор', '24V'] },
	{ key: 'grounding', name: 'Заземление', type: 'BOOLEAN' },
	{ key: 'usb_ports', name: 'USB-порты', type: 'NUMBER' },
	{ key: 'control_type', name: 'Тип управления', type: 'STRING' },
	{ key: 'lamp_type', name: 'Тип лампы', type: 'SELECT', options: ['LED', 'Накаливания', 'Галогенная'] },
	{ key: 'shape', name: 'Форма', type: 'SELECT', options: ['Груша', 'Шар', 'Свеча', 'Капсула', 'Рефлектор', 'Круг', 'Прямоугольник', 'Цилиндр'] },
	{ key: 'equivalent_power_watts', name: 'Эквивалент мощности, Вт', type: 'NUMBER' },
]

export const CONTENT_PAGES = [
	{
		title: 'О нас',
		slug: 'about',
		content: `# О магазине «Аура Света»

«Аура Света» — интернет-магазин света и интерьерных решений для дома, офиса и уличных пространств.

## Что есть в каталоге

- 11 основных категорий товаров
- 30 подкатегорий для удобной навигации
- Люстры, бра, споты, торшеры, настольные лампы
- Трековые системы, уличное освещение, лампочки и электротовары
- Декоративные светильники и подсветка для интерьера

## Почему выбирают нас

- Помогаем подобрать освещение под стиль и задачу
- Работаем с популярными европейскими и российскими брендами
- Поддерживаем удобный каталог с характеристиками и сравнением товаров
- Подготовили тестовый ассортимент для быстрой разработки и демонстрации проекта

## Контакты

📞 +375 (29) 123-45-67
📧 info@aurasveta.by
📍 г. Мозырь, ул. Интернациональная, 5`,
		metaTitle: 'О магазине Аура Света',
		metaDesc: 'Интернет-магазин света с каталогом люстр, светильников, бра, трековых систем и электротоваров.',
		isPublished: true,
	},
	{
		title: 'Доставка и оплата',
		slug: 'delivery',
		content: `# Доставка и оплата

## Доставка

### По Мозырю
- Бесплатно при заказе от 100 BYN
- При заказе до 100 BYN — 7 BYN
- Срок доставки: 1–2 рабочих дня

### По Беларуси
- Курьерская доставка — от 10 BYN
- Самовывоз — бесплатно
- Срок доставки: 2–5 рабочих дней

## Оплата

- Наличными при получении
- Банковской картой
- Через ЕРИП
- Безналичный расчёт для юрлиц

## Возврат

Товар можно вернуть в течение 14 дней при сохранении товарного вида и упаковки.`,
		metaTitle: 'Доставка и оплата — Аура Света',
		metaDesc: 'Информация о доставке, оплате и возврате товаров магазина Аура Света.',
		isPublished: true,
	},
	{
		title: 'Контакты',
		slug: 'contacts',
		content: `# Контакты

## Интернет-магазин «Аура Света»

📍 **Адрес:** г. Мозырь, ул. Интернациональная, 5
📞 **Телефон:** +375 (29) 123-45-67
📧 **Email:** info@aurasveta.by

### Режим работы
- Пн–Пт: 9:00–19:00
- Сб: 10:00–17:00
- Вс: выходной

### Реквизиты
ООО «Аура Света»
УНП 123456789`,
		metaTitle: 'Контакты — Аура Света',
		metaDesc: 'Контактная информация магазина Аура Света: адрес, телефон, email и режим работы.',
		isPublished: true,
	},
] as const

export const SEARCH_QUERIES = [
	'люстра в гостиную',
	'подвесная люстра maytoni',
	'встраиваемый светильник gu10',
	'трековый светильник черный',
	'бра для спальни',
	'подсветка для зеркала',
	'спот потолочный белый',
	'настольная лампа с абажуром',
	'торшер со столиком',
	'уличный фасадный светильник',
	'прожектор ip65',
	'розетка werkel',
	'выключатель двухклавишный',
	'диммер сенсорный',
	'декоративный светильник',
	'подсветка для картин',
	'светодиодная лампа e27',
	'галогенная лампа gu10',
	'хрустальная люстра',
	'уличное освещение для сада',
] as const

export function createCatalogProducts(): SeedProductDefinition[] {
	const lyustry = createLightingProducts({
		categoryCode: 'LUS',
		topCategoryName: 'Люстры',
		productTypeValue: 'Люстра',
		count: 50,
		brands: ['Citilux', 'Maytoni', 'Eglo', 'Lightstar', 'Arte Lamp', 'Odeon Light', 'ST Luce', 'Eurosvet', 'Freya', 'Crystal Lux', 'Loft IT', 'Escada', 'Favourite', 'Ambrella Light', 'Omnilux'],
		subcategories: [
			{ name: 'Потолочные люстры', slug: 'potolochnye-lyustry', productLabel: 'Потолочная люстра', placement: 'Потолок', purpose: 'Гостиная', mountingType: 'Накладной' },
			{ name: 'Подвесные люстры', slug: 'podvesnye-lyustry', productLabel: 'Подвесная люстра', placement: 'Подвес', purpose: 'Столовая', mountingType: 'Подвесной' },
			{ name: 'Каскадные люстры', slug: 'kaskadnye-lyustry', productLabel: 'Каскадная люстра', placement: 'Подвес', purpose: 'Холл', mountingType: 'Подвесной' },
			{ name: 'Хрустальные люстры', slug: 'khrustalnye-lyustry', productLabel: 'Хрустальная люстра', placement: 'Потолок', purpose: 'Гостиная', mountingType: 'Накладной' },
		],
		series: ['Портал', 'Адам Смарт', 'Palant', 'Флорида', 'Севилья', 'Идальго', 'Kaleidoscope', 'Ruby', 'Castle', 'Cone', 'Herbert', 'Ricerco', 'Netz', 'Topanga', 'Stenli', 'Francheska'],
		stylePool: ['Классический', 'Современный', 'Минимализм', 'Лофт', 'Ар-деко', 'Скандинавский'],
		materialPool: ['Металл', 'Стекло', 'Хрусталь', 'Текстиль', 'Латунь'],
		colorPool: ['Белый', 'Черный', 'Золото', 'Латунь', 'Хром', 'Дымчатый'],
		basePool: ['E14', 'E27', 'G9'],
		powerRange: [18, 96],
		lampCountRange: [3, 8],
		allowSmart: true,
		ledBias: true,
	})

	const svetilniki = createLightingProducts({
		categoryCode: 'SVT',
		topCategoryName: 'Светильники',
		productTypeValue: 'Светильник',
		count: 50,
		brands: ['Lightstar', 'Maytoni', 'Novotech', 'Denkirs', 'Citilux', 'Loft IT', 'Odeon Light', 'Arte Lamp', 'Freya', 'Eurosvet', 'Elektrostandard', 'Velante', 'Uniel'],
		subcategories: [
			{ name: 'Потолочные светильники', slug: 'potolochnye-svetilniki', productLabel: 'Потолочный светильник', placement: 'Потолок', purpose: 'Гостиная', mountingType: 'Накладной' },
			{ name: 'Встраиваемые светильники', slug: 'vstraivaemye-svetilniki', productLabel: 'Встраиваемый светильник', placement: 'Встраиваемый', purpose: 'Коридор', mountingType: 'Встраиваемый' },
			{ name: 'Точечные светильники', slug: 'tochechnye-svetilniki', productLabel: 'Точечный светильник', placement: 'Потолок', purpose: 'Кухня', mountingType: 'Накладной' },
			{ name: 'Накладные светильники', slug: 'nakladnye-svetilniki', productLabel: 'Накладной светильник', placement: 'Потолок', purpose: 'Коридор', mountingType: 'Накладной' },
		],
		series: ['Rullo', 'Globo', 'Stockton', 'Port', 'Phill', 'Atom', 'Zoom', 'Taо', 'Clizia', 'Artisan', 'Pentola', 'Storm', 'Skyline', 'Gerhard', 'Axel', 'Zoticus'],
		stylePool: ['Современный', 'Минимализм', 'Техно', 'Лофт', 'Скандинавский'],
		materialPool: ['Металл', 'Стекло', 'Акрил', 'Пластик', 'Алюминий'],
		colorPool: ['Белый', 'Черный', 'Серый', 'Латунь', 'Хром'],
		basePool: ['E27', 'GU10', 'GX53'],
		powerRange: [6, 48],
		lampCountRange: [1, 4],
		allowSmart: true,
		ledBias: true,
	})

	const trekovye = createLightingProducts({
		categoryCode: 'TRK',
		topCategoryName: 'Трековые системы',
		productTypeValue: 'Трековая система',
		count: 50,
		brands: ['ST Luce', 'Novotech', 'Maytoni', 'Denkirs', 'Citilux', 'Arte Lamp', 'Lightstar', 'Eglo', 'Elektrostandard'],
		subcategories: [
			{ name: 'Трековые светильники', slug: 'trekovye-svetilniki', productLabel: 'Трековый светильник', placement: 'Трек', purpose: 'Офис', mountingType: 'На штанге' },
			{ name: 'Магнитные трековые системы', slug: 'magnitnye-trekovye-sistemy', productLabel: 'Магнитная трековая система', placement: 'Трек', purpose: 'Гостиная', mountingType: 'На штанге' },
		],
		series: ['Skyline', 'Track', 'Focus', 'Pipe', 'Basis', 'Smart', 'Cami', 'Rullo', 'Trillo', 'Iter'],
		stylePool: ['Современный', 'Минимализм', 'Техно', 'Лофт'],
		materialPool: ['Металл', 'Алюминий', 'Акрил'],
		colorPool: ['Белый', 'Черный', 'Серый', 'Латунь'],
		basePool: ['GU10', 'LED'],
		powerRange: [8, 32],
		lampCountRange: [1, 3],
		allowSmart: true,
		ledBias: true,
	})

	const bra = createLightingProducts({
		categoryCode: 'BRA',
		topCategoryName: 'Бра',
		productTypeValue: 'Бра',
		count: 50,
		brands: ['Odeon Light', 'Maytoni', 'Citilux', 'Eurosvet', 'Crystal Lux', 'Eglo', 'Lightstar', 'Freya', 'Arte Lamp', 'Favourite', 'Loft IT', 'Kink Light'],
		subcategories: [
			{ name: 'Бра с 1 плафоном', slug: 'bra-s-1-plafonom', productLabel: 'Бра', placement: 'Стена', purpose: 'Спальня', mountingType: 'Накладной' },
			{ name: 'Бра с 2 плафонами', slug: 'bra-s-2-plafonami', productLabel: 'Бра', placement: 'Стена', purpose: 'Гостиная', mountingType: 'Накладной' },
			{ name: 'Подсветка для зеркал', slug: 'podsvetka-dlya-zerkal', productLabel: 'Подсветка для зеркал', placement: 'Стена', purpose: 'Ванная', mountingType: 'Накладной' },
		],
		series: ['Candy', 'Focus S', 'Dauphin', 'Adriana', 'Sevilya', 'Fino', 'Amado', 'Parma', 'Arcada', 'Scriptor', 'Emir', 'Niagara'],
		stylePool: ['Классический', 'Современный', 'Лофт', 'Ар-деко', 'Минимализм'],
		materialPool: ['Металл', 'Стекло', 'Хрусталь', 'Текстиль', 'Латунь'],
		colorPool: ['Белый', 'Черный', 'Бронза', 'Латунь', 'Хром', 'Дымчатый'],
		basePool: ['E14', 'E27', 'GU10'],
		powerRange: [6, 24],
		lampCountRange: [1, 2],
		allowSmart: false,
		ledBias: true,
	})

	const spoty = createLightingProducts({
		categoryCode: 'SPT',
		topCategoryName: 'Споты',
		productTypeValue: 'Спот',
		count: 50,
		brands: ['Elektrostandard', 'Arte Lamp', 'Reluce', 'Citilux', 'Maytoni', 'Novotech', 'Lightstar', 'Odeon Light', 'Favourite', 'Kink Light', 'Ambrella Light', 'Denkirs'],
		subcategories: [
			{ name: 'Потолочные споты', slug: 'potolochnye-spoty', productLabel: 'Спот', placement: 'Потолок', purpose: 'Кухня', mountingType: 'Накладной' },
			{ name: 'Встраиваемые споты', slug: 'vstraivaemye-spoty', productLabel: 'Встраиваемый спот', placement: 'Встраиваемый', purpose: 'Коридор', mountingType: 'Встраиваемый' },
		],
		series: ['DLR', 'Intercrus', 'Imai', 'Keila', 'Illumo', 'Gusto', 'Beam', 'Merida', 'Tribes', 'Tube', 'Over', 'Focus S'],
		stylePool: ['Современный', 'Минимализм', 'Техно', 'Лофт'],
		materialPool: ['Металл', 'Стекло', 'Акрил', 'Алюминий'],
		colorPool: ['Белый', 'Черный', 'Серый', 'Латунь'],
		basePool: ['GU10', 'GU5.3', 'GX53'],
		powerRange: [5, 20],
		lampCountRange: [1, 4],
		ledBias: true,
	})

	const nastolnye = createLightingProducts({
		categoryCode: 'TBL',
		topCategoryName: 'Настольные лампы',
		productTypeValue: 'Настольная лампа',
		count: 50,
		brands: ['Arte Lamp', 'Maytoni', 'Citilux', 'Eurosvet', 'Loft IT', 'Odeon Light', 'Elektrostandard', 'Freya', 'Lumion', 'Reluce', 'Rivoli', 'Velante'],
		subcategories: [
			{ name: 'Настольные лампы с абажуром', slug: 'lampy-s-abazhurom', productLabel: 'Настольная лампа', placement: 'Стол', purpose: 'Спальня', mountingType: 'На стол' },
			{ name: 'Декоративные настольные лампы', slug: 'dekorativnye-nastolnye-lampy', productLabel: 'Декоративная лампа', placement: 'Стол', purpose: 'Гостиная', mountingType: 'На стол' },
		],
		series: ['Junior', 'Fad', 'Idalgo', 'Adriana', 'Emir', 'Kair', 'Dauphin', 'Gaellori', 'Milena', 'Beira', 'Bubble', 'Future', 'Stacy', 'County', 'Magnolia'],
		stylePool: ['Классический', 'Современный', 'Скандинавский', 'Лофт', 'Минимализм'],
		materialPool: ['Металл', 'Текстиль', 'Стекло', 'Керамика', 'Дерево'],
		colorPool: ['Белый', 'Черный', 'Латунь', 'Бежевый', 'Зеленый'],
		basePool: ['E14', 'E27', 'LED'],
		powerRange: [5, 18],
		lampCountRange: [1, 2],
		allowBattery: true,
		ledBias: true,
	})

	const ulichnoe = createLightingProducts({
		categoryCode: 'OUT',
		topCategoryName: 'Уличное освещение',
		productTypeValue: 'Уличный светильник',
		count: 50,
		brands: ['Lightstar', 'Maytoni', 'Elektrostandard', 'Loft IT', 'Kink Light', 'Feron', 'Denkirs', 'Arte Lamp', 'Odeon Light', 'Eglo', 'Reluce', 'Favourite'],
		subcategories: [
			{ name: 'Уличные настенные светильники', slug: 'ulichnye-nastennye-svetilniki', productLabel: 'Уличный настенный светильник', placement: 'Улица', purpose: 'Фасад', mountingType: 'Накладной' },
			{ name: 'Ландшафтные светильники', slug: 'landshaftnye-svetilniki', productLabel: 'Ландшафтный светильник', placement: 'Улица', purpose: 'Сад', mountingType: 'На штыре' },
			{ name: 'Прожекторы', slug: 'prozhektory', productLabel: 'Прожектор', placement: 'Улица', purpose: 'Фасад', mountingType: 'Накладной' },
		],
		series: ['Lampione', 'Unter den Linden', 'Pegasus', 'Gravity', 'Ravenna', 'Techno', 'Dramen', 'Kepa', 'Golf', 'Tolero', 'Urbano', 'Wendy'],
		stylePool: ['Современный', 'Техно', 'Классический', 'Минимализм'],
		materialPool: ['Металл', 'Стекло', 'Акрил', 'Алюминий'],
		colorPool: ['Черный', 'Белый', 'Графит', 'Бронза'],
		basePool: ['E27', 'GU10', 'LED'],
		powerRange: [8, 50],
		lampCountRange: [1, 2],
		outdoor: true,
		allowSolar: true,
		ledBias: true,
	})

	const torshery = createLightingProducts({
		categoryCode: 'FLR',
		topCategoryName: 'Торшеры',
		productTypeValue: 'Торшер',
		count: 50,
		brands: ['Reluce', 'Citilux', 'Lumion', 'Maytoni', 'Arte Lamp', 'Lightstar', 'Odeon Light', 'Freya', 'Crystal Lux', 'Loft IT', 'Werkel', 'Escada'],
		subcategories: [
			{ name: 'Торшеры с 1 плафоном', slug: 'torshery-s-1-plafonom', productLabel: 'Торшер', placement: 'Пол', purpose: 'Гостиная', mountingType: 'Напольный' },
			{ name: 'Торшеры со столиком', slug: 'torshery-so-stolikom', productLabel: 'Торшер со столиком', placement: 'Пол', purpose: 'Зона отдыха', mountingType: 'Напольный' },
		],
		series: ['Arc', 'County', 'Moderni', 'Bubble', 'Candy', 'Dauphin', 'Magnolia', 'Stark', 'Castle', 'County', 'Jackie', 'Topanga'],
		stylePool: ['Современный', 'Классический', 'Скандинавский', 'Лофт', 'Минимализм'],
		materialPool: ['Металл', 'Текстиль', 'Дерево', 'Стекло', 'Керамика'],
		colorPool: ['Белый', 'Черный', 'Латунь', 'Бежевый', 'Хром'],
		basePool: ['E27', 'E14', 'LED'],
		powerRange: [8, 32],
		lampCountRange: [1, 3],
		allowBattery: false,
		ledBias: true,
	})

	const electro = createElectroProducts()
	const interier = createInteriorProducts()
	const lampochki = createBulbProducts()

	return [...lyustry, ...svetilniki, ...trekovye, ...bra, ...spoty, ...nastolnye, ...ulichnoe, ...torshery, ...electro, ...interier, ...lampochki]
}
