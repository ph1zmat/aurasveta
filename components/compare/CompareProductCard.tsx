import Image from 'next/image'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export interface CompareProductCardProps {
	name: string
	href: string
	image: string
	price: number
	oldPrice?: number
	className?: string
}

export default function CompareProductCard({
	name,
	href,
	image,
	price,
	oldPrice,
	className,
}: CompareProductCardProps) {
	const hasDiscount = oldPrice !== undefined && oldPrice > price

	return (
		<div className={cn('flex flex-col', className)}>
			{/* Actions — heart + remove */}
			<div className='mb-2 flex items-center justify-end gap-1'>
				<Button variant='icon' aria-label='В избранное'>
					<Heart className='h-4 w-4' />
				</Button>
				<Button variant='icon' aria-label='Удалить из сравнения'>
					<X className='h-4 w-4' />
				</Button>
			</div>

			{/* Image */}
			<Link href={href} className='relative mb-3 block h-40 w-full'>
				<Image src={image} alt={name} fill className='object-contain' />
			</Link>

			{/* Name */}
			<Link href={href} className='mb-2'>
				<h3 className='line-clamp-2 text-sm text-foreground transition-colors hover:text-primary'>
					{name}
				</h3>
			</Link>

			{/* Price */}
			<div className='mb-4 flex flex-wrap items-center gap-2'>
				<span
					className={cn(
						'text-base font-bold',
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
			<Button asChild variant='primary' size='xs' fullWidth className='mt-auto py-3'>
				<Link href={href}>В корзину</Link>
			</Button>
		</div>
	)
}
