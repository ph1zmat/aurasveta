import Link from 'next/link'
import { Check } from 'lucide-react'

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
}

export default function ProductPriceBlock({
	price,
	oldPrice,
	discountPercent,
	bonusAmount,
	isOriginal = true,
	availability,
	primaryAction = { label: 'УТОЧНИТЬ НАЛИЧИЕ', href: '#' },
	secondaryAction = { label: 'ПОСМОТРЕТЬ АНАЛОГИ', href: '#' },
	foundCheaper = true,
}: ProductPriceBlockProps) {
	return (
		<div className='rounded-sm border border-border bg-card p-6'>
			{/* Original badge */}
			{isOriginal && (
				<span className='mb-4 inline-flex items-center gap-1 rounded-sm border border-border px-3 py-1 text-xs font-medium text-foreground'>
					Оригинальный товар
					<Check className='h-3.5 w-3.5 text-primary' strokeWidth={2} />
				</span>
			)}

			{/* Price row */}
			<div className='mb-2 flex items-center justify-between'>
				<div className='flex items-baseline gap-3'>
					<span className='text-3xl font-bold text-foreground'>
						{price.toLocaleString('ru-RU')} ₽
					</span>
					{oldPrice && (
						<span className='text-base text-muted-foreground line-through'>
							{oldPrice.toLocaleString('ru-RU')} ₽
						</span>
					)}
				</div>
				{discountPercent && bonusAmount ? (
					<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-foreground'>
						{discountPercent}%
						<span className='font-bold'>
							{bonusAmount.toLocaleString('ru-RU')}
						</span>
						<span className='text-primary'>₽</span>
					</span>
				) : null}
			</div>

			{/* Found cheaper */}
			{foundCheaper && (
				<button className='mb-4 rounded-sm border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent'>
					Нашли дешевле?
				</button>
			)}

			{/* CTA buttons */}
			<div className='space-y-3'>
				<Link
					href={primaryAction.href}
					className='block w-full rounded-sm bg-foreground py-3.5 text-center text-sm font-medium uppercase tracking-wider text-card transition-colors hover:bg-foreground/90'
				>
					{primaryAction.label}
				</Link>
				<Link
					href={secondaryAction.href}
					className='block w-full rounded-sm border border-foreground py-3.5 text-center text-sm font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-card'
				>
					{secondaryAction.label}
				</Link>
			</div>

			{/* Availability */}
			{availability && (
				<p className='mt-4 flex items-center gap-2 text-sm text-muted-foreground'>
					<Check className='h-4 w-4 text-muted-foreground' strokeWidth={1.5} />
					{availability}
				</p>
			)}
		</div>
	)
}
