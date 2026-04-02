import Image from 'next/image'
import Link from 'next/link'
import { Eye, BarChart3, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CatalogProductCardProps {
	name: string
	href: string
	image: string
	brand?: string
	price: number
	oldPrice?: number
	discountPercent?: number
	bonusAmount?: number
	badges?: string[]
	inStock?: string
	buttonLabel?: string
	className?: string
}

export default function CatalogProductCard({
	name,
	href,
	image,
	brand,
	price,
	oldPrice,
	discountPercent,
	bonusAmount,
	badges = [],
	inStock,
	buttonLabel = 'В КОРЗИНУ',
	className,
}: CatalogProductCardProps) {
	return (
		<div className={cn('group relative flex flex-col', className)}>
			{/* Action icons */}
			<div className='flex items-center gap-1 mb-1'>
				<button
					className='p-1 text-muted-foreground hover:text-foreground transition-colors'
					aria-label='Быстрый просмотр'
				>
					<Eye className='h-4 w-4' />
				</button>
				<button
					className='p-1 text-muted-foreground hover:text-foreground transition-colors'
					aria-label='Сравнить'
				>
					<BarChart3 className='h-4 w-4' />
				</button>
				<button
					className='p-1 text-muted-foreground hover:text-foreground transition-colors'
					aria-label='В избранное'
				>
					<Heart className='h-4 w-4' />
				</button>
			</div>

			{/* Image + Badges */}
			<Link href={href} className='relative block overflow-hidden mb-3'>
				{badges.length > 0 && (
					<div className='absolute top-2 left-2 z-10 flex flex-wrap gap-1'>
						{badges.map(badge => (
							<span
								key={badge}
								className='rounded-sm bg-card border border-border px-2 py-0.5 text-[10px] font-medium text-foreground'
							>
								{badge}
							</span>
						))}
					</div>
				)}
				<div className='relative h-56 w-full'>
					<Image
						src={image}
						alt={name}
						fill
						className='object-contain transition-transform duration-500 group-hover:scale-105'
					/>
				</div>
				{/* Color indicator line */}
				<div className='mt-2 h-[3px] w-12 bg-foreground' />
			</Link>

			{/* Name */}
			<Link href={href} className='mb-1'>
				<h3 className='line-clamp-2 text-sm text-foreground hover:text-primary transition-colors'>
					{name}
				</h3>
			</Link>

			{/* Brand */}
			{brand && <p className='mb-2 text-xs text-muted-foreground'>{brand}</p>}

			{/* Price row */}
			<div className='mb-3 flex items-center gap-2 flex-wrap'>
				<span className='text-lg font-bold text-foreground'>
					{price.toLocaleString('ru-RU')} ₽
				</span>
				{discountPercent && bonusAmount ? (
					<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground'>
						{discountPercent}%
						<span className='font-bold'>
							{bonusAmount.toLocaleString('ru-RU')}
						</span>
						<span className='text-primary'>₽</span>
					</span>
				) : null}
			</div>

			{/* Button + Stock */}
			<div className='mt-auto flex items-center gap-3'>
				<Link
					href={href}
					className={cn(
						'rounded-sm px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
						buttonLabel === 'УТОЧНИТЬ'
							? 'border border-foreground text-foreground hover:bg-foreground hover:text-card'
							: 'bg-foreground text-card hover:bg-foreground/90',
					)}
				>
					{buttonLabel}
				</Link>
				{inStock && <span className='text-xs text-primary'>{inStock}</span>}
			</div>
		</div>
	)
}
