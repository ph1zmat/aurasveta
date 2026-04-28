import type { LucideIcon } from 'lucide-react'
import {
	Download,
	FileText,
	FolderTree,
	LayoutDashboard,
	LayoutGrid,
	Package,
	Search,
	Settings,
	ShoppingCart,
	SlidersHorizontal,
	Webhook,
} from 'lucide-react'

export interface AdminNavItem {
	href: string
	label: string
	icon: LucideIcon
	keywords?: string[]
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
	{
		href: '/admin',
		label: 'Дашборд',
		icon: LayoutDashboard,
		keywords: ['dashboard', 'home', 'главная', 'сводка'],
	},
	{
		href: '/admin/home-sections',
		label: 'Секции',
		icon: LayoutGrid,
		keywords: ['главная', 'home', 'sections', 'блоки'],
	},
	{
		href: '/admin/products',
		label: 'Товары',
		icon: Package,
		keywords: ['products', 'catalog', 'каталог'],
	},
	{
		href: '/admin/categories',
		label: 'Категории',
		icon: FolderTree,
		keywords: ['categories', 'дерево', 'taxonomy'],
	},
	{
		href: '/admin/properties',
		label: 'Свойства',
		icon: SlidersHorizontal,
		keywords: ['properties', 'filters', 'характеристики'],
	},
	{
		href: '/admin/pages',
		label: 'Страницы',
		icon: FileText,
		keywords: ['pages', 'cms', 'контент'],
	},
	{
		href: '/admin/orders',
		label: 'Заказы',
		icon: ShoppingCart,
		keywords: ['orders', 'sales', 'покупки'],
	},
	{
		href: '/admin/import-export',
		label: 'Импорт/Экспорт',
		icon: Download,
		keywords: ['import', 'export', 'csv'],
	},
	{
		href: '/admin/webhooks',
		label: 'Вебхуки',
		icon: Webhook,
		keywords: ['webhooks', 'integrations', 'api'],
	},
	{
		href: '/admin/seo',
		label: 'SEO',
		icon: Search,
		keywords: ['meta', 'optimization', 'поиск'],
	},
	{
		href: '/admin/settings',
		label: 'Настройки',
		icon: Settings,
		keywords: ['settings', 'config', 'конфиг'],
	},
]

export const EDITOR_NAV_ITEMS: AdminNavItem[] = [
	{
		href: '/admin/pages',
		label: 'Страницы',
		icon: FileText,
		keywords: ['pages', 'cms', 'контент'],
	},
]

export function getAdminNavItems(userRole: string) {
	return userRole === 'ADMIN' ? ADMIN_NAV_ITEMS : EDITOR_NAV_ITEMS
}
