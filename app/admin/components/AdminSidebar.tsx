'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LogOut } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { getAdminNavGroups } from './admin-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AdminSidebarProps {
	userRole: string
	sidebarOpen: boolean
	onClose: () => void
}

export default function AdminSidebar({ userRole, sidebarOpen, onClose }: AdminSidebarProps) {
	const groups = getAdminNavGroups(userRole)
	const pathname = usePathname()
	const router = useRouter()

	const { data: pendingData } = trpc.orders.getAllOrders.useQuery(
		{ status: 'PENDING', page: 1, limit: 1 },
		{ refetchInterval: 15000, refetchIntervalInBackground: false },
	)
	const { data: unreadData } = trpc.notifications.countUnread.useQuery(
		undefined,
		{ refetchInterval: 15000, refetchIntervalInBackground: false },
	)
	const { data: profile } = trpc.profile.get.useQuery()
	const pendingCount = pendingData?.total ?? 0
	const unreadCount = unreadData?.count ?? 0

	const initials = profile?.name
		? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
		: profile?.email?.slice(0, 2).toUpperCase() ?? 'АД'

	const displayName = profile?.name ?? profile?.email ?? 'Администратор'
	const roleLabel = userRole === 'ADMIN' ? 'Administrator' : userRole === 'EDITOR' ? 'Editor' : userRole

	const isActive = (href: string) => {
		if (href === '/admin') return pathname === '/admin'
		return pathname.startsWith(href)
	}

	return (
		<>
			{sidebarOpen && (
				<div
					className='fixed inset-0 z-40 bg-black/50 lg:hidden'
					onClick={onClose}
				/>
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 flex flex-col
					border-r border-border bg-card
					transition-transform duration-200 ease-out
					lg:relative lg:translate-x-0
					${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
				`}
			>
				{/* Logo */}
				<div className='flex h-16 items-center gap-3 px-5 border-b border-border'>
					<div className='flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-foreground font-extrabold text-lg select-none'>
						A
					</div>
					<span className='text-lg font-bold tracking-tight'>Aura Admin</span>
					<button
						className='ml-auto lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary'
						onClick={onClose}
						aria-label='Закрыть меню'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Nav */}
				<nav className='flex-1 overflow-y-auto py-3 px-2 space-y-4'>
					{groups.map((group) => (
						<div key={group.label}>
							<div className='px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60'>
								{group.label}
							</div>
							<div className='space-y-0.5'>
								{group.items.map((item) => {
									const active = isActive(item.href)
									let badgeValue: string | number | undefined
									if (item.href === '/admin/orders' && pendingCount > 0) {
										badgeValue = pendingCount
									} else if (item.href === '/admin/notifications' && unreadCount > 0) {
										badgeValue = unreadCount
									}

									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={onClose}
											className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2
												text-sm font-medium transition-colors relative
												${active
													? 'bg-accent/10 text-accent before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-accent'
													: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
												}`}
										>
											<item.icon className='h-[18px] w-[18px] shrink-0' />
											<span className='flex-1 truncate'>{item.label}</span>
											{badgeValue !== undefined && (
												<Badge className={`h-5 min-w-5 px-1.5 text-[10px] font-bold leading-none ${item.badgeColor ?? 'bg-accent text-accent-foreground'}`}>
													{badgeValue}
												</Badge>
											)}
										</Link>
									)
								})}
							</div>
						</div>
					))}
				</nav>

				{/* User */}
				<div className='p-3 border-t border-border'>
					<div className='flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 hover:bg-secondary transition-colors cursor-pointer'>
						<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm select-none'>
							{initials}
						</div>
						<div className='min-w-0 flex-1'>
							<div className='text-sm font-semibold truncate'>{displayName}</div>
							<div className='text-xs text-muted-foreground'>{roleLabel}</div>
						</div>
						<Button
							variant='ghost'
							size='icon'
							className='ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground'
							onClick={() => router.push('/login')}
							title='Выйти'
						>
							<LogOut className='h-4 w-4' />
						</Button>
					</div>
				</div>
			</aside>
		</>
	)
}
