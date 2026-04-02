import { Truck, ShieldCheck, RotateCcw, CreditCard } from 'lucide-react'
import Link from 'next/link'

const advantages = [
	{
		icon: Truck,
		title: 'Доставка по Москве от 3 000 руб. - бесплатно',
		description: 'Доставим товар прямо до двери в удобное для вас время.',
		titleClass: 'text-primary',
	},
	{
		icon: ShieldCheck,
		title: 'Расширенная гарантия',
		description:
			'18 месяцев гарантия от поставщика + 12 месяцев от магазина DonPlafon',
		titleClass: 'text-primary',
	},
	{
		icon: RotateCcw,
		title: 'Увеличенный срок возврата',
		description: 'Примем товар в течение 35 дней',
		titleClass: 'text-primary',
	},
	{
		icon: CreditCard,
		title: 'Оплата с помощью бонусов СберСпасибо',
		description: 'Оплачивайте до 99% стоимости в обмен на бонусы СберСпасибо',
		titleClass: 'text-primary',
	},
]

export default function DeliveryAdvantages() {
	return (
		<div className='grid grid-cols-1 gap-4 border-t border-b border-border py-6 sm:grid-cols-2'>
			{advantages.map(adv => (
				<div key={adv.title} className='flex gap-3'>
					<adv.icon
						className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground'
						strokeWidth={1.5}
					/>
					<div>
						<Link
							href='#'
							className={`text-sm font-medium ${adv.titleClass} underline underline-offset-2 transition-colors hover:text-foreground`}
						>
							{adv.title}
						</Link>
						<p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
							{adv.description}
						</p>
					</div>
				</div>
			))}
		</div>
	)
}
