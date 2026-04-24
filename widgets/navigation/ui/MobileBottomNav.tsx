'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Heart, ShoppingCart, User, LogOut } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import CountBadge from '@/shared/ui/CountBadge'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCart } from '@/features/cart/useCart'
import { authClient } from '@/lib/auth/auth-client'

export default function MobileBottomNav() {
	const pathname = usePathname()
	const router = useRouter()
	const { count: favoritesCount } = useFavorites()
	const { items: cartItems } = useCart()
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
	const { data: session } = authClient.useSession()

	const tabs = [
		{ icon: Home, label: 'Главная', href: '/' },
		{ icon: Search, label: 'Каталог', href: '/catalog' },
		{
			icon: Heart,
			label: 'Избранное',
			href: '/favorites',
			badge: favoritesCount,
			hidden: pathname === '/favorites',
		},
		{
			icon: ShoppingCart,
			label: 'Корзина',
			href: '/cart',
			badge: cartCount,
			hidden: pathname === '/cart',
		},
		{
			icon: session ? LogOut : User,
			label: session ? 'Выйти' : 'Профиль',
			href: session ? '#logout' : '/login',
		},
	]

	return (
		<nav className='fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/85 md:hidden'>
			<div className='mobile-edge-padding pb-[calc(env(safe-area-inset-bottom)+0.25rem)]'>
				<ul className='flex items-stretch'>
				{tabs
					.filter(tab => !('hidden' in tab && tab.hidden))
					.map(tab => {
					const isActive = pathname === tab.href
					const isLogout = tab.href === '#logout'

					if (isLogout) {
						return (
							<li key='logout' className='flex-1'>
								<button
									onClick={async () => {
										await authClient.signOut()
										router.push('/')
									}}
									className='flex w-full flex-col items-center gap-0.5 rounded-lg py-2.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
									aria-label='Выйти'
								>
									<tab.icon className='h-5 w-5' strokeWidth={1.5} />
									<span>{tab.label}</span>
								</button>
							</li>
						)
					}

					return (
						<li key={tab.href} className='flex-1'>
							<Link
								href={tab.href}
								className={cn(
									'flex flex-col items-center gap-0.5 rounded-lg py-2.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
									isActive
										? 'text-primary font-medium'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								<div className='relative'>
									<tab.icon className='h-5 w-5' strokeWidth={1.5} />
									<CountBadge count={tab.badge ?? 0} className='-right-2.5 -top-1.5 text-[9px]' />
								</div>
								<span>{tab.label}</span>
							</Link>
						</li>
					)
				})}
				</ul>
			</div>
		</nav>
	)
}
