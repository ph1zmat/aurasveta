'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
	Menu,
	BarChart3,
	Heart,
	User,
	ShoppingCart,
	LogOut,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/Button'
import SearchBar from '@/widgets/header/ui/SearchBar'
import CatalogDropdown from '@/widgets/header/ui/CatalogDropdown'
import MiniCart from '@/widgets/header/ui/MiniCart'
import CountBadge from '@/shared/ui/CountBadge'
import { trpc } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/auth-client'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import type { CartItemData } from '@/shared/types/cart'

export default function Header() {
	const pathname = usePathname()
	const router = useRouter()
	const { data: session } = authClient.useSession()

	// Prevent hydration mismatch: session is only available client-side,
	// so defer auth-dependent UI until after mount.
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	const clientSession = mounted ? session : null

	const [catalogOpen, setCatalogOpen] = useState(false)
	const toggleCatalog = useCallback(() => setCatalogOpen(prev => !prev), [])
	const closeCatalog = useCallback(() => setCatalogOpen(false), [])

	const [cartOpen, setCartOpen] = useState(false)
	const cartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Fetch real cart data — silently returns empty on auth failure
	const { data: cartRaw } = trpc.cart.get.useQuery(undefined, {
		retry: false,
		refetchOnWindowFocus: false,
	})
	const cartItems = useMemo<CartItemData[]>(() => {
		if (!Array.isArray(cartRaw)) return []
		return (cartRaw as Array<Record<string, unknown>>).map(item => ({
			id: String(item.productId ?? item.id ?? ''),
			name: String(item.name ?? ''),
			href: String(item.href ?? `/product/${item.productId}`),
			image: String(item.image ?? '/images/placeholder.jpg'),
			price: Number(item.price ?? 0),
			quantity: Number(item.quantity ?? 1),
		}))
	}, [cartRaw])
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

	const { count: favoritesCount } = useFavorites()
	const { count: compareCount } = useCompare()

	const headerActions = [
		{
			icon: BarChart3,
			label: 'Сравнение',
			href: '/compare',
			badge: compareCount,
			hidden: pathname === '/compare',
		},
		{
			icon: Heart,
			label: 'Избранное',
			href: '/favorites',
			badge: favoritesCount,
			hidden: pathname === '/favorites',
		},
		{
			icon: User,
			label: clientSession ? 'Профиль' : 'Войти',
			href: clientSession ? '/admin' : '/login',
			badge: 0,
			hidden: false,
		},
		{
			icon: ShoppingCart,
			label: 'Корзина',
			href: '/cart',
			badge: cartCount,
			hidden: pathname === '/cart',
		},
	]

	const handleSignOut = useCallback(async () => {
		await authClient.signOut()
		router.push('/')
	}, [router])

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
					className='rounded-full shrink-0 normal-case tracking-normal px-4 text-sm'
					onClick={toggleCatalog}
					aria-expanded={catalogOpen}
				>
					<Menu className='h-4 w-4' />
					<span className='hidden sm:inline'>Каталог</span>
				</Button>

				{/* Search */}
				<SearchBar />

				{/* Actions */}
				<div className='flex items-center gap-4 lg:gap-6'>
					{headerActions
						.filter(action => !action.hidden)
						.map(action => {
							const isCart = action.href === '/cart'

							const linkEl = (
								<Link
									key={action.href}
									href={action.href}
									className='relative flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors'
								>
									<div className='relative'>
										<action.icon className='h-6 w-6' />
										<CountBadge count={action.badge} />
									</div>
									<span className='hidden lg:block text-xs'>
										{action.label}
									</span>
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
										<div className='absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background shadow-xl'>
											<MiniCart items={cartItems} />
										</div>
									)}
								</div>
							)
						})}

					{clientSession && (
						<button
							onClick={handleSignOut}
							className='relative flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors'
							aria-label='Выйти'
						>
							<LogOut className='h-6 w-6' />
							<span className='hidden lg:block text-xs'>Выйти</span>
						</button>
					)}
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
