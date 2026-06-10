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
			<div className='mb-6 md:mb-8'>
				<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					Почему мы
				</p>
				<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
					{heading}
				</h2>
			</div>
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
				{items.map(adv => (
					<div
						key={adv.title}
						className='flex flex-col items-center rounded-2xl border border-border bg-card/40 p-4 text-center transition-shadow duration-200 hover:shadow-sm'
					>
						<div className='relative mb-3 h-16 w-16'>
							<Image
								src={adv.icon}
								alt={adv.title}
								fill
								className='object-contain'
							/>
						</div>
						<p className='text-sm font-medium tracking-wide text-foreground'>
							{adv.title}
						</p>
						{adv.subtitle && (
							<p className='mt-1 text-xs leading-5 tracking-wide text-muted-foreground'>
								{adv.subtitle}
							</p>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
