import {
	Truck,
	Store,
	Wrench,
	Package,
	MessageCircle,
	Tag,
	Percent,
} from 'lucide-react'
import Image from 'next/image'

interface Advantage {
	icon: string
	title: string
	subtitle?: string
}

const advantages: Advantage[] = [
	{ icon: '/car.svg', title: 'Бесплатная', subtitle: 'доставка' },
	{
		icon: '/store.svg',
		title: 'Более 150 брендов',
		subtitle: 'для украшения Вашего жилья',
	},
	{ icon: '/spanner.svg', title: 'Бесплатный монтаж' },
	{
		icon: '/box.svg',
		title: 'Более 12 000 товаров',
		subtitle: 'на собственных складах',
	},
	{
		icon: '/question.svg',
		title: 'Консультации',
		subtitle: 'профессиональных менеджеров',
	},
	{ icon: '/sale.svg', title: 'Выгодные', subtitle: 'предложения' },
]

export default function Advantages() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-10'>
			<h2 className='mb-8 text-lg font-bold uppercase tracking-wider text-foreground'>
				Наши преимущества
			</h2>
			<div className='grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
				{advantages.map(adv => (
					<div
						key={adv.title}
						className='flex flex-col items-center text-center'
					>
						<div className='relative h-20 w-20'>
							<Image
								src={adv.icon}
								alt={adv.title}
								fill
								className='object-contain'
							/>
						</div>
						<p className='text-sm font-medium text-foreground'>{adv.title}</p>
						{adv.subtitle && (
							<p className='text-xs text-muted-foreground'>{adv.subtitle}</p>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
