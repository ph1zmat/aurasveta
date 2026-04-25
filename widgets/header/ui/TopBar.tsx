'use client'

import { MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

const serviceLinks = [
	{ label: 'Сборка и установка', href: '/assembly' },
	{ label: 'Контакты', href: '/contacts' },
	{ label: 'Оплата и доставка', href: '/delivery' },
]

const rightLinks = [
	{ label: 'Наши магазины', href: '/stores' },
	{ label: 'Оптовикам', href: '/wholesale' },
	{ label: 'Дизайнерам', href: '/designers' },
	{ label: 'Акции', href: '/sales' },
	{ label: 'Распродажа', href: '/clearance' },
]

export default function TopBar() {
	return (
		<div className='hidden md:block text-sm border-b border-border/50'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5'>
				<div className='flex items-center gap-6'>
					<button className='flex items-center gap-1 text-foreground hover:text-accent transition-colors duration-180'>
						<MapPin className='h-3.5 w-3.5' />
						<span>Мозырь</span>
					</button>
					<nav className='hidden md:flex items-center gap-4'>
						{serviceLinks.map(link => (
							<Link
								key={link.href}
								href={link.href}
								className='text-muted-foreground hover:text-foreground transition-colors duration-180'
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>

				<div className='flex items-center gap-6'>
					<a
						href='tel:+375292292322'
						className='flex items-center gap-1 text-foreground hover:text-accent transition-colors duration-180'
					>
						<Phone className='h-3.5 w-3.5' />
						<span className='font-normal'>+375 (29) 229 23 22</span>
						<span className='text-muted-foreground text-xs ml-1'>
							(с 9 до 21)
						</span>
					</a>
					<nav className='hidden lg:flex items-center gap-4'>
						{rightLinks.map(link => (
							<Link
								key={link.href}
								href={link.href}
								className='text-muted-foreground hover:text-accent transition-colors duration-180'
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</div>
	)
}
