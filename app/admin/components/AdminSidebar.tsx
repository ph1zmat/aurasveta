'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
	LogOut,
	Menu,
	X,
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
	LayoutGrid,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/auth-client'

const NAV_ITEMS = {
	admin: [
		{ href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
		{ href: '/admin/home-sections', label: 'Секции', icon: LayoutGrid },
		{ href: '/admin/products', label: 'Товары', icon: Package },
		{ href: '/admin/categories', label: 'Категории', icon: FolderTree },
		{ href: '/admin/properties', label: 'Свойства', icon: SlidersHorizontal },
		{ href: '/admin/pages', label: 'Страницы', icon: FileText },
		{ href: '/admin/orders', label: 'Заказы', icon: ShoppingCart },
		{ href: '/admin/import-export', label: 'Импорт/Экспорт', icon: Download },
		{ href: '/admin/webhooks', label: 'Вебхуки', icon: Webhook },
		{ href: '/admin/seo', label: 'SEO', icon: Search },
		{ href: '/admin/settings', label: 'Настройки', icon: Settings },
	],
	editor: [{ href: '/admin/pages', label: 'Страницы', icon: FileText }],
}

interface AdminSidebarProps {
	userEmail: string
	userRole: string
}

export default function AdminSidebar({
	userEmail,
	userRole,
}: AdminSidebarProps) {
	const items = userRole === 'ADMIN' ? NAV_ITEMS.admin : NAV_ITEMS.editor
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const pathname = usePathname()
	const router = useRouter()

	const { data: pendingData } = trpc.orders.getAllOrders.useQuery(
		{ status: 'PENDING', page: 1, limit: 1 },
		{ refetchInterval: 15000 },
	)
	const pendingCount = pendingData?.total ?? 0

	const handleLogout = async () => {
		await authClient.signOut()
		router.push('/login')
	}

	const isActive = (href: string) => {
		if (href === '/admin') return pathname === '/admin'
		return pathname.startsWith(href)
	}

	const sidebarContent = (
		<aside
			className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-muted/30 transition-transform lg:static lg:translate-x-0 ${
				sidebarOpen ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			<div className='flex h-14 items-center border-b border-border px-6'>
				<Link
					href='/admin'
					className='text-sm font-semibold uppercase tracking-widest text-foreground'
					onClick={() => setSidebarOpen(false)}
				>
					Аура Света CMS
				</Link>
			</div>

			<nav className='mt-4 space-y-1 px-3'>
				{items.map(item => {
					const active = isActive(item.href)
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setSidebarOpen(false)}
							className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
								active
									? 'bg-muted font-medium text-foreground'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							}`}
						>
							<item.icon className='h-4 w-4' strokeWidth={1.5} />
							{item.label}
							{item.href === '/admin/orders' && pendingCount > 0 && (
								<span className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-foreground'>
									{pendingCount}
								</span>
							)}
						</Link>
					)
				})}
			</nav>

			{/* Back to site */}
			<div className='mt-8 px-6'>
				<Link
					href='/'
					className='text-xs text-muted-foreground hover:text-foreground'
				>
					← Вернуться на сайт
				</Link>
			</div>

			{/* User info & logout */}
			<div className='absolute bottom-0 left-0 right-0 border-t border-border p-4'>
				<div className='mb-1 truncate text-xs text-muted-foreground'>
					{userEmail}
				</div>
				<div className='mb-3 text-xs text-muted-foreground'>
					Роль: <span className='text-foreground'>{userRole}</span>
				</div>
				<button
					onClick={handleLogout}
					className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
				>
					<LogOut className='h-4 w-4' />
					Выйти
				</button>
			</div>
		</aside>
	)

	return (
		<>
			{/* Mobile menu button */}
			<button
				className='fixed left-4 top-4 z-50 rounded-lg bg-muted/80 p-2 lg:hidden'
				onClick={() => setSidebarOpen(!sidebarOpen)}
				aria-label='Открыть меню'
			>
				{sidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
			</button>

			{/* Backdrop */}
			{sidebarOpen && (
				<div
					className='fixed inset-0 z-30 bg-black/50 lg:hidden'
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{sidebarContent}
		</>
	)
}
