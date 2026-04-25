import { requireCmsAccess } from '@/lib/auth/auth-utils'
import Link from 'next/link'
import {
	LayoutDashboard,
	Package,
	FolderTree,
	SlidersHorizontal,
	FileText,
	ShoppingCart,
	Download,
	Webhook,
	LayoutGrid,
	Settings,
} from 'lucide-react'
import AdminNotificationsClient from './AdminNotificationsClient'
import AdminNotificationsWidget from './AdminNotificationsWidget'

const navItems = {
	admin: [
		{ href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
		{ href: '/admin/products', label: 'Товары', icon: Package },
		{ href: '/admin/categories', label: 'Категории', icon: FolderTree },
		{ href: '/admin/properties', label: 'Свойства', icon: SlidersHorizontal },
		{ href: '/admin/home-sections', label: 'Главная страница', icon: LayoutGrid },
		{ href: '/admin/pages', label: 'Страницы', icon: FileText },
		{ href: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
		{ href: '/admin/import-export', label: 'Импорт/Экспорт', icon: Download },
		{ href: '/admin/settings', label: 'Настройки', icon: Settings },
		{ href: '/admin/webhooks', label: 'Вебхуки', icon: Webhook },
		{ href: '/admin/seo', label: 'SEO', icon: FileText },
	],
	editor: [{ href: '/admin/pages', label: 'Страницы', icon: FileText }],
} as const

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { role } = await requireCmsAccess()
	const items = role === 'ADMIN' ? navItems.admin : navItems.editor

	return (
		<div className='flex min-h-screen bg-background'>
			<AdminNotificationsClient />
			<AdminNotificationsWidget />
			{/* Sidebar */}
			<aside className='hidden w-64 shrink-0 border-r border-border bg-muted/30 lg:block'>
				<div className='flex h-14 items-center border-b border-border px-6'>
					<Link
						href='/admin'
						className='text-sm font-semibold uppercase tracking-widest text-foreground'
					>
						Аура Света CMS
					</Link>
				</div>
				<nav className='mt-4 space-y-1 px-3'>
					{items.map(item => (
						<Link
							key={item.href}
							href={item.href}
							className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							<item.icon className='h-4 w-4' strokeWidth={1.5} />
							{item.label}
						</Link>
					))}
				</nav>
				<div className='mt-8 px-6'>
					<Link
						href='/'
						className='text-xs text-muted-foreground hover:text-foreground'
					>
						← Вернуться на сайт
					</Link>
				</div>
			</aside>

			{/* Main */}
			<main className='flex-1 overflow-auto'>
				<div className='container mx-auto max-w-6xl px-6 py-8'>
					{children}
				</div>
			</main>
		</div>
	)
}
