import type { Tag } from '@/types/catalog'

export const mockPopularTags: Record<string, Tag[]> = {
	lustry: [
		{ label: 'подвесные' },
		{ label: 'потолочные' },
		{ label: 'хрустальные' },
		{ label: 'LED-люстры' },
		{ label: 'для гостиной' },
		{ label: 'для кухни' },
	],
	svetilniki: [
		{ label: 'накладные' },
		{ label: 'встраиваемые' },
		{ label: 'линейные' },
		{ label: 'LED-панели' },
		{ label: 'для офиса' },
		{ label: 'с датчиком' },
	],
	bra: [
		{ label: 'настенные' },
		{ label: 'с выключателем' },
		{ label: 'с абажуром' },
		{ label: 'для спальни' },
		{ label: 'для зеркала' },
		{ label: 'LED-бра' },
	],
	spoty: [
		{ label: 'потолочные' },
		{ label: 'классические' },
		{ label: 'GU5.3' },
		{ label: 'GX53' },
		{ label: 'для натяжных потолков' },
		{ label: 'настенные' },
	],
	torshery: [
		{ label: 'с абажуром' },
		{ label: 'LED-торшеры' },
		{ label: 'для чтения' },
		{ label: 'декоративные' },
		{ label: 'на треноге' },
		{ label: 'с полкой' },
	],
	ulichnye: [
		{ label: 'фонари' },
		{ label: 'грунтовые' },
		{ label: 'фасадные' },
		{ label: 'IP65' },
		{ label: 'на солнечных батареях' },
		{ label: 'с датчиком движения' },
	],
	led: [
		{ label: 'RGB' },
		{ label: 'тёплая белая' },
		{ label: 'холодная белая' },
		{ label: 'COB-лента' },
		{ label: 'неоновая' },
		{ label: 'Wi-Fi / Smart' },
	],
}

export const mockCollectionTags: Tag[] = [
	{ label: 'Цвет' },
	{ label: 'Стиль' },
	{ label: 'Назначение' },
	{ label: 'Материал' },
	{ label: 'Страна' },
	{ label: 'Лампа/Цоколь/Абажур' },
	{ label: 'Форма' },
]

export const mockCategoryProductTags: Record<string, Tag[]> = {
	Люстры: [
		{ label: 'Люстры из стекла' },
		{ label: 'Современные люстры' },
		{ label: 'Люстры с пультом ДУ' },
		{ label: 'Люстры LED' },
		{ label: 'Люстры Maytoni' },
		{ label: 'Подвесные люстры Maytoni' },
	],
	Светильники: [
		{ label: 'Светильники встраиваемые' },
		{ label: 'Современные светильники' },
		{ label: 'LED-панели' },
		{ label: 'Даунлайты' },
		{ label: 'Светильники Feron' },
		{ label: 'Линейные светильники' },
	],
	Бра: [
		{ label: 'Бра с абажуром' },
		{ label: 'Бра для спальни' },
		{ label: 'Бра LED' },
		{ label: 'Бра с USB' },
		{ label: 'Бра для зеркал' },
		{ label: 'Бра Maytoni' },
	],
	Споты: [
		{ label: 'Споты из металла' },
		{ label: 'Современные споты' },
		{ label: 'Споты с одной лампой' },
		{ label: 'Споты стаканчики' },
		{ label: 'Споты Elektrostandard' },
		{ label: 'Встраиваемые споты Elektrostandard' },
	],
	Торшеры: [
		{ label: 'Торшеры с абажуром' },
		{ label: 'Торшеры LED' },
		{ label: 'Торшеры для чтения' },
		{ label: 'Торшеры на треноге' },
		{ label: 'Торшеры Maytoni' },
		{ label: 'Декоративные торшеры' },
	],
	'Уличные светильники': [
		{ label: 'Уличные фонари' },
		{ label: 'Фасадные светильники' },
		{ label: 'Грунтовые IP67' },
		{ label: 'Ландшафтные' },
		{ label: 'С датчиком движения' },
		{ label: 'На солнечных батареях' },
	],
	'Светодиодные ленты': [
		{ label: 'RGB-ленты' },
		{ label: 'COB-ленты' },
		{ label: 'Неоновые ленты' },
		{ label: 'Wi-Fi Smart ленты' },
		{ label: 'LED-профиль' },
		{ label: 'Ленты Arlight' },
	],
}

export const mockInterestTags: Tag[] = [
	{ label: 'бра в детскую' },
	{ label: 'бра под золото' },
	{ label: 'белая люстра' },
	{ label: 'торшеры со стеклянным плафоном' },
	{ label: 'бра на штанге' },
	{ label: 'ip54 светильник' },
]
