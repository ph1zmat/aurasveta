import type { Category, CategoryTreeItem, Subcategory } from '@/types/catalog'

export const mockCategories: Category[] = [
	{
		id: 'lustry',
		slug: 'lustry',
		name: 'Люстры',
		href: '/catalog/lustry',
		image: '/images/categories/lustry.svg',
		subcategories: [
			{ name: 'Подвесные', href: '/catalog/lustry/podvesnye' },
			{ name: 'Потолочные', href: '/catalog/lustry/potolochnye' },
			{ name: 'Хрустальные', href: '/catalog/lustry/hrustalnye' },
			{ name: 'Классические', href: '/catalog/lustry/klassicheskie' },
		],
	},
	{
		id: 'svetilniki',
		slug: 'svetilniki',
		name: 'Светильники',
		href: '/catalog/svetilniki',
		image: '/images/categories/svetilniki.svg',
		subcategories: [
			{ name: 'Накладные', href: '/catalog/svetilniki/nakladnye' },
			{ name: 'Встраиваемые', href: '/catalog/svetilniki/vstraivaemye' },
			{ name: 'Линейные', href: '/catalog/svetilniki/linejnye' },
		],
	},
	{
		id: 'bra',
		slug: 'bra',
		name: 'Бра',
		href: '/catalog/bra',
		image: '/images/categories/bra.svg',
		subcategories: [
			{ name: 'Настенные', href: '/catalog/bra/nastennye' },
			{ name: 'С выключателем', href: '/catalog/bra/s-vyklyuchatelem' },
		],
	},
	{
		id: 'spoty',
		slug: 'spoty',
		name: 'Споты',
		href: '/catalog/spoty',
		image: '/images/categories/spoty.svg',
		subcategories: [
			{ name: 'Трековые', href: '/catalog/spoty/trekovye' },
			{ name: 'На штанге', href: '/catalog/spoty/na-shtange' },
		],
	},
	{
		id: 'torshery',
		slug: 'torshery',
		name: 'Торшеры',
		href: '/catalog/torshery',
		image: '/images/categories/torsher.svg',
	},
	{
		id: 'nastolnye',
		slug: 'nastolnye',
		name: 'Настольные лампы',
		href: '/catalog/nastolnye',
		image: '/images/categories/nastolnye.svg',
	},
	{
		id: 'ulichnye',
		slug: 'ulichnye',
		name: 'Уличные светильники',
		href: '/catalog/ulichnye',
		image: '/images/categories/ulichnye.svg',
		subcategories: [
			{ name: 'Фонари', href: '/catalog/ulichnye/fonari' },
			{ name: 'Грунтовые', href: '/catalog/ulichnye/gruntovye' },
			{ name: 'Фасадные', href: '/catalog/ulichnye/fasadnye' },
			{ name: 'Ландшафтные', href: '/catalog/ulichnye/landshaftnye' },
		],
	},
	{
		id: 'led',
		slug: 'led',
		name: 'Светодиодные ленты',
		href: '/catalog/led',
		image: '/images/categories/led.svg',
	},
]

/** Slug → название категории в mockProducts */
export const categorySlugToName: Record<string, string> = {
	lustry: 'Люстры',
	svetilniki: 'Светильники',
	bra: 'Бра',
	spoty: 'Споты',
	torshery: 'Торшеры',
	nastolnye: 'Настольные лампы',
	ulichnye: 'Уличные светильники',
	led: 'Светодиодные ленты',
}

export const mockCategoryTrees: Record<string, CategoryTreeItem[]> = {
	lustry: [
		{
			name: 'Люстры',
			href: '/catalog/lustry',
			children: [
				{ name: 'Подвесные люстры', href: '/catalog/lustry/podvesnye' },
				{ name: 'Потолочные люстры', href: '/catalog/lustry/potolochnye' },
				{ name: 'Хрустальные люстры', href: '/catalog/lustry/hrustalnye' },
				{ name: 'Классические люстры', href: '/catalog/lustry/klassicheskie' },
				{ name: 'Светодиодные люстры', href: '/catalog/lustry/led' },
			],
		},
	],
	svetilniki: [
		{
			name: 'Светильники',
			href: '/catalog/svetilniki',
			children: [
				{
					name: 'Накладные светильники',
					href: '/catalog/svetilniki/nakladnye',
				},
				{
					name: 'Встраиваемые светильники',
					href: '/catalog/svetilniki/vstraivaemye',
				},
				{ name: 'Линейные светильники', href: '/catalog/svetilniki/linejnye' },
				{
					name: 'Подвесные светильники',
					href: '/catalog/svetilniki/podvesnye',
				},
			],
		},
	],
	bra: [
		{
			name: 'Бра',
			href: '/catalog/bra',
			children: [
				{ name: 'Настенные бра', href: '/catalog/bra/nastennye' },
				{ name: 'Бра с выключателем', href: '/catalog/bra/s-vyklyuchatelem' },
				{ name: 'Бра с абажуром', href: '/catalog/bra/s-abazhurom' },
				{ name: 'Бра для зеркал', href: '/catalog/bra/dlya-zerkal' },
			],
		},
	],
	spoty: [
		{
			name: 'Споты',
			href: '/catalog/spoty',
			children: [
				{ name: 'Встраиваемые споты', href: '/catalog/spoty/vstraivaemye' },
				{ name: 'Накладные споты', href: '/catalog/spoty/nakladnye' },
				{ name: 'С 1 плафоном', href: '/catalog/spoty/s-1-plafonom' },
				{ name: 'С 2 плафонами', href: '/catalog/spoty/s-2-plafonami' },
				{ name: 'С 3 и более плафонами', href: '/catalog/spoty/s-3-plafonami' },
			],
		},
	],
	torshery: [
		{
			name: 'Торшеры',
			href: '/catalog/torshery',
			children: [
				{ name: 'С абажуром', href: '/catalog/torshery/s-abazhurom' },
				{ name: 'Светодиодные', href: '/catalog/torshery/led' },
				{ name: 'Для чтения', href: '/catalog/torshery/dlya-chteniya' },
				{ name: 'Декоративные', href: '/catalog/torshery/dekorativnye' },
			],
		},
	],
	ulichnye: [
		{
			name: 'Уличные светильники',
			href: '/catalog/ulichnye',
			children: [
				{ name: 'Фонари', href: '/catalog/ulichnye/fonari' },
				{ name: 'Грунтовые', href: '/catalog/ulichnye/gruntovye' },
				{ name: 'Фасадные', href: '/catalog/ulichnye/fasadnye' },
				{ name: 'Ландшафтные', href: '/catalog/ulichnye/landshaftnye' },
				{ name: 'На солнечных батареях', href: '/catalog/ulichnye/solnechnye' },
			],
		},
	],
	led: [
		{
			name: 'Светодиодные ленты',
			href: '/catalog/led',
			children: [
				{ name: 'RGB-ленты', href: '/catalog/led/rgb' },
				{ name: 'Белые ленты', href: '/catalog/led/belye' },
				{ name: 'Неоновые ленты', href: '/catalog/led/neon' },
				{ name: 'COB-ленты', href: '/catalog/led/cob' },
				{ name: 'Умные ленты', href: '/catalog/led/smart' },
			],
		},
	],
}

export const mockSubcategories: Record<string, Subcategory[]> = {
	lustry: [
		{
			name: 'Подвесные люстры',
			href: '/catalog/lustry/podvesnye',
			image: '/chandelier.svg',
		},
		{
			name: 'Потолочные люстры',
			href: '/catalog/lustry/potolochnye',
			image: '/lamp.svg',
		},
		{
			name: 'Хрустальные люстры',
			href: '/catalog/lustry/hrustalnye',
			image: '/dekor.svg',
		},
		{
			name: 'Классические люстры',
			href: '/catalog/lustry/klassicheskie',
			image: '/chandelier.svg',
		},
		{
			name: 'LED-люстры',
			href: '/catalog/lustry/led',
			image: '/bulb.svg',
		},
	],
	svetilniki: [
		{
			name: 'Накладные',
			href: '/catalog/svetilniki/nakladnye',
			image: '/lamp.svg',
		},
		{
			name: 'Встраиваемые',
			href: '/catalog/svetilniki/vstraivaemye',
			image: '/spot.svg',
		},
		{
			name: 'Линейные',
			href: '/catalog/svetilniki/linejnye',
			image: '/trek.svg',
		},
		{
			name: 'Подвесные',
			href: '/catalog/svetilniki/podvesnye',
			image: '/chandelier.svg',
		},
	],
	bra: [
		{
			name: 'Настенные',
			href: '/catalog/bra/nastennye',
			image: '/bra.svg',
		},
		{
			name: 'С выключателем',
			href: '/catalog/bra/s-vyklyuchatelem',
			image: '/socket.svg',
		},
		{
			name: 'С абажуром',
			href: '/catalog/bra/s-abazhurom',
			image: '/lamp.svg',
		},
		{
			name: 'Для зеркал',
			href: '/catalog/bra/dlya-zerkal',
			image: '/bulb.svg',
		},
	],
	spoty: [
		{
			name: 'Встраиваемые споты',
			href: '/catalog/spoty/vstraivaemye',
			image: '/spot.svg',
		},
		{
			name: 'Накладные споты',
			href: '/catalog/spoty/nakladnye',
			image: '/lamp.svg',
		},
		{
			name: 'С 1 плафоном',
			href: '/catalog/spoty/s-1-plafonom',
			image: '/bulb.svg',
		},
		{
			name: 'С 2 плафонами',
			href: '/catalog/spoty/s-2-plafonami',
			image: '/spot.svg',
		},
		{
			name: 'С 3 и более плафонами',
			href: '/catalog/spoty/s-3-plafonami',
			image: '/chandelier.svg',
		},
		{
			name: 'Точечные светильники',
			href: '/catalog/spoty/tochechnye',
			image: '/spot.svg',
		},
		{
			name: 'Трековые светильники',
			href: '/catalog/spoty/trekovye',
			image: '/trek.svg',
		},
	],
	torshery: [
		{
			name: 'С абажуром',
			href: '/catalog/torshery/s-abazhurom',
			image: '/floorlamp.svg',
		},
		{
			name: 'Светодиодные',
			href: '/catalog/torshery/led',
			image: '/bulb.svg',
		},
		{
			name: 'Для чтения',
			href: '/catalog/torshery/dlya-chteniya',
			image: '/desctoplamp.svg',
		},
		{
			name: 'Декоративные',
			href: '/catalog/torshery/dekorativnye',
			image: '/dekor.svg',
		},
	],
	ulichnye: [
		{
			name: 'Фонари',
			href: '/catalog/ulichnye/fonari',
			image: '/streetlamp.svg',
		},
		{
			name: 'Грунтовые',
			href: '/catalog/ulichnye/gruntovye',
			image: '/lamp.svg',
		},
		{
			name: 'Фасадные',
			href: '/catalog/ulichnye/fasadnye',
			image: '/bra.svg',
		},
		{
			name: 'Ландшафтные',
			href: '/catalog/ulichnye/landshaftnye',
			image: '/streetlamp.svg',
		},
		{
			name: 'На солнечных батареях',
			href: '/catalog/ulichnye/solnechnye',
			image: '/bulb.svg',
		},
	],
	led: [
		{
			name: 'RGB-ленты',
			href: '/catalog/led/rgb',
			image: '/bulb.svg',
		},
		{
			name: 'Белые ленты',
			href: '/catalog/led/belye',
			image: '/lamp.svg',
		},
		{
			name: 'Неоновые ленты',
			href: '/catalog/led/neon',
			image: '/dekor.svg',
		},
		{
			name: 'COB-ленты',
			href: '/catalog/led/cob',
			image: '/socket.svg',
		},
		{
			name: 'Умные ленты',
			href: '/catalog/led/smart',
			image: '/spanner.svg',
		},
	],
}
