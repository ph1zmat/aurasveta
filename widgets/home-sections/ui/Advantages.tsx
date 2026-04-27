import Image from 'next/image'

interface AdvantageItem {
	icon: string
	title: string
	subtitle?: string
}

interface AdvantagesSectionConfig {
	heading?: string
	items?: AdvantageItem[]
}

interface AdvantagesProps {
	title?: string | null
	config?: AdvantagesSectionConfig
}

const DEFAULT_ADVANTAGES: AdvantageItem[] = [
	{ icon: '/car.svg', title: 'Бесплатная', subtitle: 'доставка' },
	{
		icon: '/store.svg',
		title: 'Более 150 брендов',
		subtitle: 'для украшения Вашего жилья',
	},
	{ icon: '/spanner.svg', title: 'Бесплатный монтаж' },
	{
		icon: '/box.svg',
		title: 'Более 12 000 товаров',
		subtitle: 'на собственных складах',
	},
	{
		icon: '/question.svg',
		title: 'Консультации',
		subtitle: 'профессиональных менеджеров',
	},
	{ icon: '/sale.svg', title: 'Выгодные', subtitle: 'предложения' },
]

export default function Advantages({ title, config }: AdvantagesProps) {
	const heading = config?.heading ?? title ?? 'Наши преимущества'
	const items =
		config?.items && config.items.length > 0 ? config.items : DEFAULT_ADVANTAGES

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			<h2 className='mb-6 text-base font-semibold uppercase tracking-widest text-foreground md:mb-8 md:text-lg'>
				{heading}
			</h2>
			<div className='grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
				{items.map(adv => (
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
						<p className='text-sm font-normal tracking-wide text-foreground'>
							{adv.title}
						</p>
						{adv.subtitle && (
							<p className='text-xs tracking-wider text-muted-foreground'>
								{adv.subtitle}
							</p>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
