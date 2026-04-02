import Image from 'next/image'
import Link from 'next/link'
import { Eye, BarChart3, Heart, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FavoriteProductCardProps {
	name: string
	href: string
	image: string
	brand?: string
	price: number
	oldPrice?: number
	discountPercent?: number
	bonusAmount?: number
	rating?: number
	reviewsCount?: number
	inStock?: string
	className?: string
}

export default function FavoriteProductCard({
	name,
	href,
	image,
	brand,
	price,
	oldPrice,
	discountPercent,
	bonusAmount,
	rating,
	reviewsCount,
	inStock,
	className,
}: FavoriteProductCardProps) {
	return (
		<div className={cn('group relative flex flex-col', className)}>
			{/* Action icons row */}
			<div className='mb-1 flex items-center gap-1'>
				<button
					className='p-1 text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Быстрый просмотр'
				>
					<Eye className='h-4 w-4' />
				</button>
				<button
					className='p-1 text-muted-foreground transition-colors hover:text-foreground'
					aria-label='В избранное'
				>
					<Heart className='h-4 w-4 fill-foreground text-foreground' />
				</button>
				<button
					className='p-1 text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Сравнить'
				>
					<BarChart3 className='h-4 w-4' />
				</button>
				<button
					className='p-1 text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Быстрый просмотр'
				>
					<Eye className='h-4 w-4' />
				</button>
				<span className='text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer'>
					Быстрый просмотр
				</span>
			</div>

			{/* Image */}
			<Link href={href} className='relative mb-3 block overflow-hidden'>
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
				<h3 className='line-clamp-2 text-sm text-foreground transition-colors hover:text-primary'>
					{name}
				</h3>
			</Link>

			{/* Brand */}
			{brand && <p className='mb-1 text-xs text-muted-foreground'>{brand}</p>}

			{/* Rating */}
			{rating != null && reviewsCount != null && (
				<div className='mb-2 flex items-center gap-1.5'>
					<Star className='h-3.5 w-3.5 fill-primary text-primary' />
					<span className='text-xs font-medium text-foreground'>{rating}</span>
					<Link
						href={`${href}#reviews`}
						className='text-xs text-foreground underline underline-offset-2 transition-colors hover:text-primary'
					>
						{reviewsCount} оценок
					</Link>
				</div>
			)}

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
					className='rounded-sm bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-card transition-colors hover:bg-foreground/90'
				>
					В корзину
				</Link>
				{inStock && <span className='text-xs text-primary'>{inStock}</span>}
			</div>
		</div>
	)
}
