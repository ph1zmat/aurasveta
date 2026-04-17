import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { trpc } from '../lib/trpc'
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
	LogOut,
	Menu,
	X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

const navItems = [
	{ href: '/', label: 'Дашборд', icon: LayoutDashboard },
	{ href: '/products', label: 'Товары', icon: Package },
	{ href: '/categories', label: 'Категории', icon: FolderTree },
	{ href: '/properties', label: 'Свойства', icon: SlidersHorizontal },
	{ href: '/pages', label: 'Страницы', icon: FileText },
	{ href: '/orders', label: 'Заказы', icon: ShoppingCart },
	{ href: '/import-export', label: 'Импорт/Экспорт', icon: Download },
	{ href: '/webhooks', label: 'Вебхуки', icon: Webhook },
	{ href: '/seo', label: 'SEO', icon: Search },
	{ href: '/settings', label: 'Настройки', icon: Settings },
]

export function AdminLayout({ children }: { children: ReactNode }) {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const { data: pendingData } = trpc.orders.getAllOrders.useQuery(
		{ status: 'PENDING', page: 1, limit: 1 },
		{ refetchInterval: 15000 },
	)
	const pendingCount = pendingData?.total ?? 0

	const handleLogout = async () => {
		await logout()
		navigate('/login')
	}

	return (
		<div className='flex min-h-screen bg-background'>
			{/* Mobile menu button */}
			<button
				className='fixed left-4 top-4 z-50 rounded-lg bg-muted/80 p-2 lg:hidden'
				onClick={() => setSidebarOpen(!sidebarOpen)}
			>
				{sidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
			</button>

			{/* Sidebar backdrop on mobile */}
			{sidebarOpen && (
				<div
					className='fixed inset-0 z-30 bg-black/50 lg:hidden'
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-muted/30 transition-transform lg:static lg:translate-x-0 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className='flex h-14 items-center border-b border-border px-6'>
					<span className='text-sm font-semibold uppercase tracking-widest text-foreground'>
						Аура Света CMS
					</span>
				</div>

				<nav className='mt-4 space-y-1 px-3'>
					{navItems.map(item => (
						<NavLink
							key={item.href}
							to={item.href}
							end={item.href === '/'}
							className={({ isActive }) =>
								`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
									isActive
										? 'bg-muted text-foreground font-medium'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								}`
							}
							onClick={() => setSidebarOpen(false)}
						>
							<item.icon className='h-4 w-4' strokeWidth={1.5} />
							{item.label}
							{item.href === '/orders' && pendingCount > 0 && (
								<span className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-foreground'>
									{pendingCount}
								</span>
							)}
						</NavLink>
					))}
				</nav>

				{/* User info & logout */}
				<div className='absolute bottom-0 left-0 right-0 border-t border-border p-4'>
					<div className='mb-2 text-xs text-muted-foreground truncate'>
						{user?.email}
					</div>
					<div className='mb-3 text-xs text-muted-foreground'>
						Роль: <span className='text-foreground'>{user?.role}</span>
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

			{/* Main content */}
			<main className='flex-1 overflow-auto'>
				<div className='container mx-auto max-w-6xl px-6 py-8 lg:px-6'>
					{children}
				</div>
			</main>
		</div>
	)
}
