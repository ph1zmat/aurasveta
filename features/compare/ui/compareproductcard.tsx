import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import DeferredImage from '@/shared/ui/deferredimage'
import { PriceBYN } from '@/shared/ui/pricebyn'

export interface CompareProductCardProps {
	name: string
	href: string
	image: string
	price: number
	oldPrice?: number
	className?: string
	onRemove?: () => void
	onToggleFavorite?: () => void
	isFavorite?: boolean
	isInCart?: boolean
	onAddToCart?: () => void
}

export default function CompareProductCard({
	name,
	href,
	image,
	price,
	oldPrice,
	className,
	onRemove,
	onToggleFavorite,
	isFavorite,
	isInCart,
	onAddToCart,
}: CompareProductCardProps) {
	const hasDiscount = oldPrice !== undefined && oldPrice > price
	const cartButtonLabel = isInCart ? 'В КОРЗИНЕ' : 'В корзину'
	const cartButtonDisabled = Boolean(isInCart)

	return (
		<div className={cn('group flex flex-col', className)}>
			{/* Actions — heart + remove */}
			<div className='mb-1 flex items-center gap-1'>
				<Button
					variant='icon'
					aria-label='В избранное'
					onClick={onToggleFavorite}
				>
					<Heart
						className={cn(
							'h-4 w-4',
							isFavorite && 'fill-foreground text-foreground',
						)}
					/>
				</Button>
				<Button
					variant='icon'
					aria-label='Удалить из сравнения'
					onClick={onRemove}
				>
					<X className='h-4 w-4' />
				</Button>
			</div>

			{/* Image */}
			<Link href={href} className='relative mb-3 block overflow-hidden'>
				<div className='relative h-40 w-full sm:h-56'>
					<DeferredImage
						src={image}
						alt={name}
						fill
						imageClassName='object-cover transition-transform duration-500 group-hover:scale-105'
						fallbackClassName='bg-muted/30'
					/>
				</div>
				<div className='mt-2 h-[3px] w-12 bg-foreground' />
			</Link>

			{/* Name */}
			<Link href={href} className='mb-1'>
				<h3 className='line-clamp-2 text-sm tracking-wide text-foreground transition-colors hover:text-primary'>
					{name}
				</h3>
			</Link>

			{/* Price */}
			<div className='mb-4 flex flex-wrap items-center gap-2'>
				<PriceBYN
					value={price}
					className={cn(
						'text-lg font-semibold',
						hasDiscount ? 'text-destructive' : 'text-foreground',
					)}
				/>
				{hasDiscount && (
					<PriceBYN
						value={oldPrice}
						className='text-sm text-muted-foreground line-through'
					/>
				)}
			</div>

			{/* CTA */}
			<Button
				variant='primary'
				size='xs'
				className='mt-auto w-full sm:w-auto'
				onClick={onAddToCart}
				disabled={cartButtonDisabled}
			>
				{cartButtonLabel}
			</Button>
		</div>
	)
}
