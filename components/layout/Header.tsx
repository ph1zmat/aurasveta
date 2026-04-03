'use client'

import { useState, useCallback, useRef } from 'react'
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
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import CatalogDropdown from '@/components/layout/CatalogDropdown'
import MiniCart from '@/components/cart/MiniCart'
import { mockCartItems } from '@/mocks/cart'

const headerActions = [
	{ icon: BarChart3, label: 'Сравнение', href: '/compare', badge: 2 },
	{ icon: Heart, label: 'Избранное', href: '/favorites', badge: 0 },
	{ icon: User, label: 'Войти', href: '/login', badge: 0 },
	{ icon: ShoppingCart, label: 'Корзина', href: '/cart', badge: 1 },
]

export default function Header() {
	const [catalogOpen, setCatalogOpen] = useState(false)
	const toggleCatalog = useCallback(() => setCatalogOpen(prev => !prev), [])
	const closeCatalog = useCallback(() => setCatalogOpen(false), [])

	const [cartOpen, setCartOpen] = useState(false)
	const cartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const openCart = useCallback(() => {
		if (cartTimeout.current) clearTimeout(cartTimeout.current)
		setCartOpen(true)
	}, [])

	const closeCartDelayed = useCallback(() => {
		cartTimeout.current = setTimeout(() => setCartOpen(false), 200)
	}, [])

	return (
		<header className='hidden md:block mb-2'>
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
				<Button
					variant='primary'
					size='xs'
					className='rounded-4xl shrink-0 normal-case tracking-normal px-4 text-sm'
					onClick={toggleCatalog}
					aria-expanded={catalogOpen}
				>
					<Menu className='h-4 w-4' />
					<span className='hidden sm:inline'>Каталог</span>
				</Button>

				{/* Search */}
				<div className='relative flex-1 max-w-xl '>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input variant='search' placeholder='Найти' />
				</div>

				{/* Actions */}
				<div className='flex items-center gap-4 lg:gap-6'>
					{headerActions.map(action => {
						const isCart = action.href === '/cart'

						const linkEl = (
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
						)

						if (!isCart) return linkEl

						return (
							<div
								key={action.href}
								className='relative'
								onMouseEnter={openCart}
								onMouseLeave={closeCartDelayed}
							>
								{linkEl}
								{cartOpen && (
									<div className='absolute -right-4 top-full z-50 mt-2  rounded-sm border border-border bg-card shadow-lg w-120'>
										<MiniCart items={mockCartItems} />
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Catalog mega-menu */}
			<CatalogDropdown
				key={+catalogOpen}
				open={catalogOpen}
				onClose={closeCatalog}
			/>
		</header>
	)
}
