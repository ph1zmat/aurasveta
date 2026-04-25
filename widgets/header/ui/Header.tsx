'use client'

import {
	useState,
	useCallback,
	useRef,
	useMemo,
	useSyncExternalStore,
} from 'react'
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
import { authClient } from '@/lib/auth/auth-client'
import { useCart } from '@/features/cart/useCart'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import type { CartItemData } from '@/shared/types/cart'
import { getProductImageUrl } from '@/shared/lib/product-utils'
import type { ProductImage } from '@/shared/types/product'

export default function Header() {
	const pathname = usePathname()
	const router = useRouter()
	const { data: session } = authClient.useSession()

	// Prevent hydration mismatch: session is only available client-side,
	// so defer auth-dependent UI until after mount.
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	)
	const clientSession = mounted ? session : null

	const [catalogOpen, setCatalogOpen] = useState(false)
	const toggleCatalog = useCallback(() => setCatalogOpen(prev => !prev), [])
	const closeCatalog = useCallback(() => setCatalogOpen(false), [])

	const [cartOpen, setCartOpen] = useState(false)
	const cartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const { serverCartWithProducts, count: cartCount } = useCart()
	const cartItems = useMemo<CartItemData[]>(
		() =>
			(serverCartWithProducts as Array<Record<string, unknown>>).map(item => {
				const p = item.product as Record<string, unknown> | null
				return {
					id: String(item.productId ?? ''),
					name: p ? String(p.name ?? '') : '',
					href: p ? `/product/${p.slug}` : `/product/${item.productId}`,
					image: p
						? getProductImageUrl(
								{
									images: Array.isArray(p.images)
										? (p.images as ProductImage[])
										: [],
								},
								'/images/placeholder.jpg',
							)
						: '/images/placeholder.jpg',
					price: p ? Number(p.price ?? 0) : 0,
					quantity: Number(item.quantity ?? 1),
				}
			}),
		[serverCartWithProducts],
	)

	const { count: favoritesCount } = useFavorites()
	const { count: compareCount } = useCompare()

	const headerActions = [
		{
			icon: BarChart3,
			label: 'Сравнение',
			href: '/compare',
			badge: mounted ? compareCount : 0,
			hidden: pathname === '/compare',
		},
		{
			icon: Heart,
			label: 'Избранное',
			href: '/favorites',
			badge: mounted ? favoritesCount : 0,
			hidden: pathname === '/favorites',
		},
		...(clientSession
			? clientSession.user?.role === 'ADMIN' ||
				clientSession.user?.role === 'EDITOR'
				? [
						{
							icon: User,
							label: 'Профиль',
							href: '/admin',
							badge: 0,
							hidden: false,
						},
					]
				: []
			: [
					{
						icon: User,
						label: 'Войти',
						href: '/login',
						badge: 0,
						hidden: false,
					},
				]),
		{
			icon: ShoppingCart,
			label: 'Корзина',
			href: '/cart',
			badge: mounted ? cartCount : 0,
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

				{/* Search — expands when action icons are hidden on current page */}
				<SearchBar
					className={
						headerActions.some(a => a.hidden) ? 'max-w-3xl' : 'max-w-2xl'
					}
				/>

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
