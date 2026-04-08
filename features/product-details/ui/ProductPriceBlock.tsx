import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
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
	primaryAction = { label: 'УТОЧНИТЬ НАЛИЧИЕ', href: '#' },
	secondaryAction = { label: 'ПОСМОТРЕТЬ АНАЛОГИ', href: '#' },
	foundCheaper = true,
	cartAction,
}: ProductPriceBlockProps) {
	return (
		<Card className='bg-muted border-0 rounded-[20px]'>
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
					<span className='text-3xl font-semibold text-foreground'>
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
						<span className='font-semibold'>
							{bonusAmount.toLocaleString('ru-RU')}
						</span>
						<span className='text-primary'>₽</span>
					</span>
				) : null}
			</div>

			{/* Found cheaper */}
			{foundCheaper && (
				<Button variant='subtle' className='mb-4'>
					Нашли дешевле?
				</Button>
			)}

			{/* CTA buttons */}
			<div className='space-y-3 border-t border-border pt-4 mt-4'>
				{cartAction ?? (
					<Button asChild variant='primary' size='lg' fullWidth>
						<Link href={primaryAction.href}>{primaryAction.label}</Link>
					</Button>
				)}
				<Button asChild variant='outline' size='lg' fullWidth>
					<Link href={secondaryAction.href}>{secondaryAction.label}</Link>
				</Button>
			</div>

			{/* Availability */}
			{availability && (
				<p className='mt-4 flex items-center gap-2 text-sm tracking-wider text-muted-foreground'>
					<Check className='h-4 w-4 text-muted-foreground' strokeWidth={1.5} />
					{availability}
				</p>
			)}
		</Card>
	)
}
