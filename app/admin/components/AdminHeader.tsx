'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, Menu, Zap, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAdminNavItems } from './admin-nav'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface AdminHeaderProps {
	userRole: string
	onMenuToggle: () => void
}

export default function AdminHeader({ userRole, onMenuToggle }: AdminHeaderProps) {
	const pathname = usePathname()
	const router = useRouter()
	const items = getAdminNavItems(userRole)

	const activeItem = items.find((item) => {
		if (item.href === '/admin') return pathname === '/admin'
		return pathname.startsWith(item.href)
	})

	const { data: unreadData } = trpc.notifications.countUnread.useQuery(
		undefined,
		{ refetchInterval: 15000 },
	)
	const { data: profile } = trpc.profile.get.useQuery()
	const unreadCount = unreadData?.count ?? 0

	const initials = profile?.name
		? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
		: profile?.email?.slice(0, 2).toUpperCase() ?? 'АД'

	const breadcrumbLabel = activeItem?.label ?? 'Админ-панель'

	return (
		<header className='flex h-16 items-center justify-between border-b border-border px-6 backdrop-blur-xl bg-background/85 shrink-0 z-30 sticky top-0'>
			<div className='flex items-center gap-3'>
				<Button
					variant='ghost'
					size='icon'
					className='lg:hidden'
					onClick={onMenuToggle}
				>
					<Menu className='h-5 w-5' />
				</Button>
				<nav className='flex items-center gap-1 text-sm' aria-label='Хлебные крошки'>
					<span className='text-muted-foreground'>Главная</span>
					<ChevronRight className='h-3.5 w-3.5 text-muted-foreground/50' />
					<span className='font-semibold text-foreground'>{breadcrumbLabel}</span>
				</nav>
			</div>

			<div className='flex items-center gap-2'>
				<div className='relative hidden sm:block'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Поиск...'
						className='w-56 pl-9 pr-12 rounded-lg border-border bg-card text-sm'
						onKeyDown={(e) => {
							if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
								e.preventDefault()
							}
						}}
					/>
					<kbd className='absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono'>
						⌘K
					</kbd>
				</div>

				<Button
					variant='ghost'
					size='icon'
					className='relative'
					onClick={() => router.push('/admin/notifications')}
					title='Уведомления'
				>
					<Bell className='h-5 w-5' />
					{unreadCount > 0 && (
						<span className='absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background' />
					)}
				</Button>

				<Button
					variant='ghost'
					size='icon'
					title='AI-ассистент'
					onClick={() => toast.info('AI-ассистент скоро будет доступен')}
				>
					<Zap className='h-5 w-5 text-accent' />
				</Button>

				<div className='h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm cursor-pointer select-none shrink-0'>
					{initials}
				</div>
			</div>
		</header>
	)
}
