import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import DeferredImage from '@/shared/ui/deferredimage'
import { PriceBYN } from '@/shared/ui/pricebyn'

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
				'group relative flex flex-col rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-md',
				className,
			)}
		>
			{/* Image */}
			<div className='relative overflow-hidden rounded-t-2xl'>
				<div className='relative h-40 w-full overflow-hidden bg-background sm:h-52'>
					<DeferredImage
						src={image}
						alt={name}
						fill
						imageClassName='object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]'
						fallbackClassName='rounded-t-2xl'
					/>
					{hasDiscount ? (
						<span className='absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground'>
							-{Math.round(((oldPrice - price) / oldPrice) * 100)}%
						</span>
					) : null}
				</div>
			</div>

			{/* Body */}
			<div className='flex flex-1 flex-col gap-1.5 p-3'>
				<h3 className='line-clamp-2 text-sm leading-5 tracking-wide text-foreground transition-colors group-hover:text-primary'>
					{name}
				</h3>

				<div className='mt-auto flex flex-wrap items-baseline gap-2 pt-1'>
					<PriceBYN
						value={price}
						className='text-lg font-semibold text-foreground'
					/>
					{hasDiscount && (
						<PriceBYN
							value={oldPrice}
							className='text-sm text-muted-foreground line-through'
						/>
					)}
				</div>
			</div>
		</Link>
	)
}
