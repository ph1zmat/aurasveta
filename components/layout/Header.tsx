'use client'

import {
	Menu,
	Search,
	BarChart3,
	Heart,
	User,
	ShoppingCart,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const headerActions = [
	{ icon: BarChart3, label: 'Сравнение', href: '/compare', badge: 2 },
	{ icon: Heart, label: 'Избранное', href: '/favorites', badge: 0 },
	{ icon: User, label: 'Войти', href: '/login', badge: 0 },
	{ icon: ShoppingCart, label: 'Корзина', href: '/cart', badge: 1 },
]

export default function Header() {
	return (
		<header className='mb-2'>
			<div className='mx-auto flex max-w-7xl items-center gap-4 px-4 lg:gap-6'>
				{/* Logo */}
				<Link href='/' className='flex items-center gap-2 shrink-0'>
					<Image
						src='/aura-logo-noline-primary.png'
						alt='Logo'
						width={128}
						height={48}
						className='h-12 w-40 object-cover'
					/>
				</Link>

				{/* Catalog button */}
				<button className='flex items-center gap-2 rounded-4xl bg-foreground px-4 py-2.5 text-card text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0'>
					<Menu className='h-4 w-4' />
					<span className='hidden sm:inline'>Каталог</span>
				</button>

				{/* Search */}
				<div className='relative flex-1 max-w-xl '>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<input
						type='text'
						placeholder='Найти'
						className='w-full rounded-4xl border border-input bg-input py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
					/>
				</div>

				{/* Actions */}
				<div className='flex items-center gap-4 lg:gap-6'>
					{headerActions.map(action => (
						<Link
							key={action.href}
							href={action.href}
							className='relative flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors'
						>
							<div className='relative'>
								<action.icon className='h-6 w-6' />
								{action.badge > 0 && (
									<span className='absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground'>
										{action.badge}
									</span>
								)}
							</div>
							<span className='hidden lg:block text-xs'>{action.label}</span>
						</Link>
					))}
				</div>
			</div>
		</header>
	)
}
