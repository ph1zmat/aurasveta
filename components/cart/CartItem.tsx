'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import type { CartItemData } from '@/types/cart'

export type { CartItemData }

interface CartItemProps {
	item: CartItemData
	onQuantityChange?: (id: string, qty: number) => void
	onRemove?: (id: string) => void
}

export default function CartItem({
	item,
	onQuantityChange,
	onRemove,
}: CartItemProps) {
	return (
		<div className='flex items-start gap-4 border-b border-border py-6'>
			{/* Thumbnail */}
			<Link href={item.href} className='relative h-24 w-20 shrink-0'>
				<Image
					src={item.image}
					alt={item.name}
					fill
					className='object-contain'
				/>
			</Link>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<Link
					href={item.href}
					className='text-sm font-medium text-primary transition-colors hover:text-foreground'
				>
					{item.name}
				</Link>

				{item.assemblyOption && (
					<label className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
						<input
							type='checkbox'
							defaultChecked={item.assemblyChecked}
							className='h-3.5 w-3.5 rounded-sm border border-border accent-primary'
						/>
						{item.assemblyOption}
					</label>
				)}
			</div>

			{/* Quantity controls */}
			<div className='flex items-center gap-0 shrink-0'>
				<button
					onClick={() =>
						onQuantityChange?.(item.id, Math.max(1, item.quantity - 1))
					}
					className='flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Уменьшить'
				>
					<Minus className='h-3.5 w-3.5' strokeWidth={1.5} />
				</button>
				<span className='flex h-8 w-8 items-center justify-center text-sm font-medium text-foreground'>
					{item.quantity}
				</span>
				<button
					onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
					className='flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground'
					aria-label='Увеличить'
				>
					<Plus className='h-3.5 w-3.5' strokeWidth={1.5} />
				</button>
			</div>

			{/* Price */}
			<div className='shrink-0 text-right'>
				<p className='text-sm font-bold text-foreground'>
					{item.price.toLocaleString('ru-RU')} руб.
				</p>
				{item.oldPrice && (
					<p className='text-xs text-muted-foreground line-through'>
						{item.oldPrice.toLocaleString('ru-RU')} руб.
					</p>
				)}
			</div>

			{/* Remove */}
			<button
				onClick={() => onRemove?.(item.id)}
				className='shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground'
				aria-label='Удалить'
			>
				<X className='h-4 w-4' strokeWidth={1.5} />
			</button>
		</div>
	)
}
