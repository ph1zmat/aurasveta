import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { formatPriceBYN } from '@/shared/lib/currency'
import DeferredImage from '@/shared/ui/deferredimage'

export interface ProductCardProps {
	name: string
	href: string
	image: string
	price: number
	oldPrice?: number
	className?: string
}

export default function ProductCard({
	name,
	href,
	image,
	price,
	oldPrice,
	className,
}: ProductCardProps) {
	const hasDiscount = oldPrice && oldPrice > price

	return (
		<Link
			href={href}
			className={cn(
				'group relative flex flex-col items-center p-4 ',
				className,
			)}
		>
			<div className='relative mb-3 h-40 w-full rounded-sm z-10'>
				<DeferredImage
					src={image}
					alt={name}
					fill
					imageClassName='object-contain transition-transform group-hover:scale-115 duration-1000'
					fallbackClassName='rounded-sm'
				/>
			</div>

			<h3 className='mb-2 line-clamp-2 text-center text-sm tracking-wide text-foreground z-10'>
				{name}
			</h3>

			<div className='flex items-center gap-2 z-10'>
				<span
					className={cn(
						'font-medium',
						hasDiscount ? 'text-destructive' : 'text-foreground',
					)}
				>
					{formatPriceBYN(price)}
				</span>
				{hasDiscount && (
					<span className='text-sm text-muted-foreground line-through'>
						{formatPriceBYN(oldPrice)}
					</span>
				)}
			</div>
		</Link>
	)
}
