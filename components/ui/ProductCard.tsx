import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
			<div className='relative mb-3 h-40 w-full rounded z-10'>
				<Image
					src={image}
					alt={name}
					fill
					className='object-contain transition-transform group-hover:scale-115 duration-1000'
				/>
			</div>

			<h3 className='mb-2 line-clamp-2 text-center text-sm text-foreground z-10'>
				{name}
			</h3>

			<div className='flex items-center gap-2 z-10'>
				<span
					className={cn(
						'font-medium',
						hasDiscount ? 'text-destructive' : 'text-foreground',
					)}
				>
					{price.toLocaleString('ru-RU')} ₽
				</span>
				{hasDiscount && (
					<span className='text-sm text-muted-foreground line-through'>
						{oldPrice.toLocaleString('ru-RU')} ₽
					</span>
				)}
			</div>
		</Link>
	)
}
