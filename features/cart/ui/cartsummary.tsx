import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PriceBYN } from '@/shared/ui/pricebyn'

interface CartSummaryProps {
	itemsCount: number
	subtotal: number
	discount: number
	deliveryLabel?: string
	bonusAmount?: number
	onCheckout?: () => void
}

export default function CartSummary({
	itemsCount,
	subtotal,
	discount,
	deliveryLabel = 'Рассчитывается по адресу',
	onCheckout,
}: CartSummaryProps) {
	const total = subtotal - discount

	return (
		<Card className='rounded-4xl border border-border bg-card/60'>
			<div className='mb-5'>
				<p className='mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					Оформление
				</p>
				<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
					Ваша корзина
				</h2>
			</div>

			{/* Lines */}
			<div className='space-y-3 text-sm'>
				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Товары ({itemsCount})</span>
					<PriceBYN value={subtotal} className='text-foreground' />
				</div>

				{discount > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-muted-foreground'>Скидка</span>
						<span className='text-primary'>
							- <PriceBYN value={discount} className='text-primary' />
						</span>
					</div>
				)}

				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Доставка</span>
					<span className='max-w-[14rem] text-right text-foreground'>
						{deliveryLabel}
					</span>
				</div>
			</div>

			{/* Total */}
			<div className='mt-4 flex items-center justify-between border-t border-border pt-4'>
				<span className='text-base font-semibold uppercase text-foreground'>
					Итого
				</span>
				<PriceBYN value={total} className='text-lg font-semibold text-foreground' />
			</div>

			{/* CTA */}
			<div className='mt-6 border-t border-border pt-6'>
				<Button variant='primary' size='lg' fullWidth onClick={onCheckout}>
					Перейти к оформлению
				</Button>

				<p className='mt-4 text-xs tracking-wider leading-relaxed text-muted-foreground'>
					Точную стоимость, способ и время доставки пересчитаем после ввода адреса.
				</p>
			</div>
		</Card>
	)
}
