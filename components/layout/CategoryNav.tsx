import Link from 'next/link'
import { cn } from '@/lib/utils'
import UnderlineAnimation from '@/components/ui/UnderlineAnimation'

interface Category {
	id: string
	name: string
	href: string
	highlight?: boolean
}

const defaultCategories: Category[] = [
	{ id: 'lustry', name: 'ЛЮСТРЫ', href: '/catalog/lustry' },
	{ id: 'svetilniki', name: 'СВЕТИЛЬНИКИ', href: '/catalog/svetilniki' },
	{ id: 'treki', name: 'ТРЕКИ', href: '/catalog/treki' },
	{ id: 'bra', name: 'БРА', href: '/catalog/bra' },
	{ id: 'spoty', name: 'СПОТЫ', href: '/catalog/spoty' },
	{ id: 'nastolnye', name: 'НАСТОЛЬНЫЕ', href: '/catalog/nastolnye' },
	{ id: 'ulichnye', name: 'УЛИЧНЫЕ', href: '/catalog/ulichnye' },
	{ id: 'torshery', name: 'ТОРШЕРЫ', href: '/catalog/torshery' },
	{
		id: 'elektrotovary',
		name: 'ЭЛЕКТРОТОВАРЫ',
		href: '/catalog/elektrotovary',
	},
	{ id: 'dekor', name: 'ДЕКОР', href: '/catalog/dekor' },
	{ id: 'lampochki', name: 'ЛАМПОЧКИ', href: '/catalog/lampochki' },
	{ id: 'utsenka', name: 'УЦЕНКА', href: '/catalog/utsenka', highlight: true },
]

interface CategoryNavProps {
	categories?: Category[]
}

export default function CategoryNav({
	categories = defaultCategories,
}: CategoryNavProps) {
	return (
		<nav className='border-t border-b border-foreground'>
			<div className='mx-auto max-w-7xl px-4'>
				<ul className='flex items-stretch overflow-x-auto scrollbar-hide'>
					{categories.map(cat => (
						<li key={cat.id} className='flex flex-1 min-w-0'>
							<UnderlineAnimation
								className='flex w-full'
								lineClassName={
									cat.highlight ? 'bg-destructive' : 'bg-foreground'
								}
							>
								<Link
									href={cat.href}
									className={cn(
										'flex w-full items-center justify-center px-3 py-2 text-xs font-medium tracking-wide transition-colors',
										cat.highlight ? 'text-destructive' : 'text-foreground',
									)}
								>
									{cat.name}
								</Link>
							</UnderlineAnimation>
						</li>
					))}
				</ul>
			</div>
		</nav>
	)
}
