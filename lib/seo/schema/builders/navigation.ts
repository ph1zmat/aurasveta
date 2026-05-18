import { CANONICAL_BASE_URL } from '@/lib/seo/domain/rules'

export function buildNavigationSchema(): Record<string, unknown>[] {
	const navItems = [
		{ name: 'Люстры', url: '/catalog/lyustry' },
		{ name: 'Бра', url: '/catalog/bra' },
		{ name: 'Светильники', url: '/catalog/svetilniki' },
		{ name: 'Споты', url: '/catalog/spoty' },
		{ name: 'Торшеры', url: '/catalog/torshery' },
		{ name: 'Настольные лампы', url: '/catalog/nastolnye-lampy' },
		{ name: 'Трековые системы', url: '/catalog/trekovye-sistemy' },
		{ name: 'Уличное освещение', url: '/catalog/ulichnoe-osveshenie' },
		{ name: 'Лампочки', url: '/catalog/lampochki' },
		{ name: 'Доставка', url: '/delivery' },
		{ name: 'Контакты', url: '/contacts' },
	]

	return navItems.map((item, index) => ({
		'@context': 'https://schema.org',
		'@type': 'SiteNavigationElement',
		position: index + 1,
		name: item.name,
		url: `${CANONICAL_BASE_URL}${item.url}`,
	}))
}
