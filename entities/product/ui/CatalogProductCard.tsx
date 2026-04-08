import Image from 'next/image'
import Link from 'next/link'
import { Eye, BarChart3, Heart } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

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
	onToggleFavorite,
	onToggleCompare,
	onAddToCart,
}: CatalogProductCardProps) {
	return (
		<div className={cn('group relative flex flex-col', className)}>
			{/* Action icons */}
			<div className='flex items-center gap-1 mb-1'>
				<Button variant='icon' aria-label='Быстрый просмотр'>
					<Eye className='h-4 w-4' />
				</Button>
				<Button variant='icon' aria-label='Сравнить' onClick={onToggleCompare}>
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
				<h3 className='line-clamp-2 text-sm tracking-wide text-foreground hover:text-primary transition-colors'>
					{name}
				</h3>
			</Link>

			{/* Brand */}
			{brand && (
				<p className='mb-2 text-xs tracking-wider text-muted-foreground'>
					{brand}
				</p>
			)}

			{/* Price row */}
			<div className='mb-3 flex items-center gap-2 flex-wrap'>
				<span className='text-lg font-semibold text-foreground'>
					{price.toLocaleString('ru-RU')} ₽
				</span>
				{discountPercent && bonusAmount ? (
					<span className='inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground'>
						{discountPercent}%
						<span className='font-semibold'>
							{bonusAmount.toLocaleString('ru-RU')}
						</span>
						<span className='text-primary'>₽</span>
					</span>
				) : null}
			</div>

			{/* Button + Stock */}
			<div className='mt-auto flex items-center gap-3'>
				{onAddToCart ? (
					<Button
						variant={buttonLabel === 'УТОЧНИТЬ' ? 'outline' : 'primary'}
						size='xs'
						onClick={onAddToCart}
					>
						{buttonLabel}
					</Button>
				) : (
					<Button
						asChild
						variant={buttonLabel === 'УТОЧНИТЬ' ? 'outline' : 'primary'}
						size='xs'
					>
						<Link href={href}>{buttonLabel}</Link>
					</Button>
				)}
				{inStock && <span className='text-xs text-primary'>{inStock}</span>}
			</div>
		</div>
	)
}
