import type { LucideIcon } from 'lucide-react'
import {
	LayoutDashboard,
	Package,
	FolderTree,
	SlidersHorizontal,
	FileText,
	ShoppingCart,
	Download,
	Webhook,
	Search,
	Settings,
} from 'lucide-react'

export type AdminRole = 'ADMIN' | 'EDITOR'

export interface AdminNavItem {
	key:
		| 'dashboard'
		| 'products'
		| 'categories'
		| 'properties'
		| 'pages'
		| 'orders'
		| 'import-export'
		| 'webhooks'
		| 'seo'
		| 'settings'
	label: string
	icon: LucideIcon
	webHref: string
	desktopHref: string
	roles: AdminRole[]
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
	{
		key: 'dashboard',
		label: 'Главная',
		icon: LayoutDashboard,
		webHref: '/admin',
		desktopHref: '/',
		roles: ['ADMIN'],
	},
	{
		key: 'products',
		label: 'Товары',
		icon: Package,
		webHref: '/admin/products',
		desktopHref: '/products',
		roles: ['ADMIN'],
	},
	{
		key: 'categories',
		label: 'Категории',
		icon: FolderTree,
		webHref: '/admin/categories',
		desktopHref: '/categories',
		roles: ['ADMIN'],
	},
	{
		key: 'properties',
		label: 'Свойства',
		icon: SlidersHorizontal,
		webHref: '/admin/properties',
		desktopHref: '/properties',
		roles: ['ADMIN'],
	},
	{
		key: 'pages',
		label: 'Страницы',
		icon: FileText,
		webHref: '/admin/pages',
		desktopHref: '/pages',
		roles: ['ADMIN', 'EDITOR'],
	},
	{
		key: 'orders',
		label: 'Заказы',
		icon: ShoppingCart,
		webHref: '/admin/orders',
		desktopHref: '/orders',
		roles: ['ADMIN'],
	},
	{
		key: 'import-export',
		label: 'Импорт/Экспорт',
		icon: Download,
		webHref: '/admin/import-export',
		desktopHref: '/import-export',
		roles: ['ADMIN'],
	},
	{
		key: 'webhooks',
		label: 'Вебхуки',
		icon: Webhook,
		webHref: '/admin/webhooks',
		desktopHref: '/webhooks',
		roles: ['ADMIN'],
	},
	{
		key: 'seo',
		label: 'SEO',
		icon: Search,
		webHref: '/admin/seo',
		desktopHref: '/seo',
		roles: ['ADMIN'],
	},
	{
		key: 'settings',
		label: 'Настройки',
		icon: Settings,
		webHref: '/admin/settings',
		desktopHref: '/settings',
		roles: ['ADMIN'],
	},
]

export function getAdminNavItems(role: AdminRole) {
	return ADMIN_NAV_ITEMS.filter(item => item.roles.includes(role))
}
