import Link from 'next/link'
import { Eye, BarChart3, Heart } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'
import DeferredImage from '@/shared/ui/DeferredImage'

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
			<div className='mb-1 flex items-center gap-1'>
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

			<Link href={href} className='relative mb-3 block overflow-hidden'>
				{badges.length > 0 && (
					<div className='absolute left-2 top-2 z-10 flex flex-wrap gap-1'>
						{badges.map(badge => (
							<span
								key={badge}
								className='rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-foreground'
							>
								{badge}
							</span>
						))}
					</div>
				)}
				<div className='relative h-40 w-full sm:h-56'>
					<DeferredImage
						src={image}
						alt={name}
						fill
						imageClassName='object-contain transition-transform duration-500 group-hover:scale-105'
						fallbackClassName='bg-muted/30'
					/>
				</div>
				<div className='mt-2 h-[3px] w-12 bg-foreground' />
			</Link>

			<Link href={href} className='mb-1'>
				<h3 className='line-clamp-2 text-sm tracking-wide text-foreground transition-colors hover:text-primary'>
					{name}
				</h3>
			</Link>

			{brand && (
				<p className='mb-2 text-xs tracking-wider text-muted-foreground'>
					{brand}
				</p>
			)}

			<div className='mb-3 flex flex-wrap items-center gap-2'>
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
