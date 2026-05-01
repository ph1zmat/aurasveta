import type { LucideIcon } from 'lucide-react'
import {
	BarChart3,
	Package,
	ShoppingCart,
	FolderOpen,
	FileText,
	Search,
	Palette,
	Upload,
	Settings,
	Bell,
	SlidersHorizontal,
	Navigation,
} from 'lucide-react'

export interface AdminNavItem {
	href: string
	label: string
	icon: LucideIcon
	badge?: string | number
	badgeColor?: string
}

export interface AdminNavGroup {
	label: string
	items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
	{
		label: 'Главное',
		items: [
			{ href: '/admin', label: 'Дашборд', icon: BarChart3 },
			{ href: '/admin/products', label: 'Товары', icon: Package },
			{ href: '/admin/categories', label: 'Категории', icon: FolderOpen },
			{
				href: '/admin/orders',
				label: 'Заказы',
				icon: ShoppingCart,
				badgeColor: 'bg-destructive text-white',
			},
			{ href: '/admin/properties', label: 'Свойства', icon: SlidersHorizontal },
		],
	},
	{
		label: 'Маркетинг',
		items: [
			{ href: '/admin/pages', label: 'CMS Страницы', icon: FileText },
			{ href: '/admin/navigation', label: 'Навигация', icon: Navigation },
			{ href: '/admin/seo', label: 'SEO', icon: Search },
			{
				href: '/admin/home-sections',
				label: 'Главная страница',
				icon: Palette,
			},
			{ href: '/admin/import-export', label: 'Импорт / Экспорт', icon: Upload },
		],
	},
	{
		label: 'Система',
		items: [
			{ href: '/admin/settings', label: 'Настройки', icon: Settings },
			{
				href: '/admin/notifications',
				label: 'Уведомления',
				icon: Bell,
				badgeColor: 'bg-accent text-accent-foreground',
			},
		],
	},
]

export const EDITOR_NAV_GROUPS: AdminNavGroup[] = [
	{
		label: 'Редактор',
		items: [
			{ href: '/admin/pages', label: 'Страницы', icon: FileText },
			{ href: '/admin/navigation', label: 'Навигация', icon: Navigation },
		],
	},
]

/** Flat list used by header breadcrumbs */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
	g => g.items,
)
export const EDITOR_NAV_ITEMS: AdminNavItem[] = EDITOR_NAV_GROUPS.flatMap(
	g => g.items,
)

export function getAdminNavGroups(userRole: string): AdminNavGroup[] {
	return userRole === 'ADMIN' ? ADMIN_NAV_GROUPS : EDITOR_NAV_GROUPS
}

export function getAdminNavItems(userRole: string): AdminNavItem[] {
	return userRole === 'ADMIN' ? ADMIN_NAV_ITEMS : EDITOR_NAV_ITEMS
}
