'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
	{ icon: Home, label: 'Главная', href: '/' },
	{ icon: Search, label: 'Каталог', href: '/catalog' },
	{ icon: Heart, label: 'Избранное', href: '/favorites', badge: 3 },
	{ icon: ShoppingCart, label: 'Корзина', href: '/cart', badge: 3 },
	{ icon: User, label: 'Профиль', href: '/login' },
]

export default function MobileBottomNav() {
	const pathname = usePathname()

	return (
		<nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden'>
			<ul className='flex items-stretch'>
				{tabs.map(tab => {
					const isActive = pathname === tab.href
					return (
						<li key={tab.href} className='flex-1'>
							<Link
								href={tab.href}
								className={cn(
									'flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
									isActive
										? 'text-destructive font-medium'
										: 'text-muted-foreground',
								)}
							>
								<div className='relative'>
									<tab.icon className='h-5 w-5' strokeWidth={1.5} />
									{tab.badge && tab.badge > 0 && (
										<span className='absolute -right-2.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground'>
											{tab.badge}
										</span>
									)}
								</div>
								<span>{tab.label}</span>
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
