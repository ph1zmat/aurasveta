'use client'

import { useState, useCallback } from 'react'
import { Menu, Search, X, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import MobileCatalogMenu from '@/widgets/navigation/ui/MobileCatalogMenu'

export default function MobileHeader() {
	const router = useRouter()
	const [menuOpen, setMenuOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), [])
	const closeMenu = useCallback(() => setMenuOpen(false), [])

	const handleSearchSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault()
			const query = searchTerm.trim()
			if (!query) return
			router.push(`/search?q=${encodeURIComponent(query)}`)
		},
		[searchTerm, router],
	)

	return (
		<>
			<header className='fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/85 md:hidden'>
				<div className='mobile-edge-padding pt-[calc(env(safe-area-inset-top)+0.375rem)]'>
					{/* Top row: Logo + Phone */}
					<div className='flex items-center justify-between gap-3 py-2'>
						<Link href='/' className='flex items-center gap-2 shrink-0'>
						<Image
							src='/aura-logo-noline-primary.png'
							alt='Аура Света'
							width={110}
							height={40}
							className='h-10 w-28 object-cover'
						/>
						</Link>
						<a
							href='tel:+74992292322'
							className='flex items-center gap-1 rounded-md px-2 py-1 text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
						>
							<Phone className='h-4 w-4 shrink-0' />
							<span className='text-xs font-normal sm:text-sm'>+7 (499) 229 23 22</span>
						</a>
					</div>

					{/* Search row */}
					<div className='flex items-center gap-2 pb-3'>
						<Button
							variant='primary'
							size='icon'
							className='h-10 w-10 shrink-0 rounded-lg'
							onClick={toggleMenu}
							aria-expanded={menuOpen}
							aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
						>
							{menuOpen ? (
								<X className='h-5 w-5' strokeWidth={1.5} />
							) : (
								<Menu className='h-5 w-5' strokeWidth={1.5} />
							)}
						</Button>
						<form className='relative flex-1' onSubmit={handleSearchSubmit} role='search'>
							<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								variant='search'
								placeholder='Найти товар...'
								className='h-10 rounded-lg'
								value={searchTerm}
								onChange={event => setSearchTerm(event.target.value)}
								aria-label='Поиск товаров'
							/>
						</form>
					</div>
				</div>
			</header>

			{/* Mobile catalog menu overlay */}
			{menuOpen && <MobileCatalogMenu onClose={closeMenu} />}
		</>
	)
}
