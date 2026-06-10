// import Link from 'next/link'
import { Check } from 'lucide-react'
// import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PriceBYN } from '@/shared/ui/pricebyn'
import type { ReactNode } from 'react'

interface ProductPriceBlockProps {
	price: number
	oldPrice?: number
	discountPercent?: number
	bonusAmount?: number
	isOriginal?: boolean
	availability?: string
	primaryAction?: { label: string; href: string }
	secondaryAction?: { label: string; href: string }
	foundCheaper?: boolean
	cartAction?: ReactNode
}

export default function ProductPriceBlock({
	price,
	oldPrice,
	discountPercent,
	bonusAmount,
	isOriginal = true,
	availability,
	cartAction,
	// primaryAction = { label: 'УТОЧНИТЬ НАЛИЧИЕ', href: '#' },
	// secondaryAction = { label: 'ПОСМОТРЕТЬ АНАЛОГИ', href: '#' },
	// foundCheaper = true,
}: ProductPriceBlockProps) {
	return (
		<Card className='rounded-[24px] border border-border bg-card/60 shadow-sm'>
			{/* Original badge */}
			{isOriginal && (
				<span className='mb-4 inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground'>
					Оригинальный товар
					<Check className='h-3.5 w-3.5 text-primary' strokeWidth={2} />
				</span>
			)}

			{/* Price row */}
			<div className='mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground'>
						Цена сегодня
					</p>
					<div className='flex items-baseline gap-3'>
						<PriceBYN
							value={price}
							className='text-3xl font-semibold text-foreground'
						/>
						{oldPrice && (
							<PriceBYN
								value={oldPrice}
								className='text-base text-muted-foreground line-through'
							/>
						)}
					</div>
				</div>
				{discountPercent && bonusAmount ? (
					<span className='inline-flex items-center gap-1 self-start rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground'>
						-{discountPercent}%
						<PriceBYN
							value={bonusAmount}
							className='font-semibold text-primary'
							iconClassName='text-primary opacity-100'
						/>
					</span>
				) : null}
			</div>

			{/* Found cheaper */}
			{/* {foundCheaper && (
				<Button variant='subtle' className='mb-4'>
					Нашли дешевле?
				</Button>
			)} */}

			{/* CTA: только кнопка корзины */}
			{cartAction ? (
				<div className='mt-5 border-t border-border pt-4'>{cartAction}</div>
			) : null}

			{/* Availability */}
			{availability && (
				<div className='mt-4 rounded-2xl border border-border bg-background px-3 py-3'>
					<p className='flex items-center gap-2 text-sm tracking-wide text-muted-foreground'>
						<Check className='h-4 w-4 text-primary' strokeWidth={1.5} />
						{availability}
					</p>
				</div>
			)}
		</Card>
	)
}
