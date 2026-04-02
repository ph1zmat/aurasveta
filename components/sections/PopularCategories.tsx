import Image from 'next/image'
import Link from 'next/link'
import UnderlineAnimation from '@/components/ui/UnderlineAnimation'

interface Category {
	label: string
	href: string
	image: string
}

const categories: Category[] = [
	{
		label: 'ЛЮСТРЫ',
		href: '/catalog/lustry',
		image: '/chandelier.svg',
	},
	{ label: 'БРА', href: '/catalog/bra', image: '/bra.svg' },
	{
		label: 'ТОРШЕРЫ',
		href: '/catalog/torshery',
		image: '/floorlamp.svg',
	},
	{
		label: 'СПОТЫ',
		href: '/catalog/spoty',
		image: '/spot.svg',
	},
	{
		label: 'СВЕТИЛЬНИКИ',
		href: '/catalog/svetilniki',
		image: '/lamp.svg',
	},
	{
		label: 'УЛИЧНЫЕ',
		href: '/catalog/ulichnye',
		image: '/streetlamp.svg',
	},
	{
		label: 'НАСТОЛЬНЫЕ',
		href: '/catalog/nastolnye',
		image: '/desctoplamp.svg',
	},
]

export default function PopularCategories() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-8'>
			<h2 className='mb-6 text-lg font-bold uppercase tracking-wider text-foreground'>
				Популярные категории
			</h2>
			<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7'>
				{categories.map(cat => (
					<Link
						key={cat.href}
						href={cat.href}
						className='group flex flex-col items-center gap-3 p-4'
					>
						<div className='relative h-24 w-24'>
							<Image
								src={cat.image}
								alt={cat.label}
								fill
								className='object-contain'
							/>
						</div>
						<UnderlineAnimation>
							<span className='text-center text-xs font-medium uppercase tracking-wider text-foreground py-1'>
								{cat.label}
							</span>
						</UnderlineAnimation>
					</Link>
				))}
			</div>
		</section>
	)
}
