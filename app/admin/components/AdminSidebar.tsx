'use client'

import { useState } from 'react'
import { formatForDisplay } from '@tanstack/hotkeys'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, Search, X } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/auth-client'
import { openAdminCommandPalette } from './admin-command-palette.store'
import { getAdminNavItems } from './admin-nav'

interface AdminSidebarProps {
	userEmail: string
	userRole: string
}

export default function AdminSidebar({
	userEmail,
	userRole,
}: AdminSidebarProps) {
	const items = getAdminNavItems(userRole)
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

			<div className='px-3 pt-4'>
				<button
					type='button'
					onClick={() => {
						openAdminCommandPalette()
						setSidebarOpen(false)
					}}
					className='flex w-full items-center gap-3 rounded-2xl border border-border bg-background/80 px-3 py-3 text-left transition-colors hover:bg-muted'
				>
					<div className='rounded-xl bg-primary/10 p-2 text-primary'>
						<Search className='h-4 w-4' />
					</div>
					<div className='min-w-0 flex-1'>
						<div className='text-sm font-medium text-foreground'>
							Command palette
						</div>
						<div className='truncate text-xs text-muted-foreground'>
							Переходы, создание сущностей и быстрые сценарии.
						</div>
					</div>
					<kbd className='rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground'>
						{formatForDisplay('Mod+K')}
					</kbd>
				</button>
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
