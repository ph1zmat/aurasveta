/**
 * Данные для мега-меню каталога (CatalogDropdown).
 *
 * Каждая корневая категория содержит группы подкатегорий
 * (по типу, стилю, месту, особенностям и т.д.)
 */

export interface CatalogMenuLink {
	name: string
	href: string
}

export interface CatalogMenuGroup {
	title: string
	links: CatalogMenuLink[]
}

export interface CatalogMenuBanner {
	image: string
	alt: string
	href: string
}

export interface CatalogMenuItem {
	id: string
	name: string
	href: string
	groups: CatalogMenuGroup[]
	banners?: CatalogMenuBanner[]
}

export const catalogMenuItems: CatalogMenuItem[] = [
	{
		id: 'lustry',
		name: 'Люстры',
		href: '/catalog/lustry',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все люстры', href: '/catalog/lustry' },
					{ name: 'Потолочные люстры', href: '/catalog/lustry/potolochnye' },
					{ name: 'Подвесные люстры', href: '/catalog/lustry/podvesnye' },
					{ name: 'Каскадные люстры', href: '/catalog/lustry/kaskadnye' },
					{
						name: 'Люстры-вентиляторы',
						href: '/catalog/lustry/ventilyatory',
					},
					{ name: 'Большие люстры', href: '/catalog/lustry/bolshie' },
					{
						name: 'Хрустальные люстры',
						href: '/catalog/lustry/hrustalnye',
					},
					{ name: 'Люстры на штанге', href: '/catalog/lustry/na-shtange' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{ name: 'Арт-Деко', href: '/catalog/lustry?style=art-deco' },
					{ name: 'Восточный', href: '/catalog/lustry?style=vostochnyj' },
					{
						name: 'Дизайнерские',
						href: '/catalog/lustry?style=dizajnerskie',
					},
					{ name: 'Кантри', href: '/catalog/lustry?style=kantri' },
					{
						name: 'Классический',
						href: '/catalog/lustry?style=klassicheskij',
					},
					{ name: 'Лофт', href: '/catalog/lustry?style=loft' },
					{ name: 'Модерн', href: '/catalog/lustry?style=modern' },
					{ name: 'Минимализм', href: '/catalog/lustry?style=minimalizm' },
					{ name: 'Прованс', href: '/catalog/lustry?style=provans' },
					{ name: 'Ретро', href: '/catalog/lustry?style=retro' },
					{
						name: 'Скандинавский',
						href: '/catalog/lustry?style=skandinavskij',
					},
					{ name: 'Современный', href: '/catalog/lustry?style=sovremennyj' },
					{ name: 'Флористика', href: '/catalog/lustry?style=floristika' },
					{ name: 'Хай-тек', href: '/catalog/lustry?style=hi-tech' },
				],
			},
			{
				title: 'По месту',
				links: [
					{ name: 'В прихожую', href: '/catalog/lustry?room=prihozhaya' },
					{ name: 'В детскую', href: '/catalog/lustry?room=detskaya' },
					{ name: 'На кухню', href: '/catalog/lustry?room=kuhnya' },
					{ name: 'В ванную', href: '/catalog/lustry?room=vannaya' },
					{ name: 'В офис', href: '/catalog/lustry?room=ofis' },
					{ name: 'В гостиную', href: '/catalog/lustry?room=gostinaya' },
					{ name: 'В спальню', href: '/catalog/lustry?room=spalnya' },
				],
			},
			{
				title: 'Особенности',
				links: [
					{
						name: 'Для натяжных потолков',
						href: '/catalog/lustry?feature=natyazhnye',
					},
					{
						name: 'Светодиодные',
						href: '/catalog/lustry?feature=led',
					},
					{ name: 'С диммером', href: '/catalog/lustry?feature=dimmer' },
					{ name: 'С пультом', href: '/catalog/lustry?feature=pult' },
					{ name: 'Умные', href: '/catalog/lustry?feature=smart' },
				],
			},
		],
	},
	{
		id: 'svetilniki',
		name: 'Светильники',
		href: '/catalog/svetilniki',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все светильники', href: '/catalog/svetilniki' },
					{
						name: 'Накладные',
						href: '/catalog/svetilniki/nakladnye',
					},
					{
						name: 'Встраиваемые',
						href: '/catalog/svetilniki/vstraivaemye',
					},
					{ name: 'Линейные', href: '/catalog/svetilniki/linejnye' },
					{ name: 'Подвесные', href: '/catalog/svetilniki/podvesnye' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{
						name: 'Классический',
						href: '/catalog/svetilniki?style=klassicheskij',
					},
					{ name: 'Лофт', href: '/catalog/svetilniki?style=loft' },
					{ name: 'Модерн', href: '/catalog/svetilniki?style=modern' },
					{
						name: 'Минимализм',
						href: '/catalog/svetilniki?style=minimalizm',
					},
					{ name: 'Хай-тек', href: '/catalog/svetilniki?style=hi-tech' },
				],
			},
			{
				title: 'По месту',
				links: [
					{ name: 'На кухню', href: '/catalog/svetilniki?room=kuhnya' },
					{ name: 'В ванную', href: '/catalog/svetilniki?room=vannaya' },
					{ name: 'В офис', href: '/catalog/svetilniki?room=ofis' },
					{ name: 'В гостиную', href: '/catalog/svetilniki?room=gostinaya' },
				],
			},
			{
				title: 'Особенности',
				links: [
					{ name: 'Светодиодные', href: '/catalog/svetilniki?feature=led' },
					{
						name: 'С датчиком движения',
						href: '/catalog/svetilniki?feature=sensor',
					},
					{
						name: 'Влагозащищённые',
						href: '/catalog/svetilniki?feature=ip44',
					},
				],
			},
		],
	},
	{
		id: 'treki',
		name: 'Треки',
		href: '/catalog/treki',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все треки', href: '/catalog/treki' },
					{ name: 'Трековые светильники', href: '/catalog/treki/svetilniki' },
					{ name: 'Шинопроводы', href: '/catalog/treki/shinoprovody' },
					{ name: 'Комплектующие', href: '/catalog/treki/komplektuyushie' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{ name: 'Лофт', href: '/catalog/treki?style=loft' },
					{ name: 'Минимализм', href: '/catalog/treki?style=minimalizm' },
					{ name: 'Хай-тек', href: '/catalog/treki?style=hi-tech' },
				],
			},
		],
	},
	{
		id: 'bra',
		name: 'Бра',
		href: '/catalog/bra',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все бра', href: '/catalog/bra' },
					{ name: 'Настенные', href: '/catalog/bra/nastennye' },
					{
						name: 'С выключателем',
						href: '/catalog/bra/s-vyklyuchatelem',
					},
					{ name: 'С абажуром', href: '/catalog/bra/s-abazhurom' },
					{ name: 'Для зеркал', href: '/catalog/bra/dlya-zerkal' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{ name: 'Классический', href: '/catalog/bra?style=klassicheskij' },
					{ name: 'Лофт', href: '/catalog/bra?style=loft' },
					{ name: 'Модерн', href: '/catalog/bra?style=modern' },
					{ name: 'Прованс', href: '/catalog/bra?style=provans' },
				],
			},
			{
				title: 'По месту',
				links: [
					{ name: 'В спальню', href: '/catalog/bra?room=spalnya' },
					{ name: 'В прихожую', href: '/catalog/bra?room=prihozhaya' },
					{ name: 'В детскую', href: '/catalog/bra?room=detskaya' },
				],
			},
		],
	},
	{
		id: 'spoty',
		name: 'Споты',
		href: '/catalog/spoty',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все споты', href: '/catalog/spoty' },
					{ name: 'Накладные споты', href: '/catalog/spoty/nakladnye' },
					{ name: 'Встраиваемые споты', href: '/catalog/spoty/vstraivaemye' },
					{ name: 'Карданные', href: '/catalog/spoty/kardannye' },
					{ name: 'Настенные', href: '/catalog/spoty/nastennye' },
					{ name: 'Потолочные', href: '/catalog/spoty/potolochnye' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{ name: 'Арт-Деко', href: '/catalog/spoty?style=art-deco' },
					{ name: 'Восточный', href: '/catalog/spoty?style=vostochnyj' },
					{ name: 'Кантри', href: '/catalog/spoty?style=kantri' },
					{ name: 'Классический', href: '/catalog/spoty?style=klassicheskij' },
					{ name: 'Лофт', href: '/catalog/spoty?style=loft' },
					{ name: 'Минимализм', href: '/catalog/spoty?style=minimalizm' },
					{ name: 'Модерн', href: '/catalog/spoty?style=modern' },
					{ name: 'Прованс', href: '/catalog/spoty?style=provans' },
					{ name: 'Ретро', href: '/catalog/spoty?style=retro' },
					{ name: 'Современный', href: '/catalog/spoty?style=sovremennyj' },
					{ name: 'Тиффани', href: '/catalog/spoty?style=tiffani' },
					{ name: 'Хай-тек', href: '/catalog/spoty?style=hi-tech' },
				],
			},
			{
				title: 'По месту',
				links: [
					{ name: 'Для магазина', href: '/catalog/spoty?room=magazin' },
					{ name: 'В прихожую', href: '/catalog/spoty?room=prihozhaya' },
					{ name: 'В детскую', href: '/catalog/spoty?room=detskaya' },
					{ name: 'На кухню', href: '/catalog/spoty?room=kuhnya' },
					{ name: 'В ванную', href: '/catalog/spoty?room=vannaya' },
					{ name: 'В гостиную', href: '/catalog/spoty?room=gostinaya' },
					{ name: 'В спальню', href: '/catalog/spoty?room=spalnya' },
					{ name: 'Офис', href: '/catalog/spoty?room=ofis' },
				],
			},
			{
				title: 'Особенности',
				links: [
					{ name: 'Для натяжных потолков', href: '/catalog/spoty?feature=natyazhnye' },
					{ name: 'Споты с 1 плафоном', href: '/catalog/spoty/s-1-plafonom' },
					{ name: 'Споты с 2 плафонами', href: '/catalog/spoty/s-2-plafonami' },
					{ name: 'Споты с 3 и более плафонами', href: '/catalog/spoty/s-3-plafonami' },
					{ name: 'Светодиодные', href: '/catalog/spoty?feature=led' },
				],
			},
		],
		banners: [
			{
				image: '/images/banners/spoty-myfar.jpg',
				alt: 'Лаконичные споты MYFAR',
				href: '/catalog/spoty?brand=myfar',
			},
			{
				image: '/images/banners/spoty-kitchen.jpg',
				alt: 'Споты для кухни',
				href: '/catalog/spoty?room=kuhnya',
			},
		],
	},
	{
		id: 'nastolnye',
		name: 'Настольные',
		href: '/catalog/nastolnye',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все настольные', href: '/catalog/nastolnye' },
					{ name: 'С абажуром', href: '/catalog/nastolnye/s-abazhurom' },
					{ name: 'Для чтения', href: '/catalog/nastolnye/dlya-chteniya' },
					{
						name: 'Декоративные',
						href: '/catalog/nastolnye/dekorativnye',
					},
				],
			},
			{
				title: 'По стилю',
				links: [
					{
						name: 'Классический',
						href: '/catalog/nastolnye?style=klassicheskij',
					},
					{ name: 'Модерн', href: '/catalog/nastolnye?style=modern' },
					{
						name: 'Минимализм',
						href: '/catalog/nastolnye?style=minimalizm',
					},
				],
			},
		],
	},
	{
		id: 'ulichnye',
		name: 'Уличные',
		href: '/catalog/ulichnye',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все уличные', href: '/catalog/ulichnye' },
					{ name: 'Фонари', href: '/catalog/ulichnye/fonari' },
					{ name: 'Грунтовые', href: '/catalog/ulichnye/gruntovye' },
					{ name: 'Фасадные', href: '/catalog/ulichnye/fasadnye' },
					{ name: 'Ландшафтные', href: '/catalog/ulichnye/landshaftnye' },
				],
			},
			{
				title: 'Особенности',
				links: [
					{
						name: 'На солнечных батареях',
						href: '/catalog/ulichnye?feature=solar',
					},
					{
						name: 'С датчиком движения',
						href: '/catalog/ulichnye?feature=sensor',
					},
					{
						name: 'Влагозащищённые',
						href: '/catalog/ulichnye?feature=ip65',
					},
				],
			},
		],
	},
	{
		id: 'torshery',
		name: 'Торшеры',
		href: '/catalog/torshery',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все торшеры', href: '/catalog/torshery' },
					{ name: 'С абажуром', href: '/catalog/torshery/s-abazhurom' },
					{ name: 'Светодиодные', href: '/catalog/torshery/led' },
					{ name: 'Для чтения', href: '/catalog/torshery/dlya-chteniya' },
					{ name: 'Декоративные', href: '/catalog/torshery/dekorativnye' },
				],
			},
			{
				title: 'По стилю',
				links: [
					{
						name: 'Классический',
						href: '/catalog/torshery?style=klassicheskij',
					},
					{ name: 'Лофт', href: '/catalog/torshery?style=loft' },
					{ name: 'Модерн', href: '/catalog/torshery?style=modern' },
				],
			},
		],
	},
	{
		id: 'elektrotovary',
		name: 'Электротовары',
		href: '/catalog/elektrotovary',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все электротовары', href: '/catalog/elektrotovary' },
					{
						name: 'Выключатели',
						href: '/catalog/elektrotovary/vyklyuchateli',
					},
					{ name: 'Розетки', href: '/catalog/elektrotovary/rozetki' },
					{
						name: 'Диммеры',
						href: '/catalog/elektrotovary/dimmery',
					},
					{
						name: 'Трансформаторы',
						href: '/catalog/elektrotovary/transformatory',
					},
				],
			},
		],
	},
	{
		id: 'dekor',
		name: 'Декор',
		href: '/catalog/dekor',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Весь декор', href: '/catalog/dekor' },
					{ name: 'Свечи', href: '/catalog/dekor/svechi' },
					{ name: 'Вазы', href: '/catalog/dekor/vazy' },
					{ name: 'Зеркала', href: '/catalog/dekor/zerkala' },
				],
			},
		],
	},
	{
		id: 'lampochki',
		name: 'Лампочки',
		href: '/catalog/lampochki',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Все лампочки', href: '/catalog/lampochki' },
					{ name: 'Светодиодные', href: '/catalog/lampochki/led' },
					{ name: 'Филаментные', href: '/catalog/lampochki/filamentnye' },
					{ name: 'Галогенные', href: '/catalog/lampochki/galogennye' },
					{
						name: 'Энергосберегающие',
						href: '/catalog/lampochki/energosberegayushie',
					},
				],
			},
			{
				title: 'По цоколю',
				links: [
					{ name: 'E27', href: '/catalog/lampochki?base=e27' },
					{ name: 'E14', href: '/catalog/lampochki?base=e14' },
					{ name: 'GU10', href: '/catalog/lampochki?base=gu10' },
					{ name: 'G9', href: '/catalog/lampochki?base=g9' },
					{ name: 'GX53', href: '/catalog/lampochki?base=gx53' },
				],
			},
		],
	},
	{
		id: 'utsenka',
		name: 'Уценка',
		href: '/catalog/utsenka',
		groups: [
			{
				title: 'По типу',
				links: [
					{ name: 'Вся уценка', href: '/catalog/utsenka' },
					{ name: 'Люстры', href: '/catalog/utsenka/lustry' },
					{ name: 'Светильники', href: '/catalog/utsenka/svetilniki' },
					{ name: 'Бра', href: '/catalog/utsenka/bra' },
				],
			},
		],
	},
]
