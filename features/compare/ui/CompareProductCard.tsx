import Image from 'next/image'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

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
		<div className={cn('flex flex-col', className)}>
			{/* Actions — heart + remove */}
			<div className='mb-2 flex items-center justify-end gap-1'>
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
			<Link href={href} className='relative mb-3 block h-40 w-full'>
				<Image src={image} alt={name} fill className='object-contain' />
			</Link>

			{/* Name */}
			<Link href={href} className='mb-2'>
				<h3 className='line-clamp-2 text-sm tracking-wide text-foreground transition-colors hover:text-primary'>
					{name}
				</h3>
			</Link>

			{/* Price */}
			<div className='mb-4 flex flex-wrap items-center gap-2'>
				<span
					className={cn(
						'text-base font-semibold',
						hasDiscount ? 'text-primary' : 'text-foreground',
					)}
				>
					{price.toLocaleString('ru-RU')} руб.
				</span>
				{hasDiscount && (
					<span className='text-sm text-muted-foreground line-through'>
						{oldPrice.toLocaleString('ru-RU')} руб.
					</span>
				)}
			</div>

			{/* CTA */}
			<Button
				variant='primary'
				size='xs'
				fullWidth
				className='mt-auto py-3'
				onClick={onAddToCart}
				disabled={cartButtonDisabled}
			>
				{cartButtonLabel}
			</Button>
		</div>
	)
}
