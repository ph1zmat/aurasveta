import Link from 'next/link'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface CartSummaryProps {
	itemsCount: number
	subtotal: number
	discount: number
	deliveryLabel?: string
	bonusAmount?: number
}

export default function CartSummary({
	itemsCount,
	subtotal,
	discount,
	deliveryLabel = 'Бесплатно',
	bonusAmount,
}: CartSummaryProps) {
	const total = subtotal - discount

	return (
		<Card>
			<h2 className='mb-6 text-lg font-bold uppercase tracking-wider text-foreground'>
				Ваша корзина
			</h2>

			{/* Lines */}
			<div className='space-y-3 text-sm'>
				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Товары ({itemsCount})</span>
					<span className='text-foreground'>
						{subtotal.toLocaleString('ru-RU')} руб.
					</span>
				</div>

				{discount > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-muted-foreground'>Скидка</span>
						<span className='text-primary'>
							- {discount.toLocaleString('ru-RU')} руб.
						</span>
					</div>
				)}

				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Доставка</span>
					<span className='text-foreground'>{deliveryLabel}</span>
				</div>
			</div>

			{/* Total */}
			<div className='mt-4 flex items-center justify-between border-t border-border pt-4'>
				<span className='text-base font-bold uppercase text-foreground'>
					Итого
				</span>
				<span className='text-lg font-bold text-foreground'>
					{total.toLocaleString('ru-RU')} РУБ.
				</span>
			</div>

			{/* Bonus */}
			{bonusAmount && (
				<div className='mt-3 flex items-center justify-between text-sm'>
					<span className='flex items-center gap-1 text-muted-foreground'>
						Вернется бонусами
						<Info className='h-3.5 w-3.5' strokeWidth={1.5} />
					</span>
					<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-foreground'>
						{bonusAmount.toLocaleString('ru-RU')}
						<span className='text-primary'>₽</span>
					</span>
				</div>
			)}

			{/* CTA */}
			<Button asChild variant='primary' size='lg' fullWidth className='mt-6'>
				<Link href='/checkout'>
					Перейти к оформлению
				</Link>
			</Button>

			<p className='mt-4 text-xs leading-relaxed text-muted-foreground'>
				Способ и время доставки можно выбрать на следующем шаге
			</p>
		</Card>
	)
}
