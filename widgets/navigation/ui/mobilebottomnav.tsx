'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid2X2, Heart, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import CountBadge from '@/shared/ui/countbadge'
import { useFavorites } from '@/features/favorites/usefavorites'
import { useCart } from '@/features/cart/usecart'
import { authClient } from '@/lib/auth/authclient'

export default function MobileBottomNav() {
	const pathname = usePathname()
	const { count: favoritesCount } = useFavorites()
	const { items: cartItems } = useCart()
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
	const { data: session } = authClient.useSession()
	const profileHref =
		session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR'
			? '/admin'
			: '/login'

	const tabs = [
		{ icon: Home, label: 'Главная', href: '/' },
		{ icon: Grid2X2, label: 'Каталог', href: '/catalog' },
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
			icon: User,
			label: 'Профиль',
			href: profileHref,
		},
	]

	return (
		<nav
			aria-label='Основная навигация'
			className='fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/85 md:hidden'
		>
			<div className='mobile-edge-padding pb-[calc(env(safe-area-inset-bottom)+0.25rem)]'>
				<ul className='flex items-stretch'>
					{tabs
						.filter(tab => !('hidden' in tab && tab.hidden))
						.map(tab => {
							const isActive = pathname === tab.href

							return (
								<li key={tab.href} className='flex-1'>
									<Link
										href={tab.href}
										className={cn(
											'flex flex-col items-center gap-0.5 rounded-lg py-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
											isActive
												? 'text-primary font-medium'
												: 'text-muted-foreground hover:text-foreground',
										)}
									>
										<div className='relative'>
											<tab.icon className='h-5 w-5' strokeWidth={1.5} />
											<CountBadge
												count={tab.badge ?? 0}
												className='-right-2.5 -top-1.5 text-[9px]'
											/>
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
