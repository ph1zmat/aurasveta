import { Truck, ShieldCheck, RotateCcw, CreditCard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
		title: 'Мозырь — бесплатно, Беларусь — бесплатно от 400 BYN',
		description:
			'По Беларуси для заказов до 400 BYN стоимость доставки составляет 100 BYN.',
	},
	{
		icon: 'ShieldCheck',
		title: 'Расширенная гарантия',
		description:
			'18 месяцев гарантия от поставщика + 12 месяцев от магазина Аура Света',
	},
	{
		icon: 'RotateCcw',
		title: 'Увеличенный срок возврата',
		description: 'Примем товар в течение 35 дней',
	},
	{
		icon: 'CreditCard',
		title: 'Оплата картой и онлайн',
		description:
			'Оплачивайте заказ банковской картой или наличными при получении',
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

export default function DeliveryAdvantages({
	dbValue,
}: DeliveryAdvantagesProps) {
	const advantages = parseAdvantages(dbValue)

	return (
		<div className='rounded-[24px] border border-border bg-card/50'>
			<div className='border-b border-border px-4 py-3'>
				<p className='text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					Условия
				</p>
			</div>
			<div className='grid grid-cols-1 sm:grid-cols-2'>
				{advantages.map((adv, idx) => {
					const Icon = ICON_MAP[adv.icon] ?? Truck
					return (
						<div
							key={`${adv.title}-${idx}`}
							className='flex gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:nth-last-[-n+2]:border-b-0'
						>
							<Icon
								className='mt-0.5 h-4 w-4 shrink-0 text-primary'
								strokeWidth={1.5}
							/>
							<div>
								<p className='text-sm font-medium leading-5 text-foreground'>
									{adv.title}
								</p>
								<p className='mt-0.5 text-xs leading-5 text-muted-foreground'>
									{adv.description}
								</p>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
