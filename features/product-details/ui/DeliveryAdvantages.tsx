import { Truck, ShieldCheck, RotateCcw, CreditCard } from 'lucide-react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
	Truck,
	ShieldCheck,
	RotateCcw,
	CreditCard,
}

export type DeliveryAdvantage = {
	icon: string
	title: string
	description: string
}

const DEFAULT_ADVANTAGES: DeliveryAdvantage[] = [
	{
		icon: 'Truck',
		title: 'Доставка по Москве от 3 000 руб. - бесплатно',
		description: 'Доставим товар прямо до двери в удобное для вас время.',
	},
	{
		icon: 'ShieldCheck',
		title: 'Расширенная гарантия',
		description: '18 месяцев гарантия от поставщика + 12 месяцев от магазина DonPlafon',
	},
	{
		icon: 'RotateCcw',
		title: 'Увеличенный срок возврата',
		description: 'Примем товар в течение 35 дней',
	},
	{
		icon: 'CreditCard',
		title: 'Оплата с помощью бонусов СберСпасибо',
		description: 'Оплачивайте до 99% стоимости в обмен на бонусы СберСпасибо',
	},
]

function parseAdvantages(dbValue: unknown): DeliveryAdvantage[] {
	if (!Array.isArray(dbValue) || dbValue.length === 0) return DEFAULT_ADVANTAGES
	const parsed = dbValue.filter(
		(item): item is DeliveryAdvantage =>
			typeof item === 'object' &&
			item !== null &&
			typeof (item as DeliveryAdvantage).title === 'string' &&
			typeof (item as DeliveryAdvantage).description === 'string',
	)
	return parsed.length > 0 ? parsed : DEFAULT_ADVANTAGES
}

interface DeliveryAdvantagesProps {
	dbValue?: unknown
}

export default function DeliveryAdvantages({ dbValue }: DeliveryAdvantagesProps) {
	const advantages = parseAdvantages(dbValue)

	return (
		<div className='grid grid-cols-1 gap-4 py-6 px-4 sm:grid-cols-2 bg-muted rounded-[20px]'>
			{advantages.map((adv, idx) => {
				const Icon = ICON_MAP[adv.icon] ?? Truck
				return (
					<div
						key={`${adv.title}-${idx}`}
						className='flex gap-3 rounded-sm px-2 py-3 transition-colors'
					>
						<Icon
							className='mt-0.5 h-5 w-5 shrink-0 text-primary'
							strokeWidth={1.5}
						/>
						<div>
							<Link
								href='#'
								className={cn(
									'text-sm font-normal text-primary underline underline-offset-2 transition-colors hover:text-foreground',
								)}
							>
								{adv.title}
							</Link>
							<p className='mt-1 text-xs tracking-wider text-muted-foreground leading-relaxed'>
								{adv.description}
							</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}
