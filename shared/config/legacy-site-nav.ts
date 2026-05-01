export type LegacyNavLink = {
	label: string
	href: string
}

export const LEGACY_HEADER_SERVICE_LINKS: LegacyNavLink[] = [
	{ label: 'Сборка и установка', href: '/assembly' },
	{ label: 'Контакты', href: '/contacts' },
	{ label: 'Оплата и доставка', href: '/delivery' },
]

export const LEGACY_HEADER_RIGHT_LINKS: LegacyNavLink[] = [
	{ label: 'Наши магазины', href: '/stores' },
	{ label: 'Оптовикам', href: '/wholesale' },
	{ label: 'Дизайнерам', href: '/designers' },
	{ label: 'Акции', href: '/sales' },
	{ label: 'Распродажа', href: '/clearance' },
]

export const LEGACY_FOOTER_ABOUT_LINKS: LegacyNavLink[] = [
	{ label: 'Блог', href: '/blog' },
	{ label: 'О нас', href: '/about' },
	{ label: 'Наши магазины', href: '/stores' },
	{ label: 'Доставка и оплата', href: '/delivery' },
	{ label: 'Обмен и возврат', href: '/returns' },
	{ label: 'Гарантия качества', href: '/warranty' },
	{ label: 'Сборка и установка', href: '/assembly' },
	{ label: 'Оптовикам', href: '/wholesale' },
	{ label: 'Дизайнерам', href: '/designers' },
	{ label: 'Контакты', href: '/contacts' },
	{ label: 'Рекламации', href: '/complaints' },
	{ label: 'Карта сайта', href: '/sitemap' },
]
