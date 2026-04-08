'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import type { CartItemData } from '@/entities/cart/model/types'

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
		<div className='border-b border-border py-4 md:py-6'>
			{/* Mobile: remove button top-right */}
			<div className='flex items-start gap-3 md:gap-4'>
				{/* Thumbnail */}
				<Link
					href={item.href}
					className='relative h-20 w-16 shrink-0 md:h-24 md:w-20'
				>
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
							<Checkbox size='sm' defaultChecked={item.assemblyChecked} />
							{item.assemblyOption}
						</label>
					)}

					{/* Mobile: price + quantity inline */}
					<div className='mt-3 flex items-center justify-between md:hidden'>
						<div className='flex items-center gap-0'>
							<Button
								variant='icon'
								size='icon-sm'
								onClick={() =>
									onQuantityChange?.(item.id, Math.max(1, item.quantity - 1))
								}
								className='h-8 w-8'
								aria-label='Уменьшить'
							>
								<Minus className='h-3.5 w-3.5' strokeWidth={1.5} />
							</Button>
							<span className='flex h-8 w-8 items-center justify-center text-sm font-medium text-foreground'>
								{item.quantity}
							</span>
							<Button
								variant='icon'
								size='icon-sm'
								onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
								className='h-8 w-8'
								aria-label='Увеличить'
							>
								<Plus className='h-3.5 w-3.5' strokeWidth={1.5} />
							</Button>
						</div>

						<div className='text-right'>
							<p className='text-sm font-semibold tracking-wide text-foreground'>
								{item.price.toLocaleString('ru-RU')} руб.
							</p>
							{item.oldPrice && (
								<p className='text-xs tracking-wider text-muted-foreground line-through'>
									{item.oldPrice.toLocaleString('ru-RU')} руб.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Desktop: Quantity + Price + Remove (hidden on mobile) */}
				<div className='hidden items-center gap-0 shrink-0 md:flex'>
					<Button
						variant='icon'
						size='icon-sm'
						onClick={() =>
							onQuantityChange?.(item.id, Math.max(1, item.quantity - 1))
						}
						className='h-8 w-8'
						aria-label='Уменьшить'
					>
						<Minus className='h-3.5 w-3.5' strokeWidth={1.5} />
					</Button>
					<span className='flex h-8 w-8 items-center justify-center text-sm font-medium text-foreground'>
						{item.quantity}
					</span>
					<Button
						variant='icon'
						size='icon-sm'
						onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
						className='h-8 w-8'
						aria-label='Увеличить'
					>
						<Plus className='h-3.5 w-3.5' strokeWidth={1.5} />
					</Button>
				</div>

				{/* Desktop: Price */}
				<div className='hidden shrink-0 text-right md:block'>
					<p className='text-sm font-semibold tracking-wide text-foreground'>
						{item.price.toLocaleString('ru-RU')} руб.
					</p>
					{item.oldPrice && (
						<p className='text-xs tracking-wider text-muted-foreground line-through'>
							{item.oldPrice.toLocaleString('ru-RU')} руб.
						</p>
					)}
				</div>

				{/* Remove */}
				<Button
					variant='icon'
					size='icon-sm'
					onClick={() => onRemove?.(item.id)}
					className='shrink-0'
					aria-label='Удалить'
				>
					<X className='h-4 w-4' strokeWidth={1.5} />
				</Button>
			</div>
		</div>
	)
}
