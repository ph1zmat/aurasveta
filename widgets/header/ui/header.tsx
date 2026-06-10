'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
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
import { Button } from '@/shared/ui/button'
import SearchBar from '@/widgets/header/ui/searchbar'
import CatalogDropdown from '@/widgets/header/ui/catalogdropdown'
import CountBadge from '@/shared/ui/countbadge'
import { authClient } from '@/lib/auth/authclient'
import { useCart } from '@/features/cart/usecart'
import { useFavorites } from '@/features/favorites/usefavorites'
import { useCompare } from '@/features/compare/usecompare'

export default function Header({ logoUrl }: { logoUrl?: string | null }) {
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

	const { count: cartCount } = useCart()

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

	return (
		<header className='hidden md:block mb-2'>
			<div className='mx-auto flex max-w-7xl items-center gap-4 px-4 lg:gap-6'>
				{/* Logo */}
				<Link href='/' className='flex items-center gap-2 shrink-0'>
					<Image
						src={logoUrl ?? '/auralogonolineprimary.png'}
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
						.map(action => (
							<Link
								key={action.href}
								href={action.href}
								className='relative flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors'
							>
								<div className='relative'>
									<action.icon className='h-6 w-6' />
									<CountBadge count={action.badge} />
								</div>
								<span className='hidden lg:block text-xs'>{action.label}</span>
							</Link>
						))}

					{clientSession && (
						<Button
							onClick={handleSignOut}
							variant='icon'
							size='icon'
							className='h-auto w-auto flex-col gap-0.5 px-0 py-0'
							aria-label='Выйти'
						>
							<LogOut className='h-6 w-6' />
							<span className='hidden lg:block text-xs'>Выйти</span>
						</Button>
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
