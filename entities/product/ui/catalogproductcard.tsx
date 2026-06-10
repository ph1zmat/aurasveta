import Link from 'next/link'
import { BarChart3, Heart } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import DeferredImage from '@/shared/ui/deferredimage'
import { PriceBYN } from '@/shared/ui/pricebyn'

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
	productId?: string
	isFavorite?: boolean
	isCompare?: boolean
	isInCart?: boolean
	onToggleFavorite?: () => void
	onToggleCompare?: () => void
	onAddToCart?: () => void
}

export default function CatalogProductCard({
	name,
	href,
	image,
	brand,
	price,
	discountPercent,
	bonusAmount,
	badges = [],
	inStock,
	buttonLabel = 'В КОРЗИНУ',
	className,
	isFavorite,
	isCompare,
	isInCart,
	onToggleFavorite,
	onToggleCompare,
	onAddToCart,
}: CatalogProductCardProps) {
	const cartButtonLabel = isInCart ? 'В КОРЗИНЕ' : buttonLabel
	const cartButtonDisabled = Boolean(isInCart)
	const isUnavailable = buttonLabel === 'УТОЧНИТЬ'

	return (
		<div
			className={cn(
				'group relative flex flex-col rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-md',
				className,
			)}
		>
			{/* Action buttons row */}
			<div className='flex items-center gap-1 px-3 pt-3'>
				<Button
					variant='icon'
					aria-label='Сравнить'
					onClick={onToggleCompare}
					className='hidden sm:inline-flex'
				>
					<BarChart3 className={cn('h-4 w-4', isCompare && 'text-primary')} />
				</Button>
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
				{/* Discount badge */}
				{discountPercent ? (
					<span className='ml-auto inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground'>
						-{discountPercent}%
					</span>
				) : null}
			</div>

			{/* Product image */}
			<Link href={href} className='relative block overflow-hidden px-3 pt-2'>
				{badges.length > 0 && (
					<div className='absolute left-5 top-4 z-10 flex flex-wrap gap-1'>
						{badges.map(badge => (
							<span
								key={badge}
								className='rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground'
							>
								{badge}
							</span>
						))}
					</div>
				)}
				<div className='relative h-44 w-full overflow-hidden rounded-xl bg-background sm:h-52'>
					<DeferredImage
						src={image}
						alt={name}
						fill
						imageClassName='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
						fallbackClassName='rounded-xl'
					/>
				</div>
			</Link>

			{/* Card body */}
			<div className='flex flex-1 flex-col gap-2 p-3 pt-2'>
				{brand && (
					<p className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
						{brand}
					</p>
				)}

				<Link href={href}>
					<h3 className='line-clamp-2 text-sm leading-5 tracking-wide text-foreground transition-colors hover:text-primary'>
						{name}
					</h3>
				</Link>

				{/* Price row */}
				<div className='mt-auto flex flex-wrap items-center gap-2 pt-1'>
					<PriceBYN
						value={price}
						className='text-lg font-semibold text-foreground'
					/>
					{bonusAmount && !discountPercent ? (
						<PriceBYN
							value={bonusAmount}
							className='text-sm text-muted-foreground line-through'
						/>
					) : null}
				</div>

				{/* CTA */}
				<div className='flex items-center gap-2'>
					{onAddToCart ? (
						<Button
							variant={isUnavailable ? 'outline' : 'primary'}
							size='sm'
							fullWidth
							onClick={onAddToCart}
							disabled={cartButtonDisabled}
						>
							{cartButtonLabel}
						</Button>
					) : (
						<Button
							asChild
							variant={isUnavailable ? 'outline' : 'primary'}
							size='sm'
							fullWidth
						>
							<Link href={href}>{cartButtonLabel}</Link>
						</Button>
					)}
				</div>

				{/* Availability note */}
				{inStock && (
					<p className='text-[11px] tracking-wide text-primary'>{inStock}</p>
				)}
			</div>
		</div>
	)
}
