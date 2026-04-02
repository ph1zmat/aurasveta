import type { SpecItem, SpecGroup, CompareSpecSection } from '@/types/specs'

/** Default quick specs — fallback when product-specific ones are not defined */
const defaultQuickSpecs: SpecItem[] = [
	{ label: 'Высота, мм', value: '108', tooltip: true },
	{ label: 'Цоколь', value: 'LED', tooltip: true },
	{ label: 'Вид ламп', value: 'Светодиодная', tooltip: true },
	{ label: 'Мощность, W', value: '7', tooltip: true },
]

/** Default spec groups — fallback */
const defaultSpecGroups: SpecGroup[] = [
	{
		title: 'Электрика',
		rows: [
			{ label: 'Вид ламп', value: 'Светодиодная', tooltip: true },
			{ label: 'Цоколь', value: 'LED', tooltip: true },
			{ label: 'Количество ламп', value: '1' },
			{ label: 'Мощность лампы, W', value: '7', tooltip: true },
			{ label: 'Общая мощность, W', value: '7', tooltip: true },
			{ label: 'Напряжение', value: '230' },
			{ label: 'Угол рассеивания', value: '34' },
		],
	},
	{
		title: 'Внешний вид',
		rows: [
			{ label: 'Материал плафона/абажура', value: 'Металл' },
			{ label: 'Цвет плафона/абажура', value: 'Белый' },
			{ label: 'Материал арматуры', value: 'Металл', tooltip: true },
			{ label: 'Цвет арматуры', value: 'Белый' },
			{ label: 'Стиль', value: 'Современный', tooltip: true },
			{ label: 'Направление абажуров/плафонов', value: 'Поворотное' },
			{ label: 'Количество плафонов/абажуров', value: '1' },
			{ label: 'Форма плафона', value: 'Цилиндр' },
		],
	},
	{
		title: 'Размеры',
		rows: [
			{ label: 'Высота, мм', value: '108', tooltip: true },
			{ label: 'Диаметр, мм', value: '86', tooltip: true },
			{ label: 'Диаметр врезного отверстия, мм', value: '75' },
		],
	},
	{
		title: 'Дополнительные параметры',
		rows: [
			{
				label: 'Производитель',
				value: 'Elektrostandard',
				href: '/brands/elektrostandard',
			},
			{ label: 'Коллекция', value: 'Spot', href: '/collections/spot' },
			{ label: 'Место в интерьере', value: 'Для кухни', tooltip: true },
			{ label: 'Степень защиты (IP)', value: '20', tooltip: true },
			{ label: 'Для натяжных потолков', value: 'Да' },
			{ label: 'Цвет свечения', value: 'Нейтральный белый' },
			{ label: 'Для низких потолков', value: 'Да' },
			{ label: 'Умный дом', value: 'Да' },
		],
	},
]

/** Product id → quick specs (custom per product, falls back to defaults) */
export const mockQuickSpecs: Record<number, SpecItem[]> = {}

/** Product id → full spec groups (custom per product, falls back to defaults) */
export const mockSpecGroups: Record<number, SpecGroup[]> = {}

export function getQuickSpecsFor(productId: number): SpecItem[] {
	return mockQuickSpecs[productId] ?? defaultQuickSpecs
}

export function getSpecGroupsFor(productId: number): SpecGroup[] {
	return mockSpecGroups[productId] ?? defaultSpecGroups
}

/** Category slug → compare spec sections */
export const mockCompareSpecs: Record<string, CompareSpecSection[]> = {
	ulichnye: [
		{
			title: 'Размеры',
			rows: [
				{ label: 'Высота, мм', values: [130, 235, 335] },
				{ label: 'Диаметр, мм', values: [270, null, null] },
				{ label: 'Площадь освещения м²', values: [2, 6, null] },
				{ label: 'Ширина, мм', values: [150, 80, null] },
				{ label: 'Длина, мм', values: [200, 120, null] },
			],
		},
		{
			title: 'Электрика',
			rows: [
				{
					label: 'Вид ламп',
					values: ['Накаливания', 'Накаливания', 'Накаливания'],
				},
				{ label: 'Цоколь', values: ['E27', 'E14', 'E27'] },
				{ label: 'Количество ламп', values: [1, 1, 2] },
				{ label: 'Мощность лампы, W', values: [100, 40, 60] },
				{ label: 'Общая мощность, W', values: [100, 40, 120] },
				{ label: 'Напряжение', values: [230, 230, 240] },
			],
		},
		{
			title: 'Внешний вид',
			rows: [
				{
					label: 'Материал плафона/абажура',
					values: ['Стекло', 'Стекло', 'Пластик'],
				},
				{ label: 'Цвет плафона/абажура', values: ['Белый', 'Белый', 'Белый'] },
				{
					label: 'Материал арматуры',
					values: ['Алюминий', 'Металл', 'Алюминий'],
				},
				{ label: 'Цвет арматуры', values: ['Белый', 'Черный', 'Серый'] },
				{ label: 'Стиль', values: ['Замковый', 'Современный', 'Современный'] },
				{
					label: 'Направление абажуров/плафонов',
					values: ['Вниз', 'В стороны', 'Вверх'],
				},
				{ label: 'Количество плафонов/абажуров', values: [1, 1, 2] },
				{ label: 'Виды материалов', values: ['Стеклянные', null, null] },
				{ label: 'Форма плафона', values: ['Декоративный', 'Шар', 'Цилиндр'] },
				{ label: 'Цвет', values: ['Белый', null, null] },
			],
		},
		{
			title: 'Дополнительные параметры',
			rows: [
				{ label: 'Степень защиты (IP)', values: [65, 54, 44] },
				{ label: 'Коллекция', values: ['Pegasus', 'Gravity', '534'] },
				{
					label: 'Расположение',
					values: ['На потолок', 'На стену', 'На стену'],
				},
			],
		},
	],
}

export function getCompareSpecsFor(categorySlug: string): CompareSpecSection[] {
	return mockCompareSpecs[categorySlug] ?? mockCompareSpecs['ulichnye'] ?? []
}

/** Category slug → SEO HTML */
export const mockSeoContent: Record<string, string> = {
	lustry: `<p>⭐ Люстры с бесплатной доставкой в Москве. В нашем интернет-магазине можно выгодно купить люстры популярных производителей с удобной доставкой или самовывозом.</p><ul><li>⭐ Более 5000 люстр в наличии;</li></ul><p><strong>Наш каталог предлагает широкий выбор моделей</strong> — от классических хрустальных люстр до современных LED-светильников.</p>`,
	svetilniki: `<p>⭐ Светильники с бесплатной доставкой. Большой выбор накладных, встраиваемых и линейных моделей.</p><ul><li>⭐ 8000+ светильников в наличии;</li></ul><p><strong>Качественные светильники</strong> от ведущих мировых и российских производителей по доступным ценам.</p>`,
	bra: `<p>⭐ Настенные бра с бесплатной доставкой. Стильные модели с абажуром, с выключателем, для зеркал и подсветки картин.</p><ul><li>⭐ 3000+ бра в наличии;</li></ul><p><strong>Бра для любого интерьера</strong> — от классических до современных, с LED-модулями и USB-зарядкой.</p>`,
	spoty: `<p>⭐ Споты с бесплатной доставкой в Москве. В нашем интернет-магазине можно выгодно купить споты популярных производителей с удобной доставкой или самовывозом. На ассортимент действуют скидки, а также беспроцентная рассрочка.</p><ul><li>⭐ 12001 спотов в наличии в интернет-магазине;</li></ul><p><strong>Наш каталог предлагает широкий выбор моделей</strong> для стильных и современных решений по цене от 99 руб. Ассортимент включает недорогие и популярные светильники от известных производителей, идеально подходящие для натяжных потолков.</p>`,
	torshery: `<p>⭐ Торшеры с бесплатной доставкой. Большой выбор напольных светильников — от классических до современных LED-моделей.</p><ul><li>⭐ 1500+ торшеров в наличии;</li></ul><p><strong>Торшеры для гостиной, спальни и кабинета</strong> от Maytoni, Citilux, Odeon Light и других брендов.</p>`,
	ulichnye: `<p>⭐ Уличные светильники с бесплатной доставкой. Фонари, фасадные, грунтовые и ландшафтные модели с защитой IP65+.</p><ul><li>⭐ 4000+ уличных светильников в наличии;</li></ul><p><strong>Надёжные уличные светильники</strong> из алюминия и нержавеющей стали для освещения участков, фасадов и парковых зон.</p>`,
	led: `<p>⭐ Светодиодные ленты с бесплатной доставкой. RGB, белые, COB и неоновые ленты для любых задач подсветки.</p><ul><li>⭐ 2000+ позиций LED-лент в наличии;</li></ul><p><strong>Профессиональные и бытовые LED-ленты</strong> от Arlight, Feron и других производителей.</p>`,
}

export function getSeoContentFor(categorySlug: string): string {
	return mockSeoContent[categorySlug] ?? ''
}
