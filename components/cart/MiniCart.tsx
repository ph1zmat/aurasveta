'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { CartItemData } from '@/types/cart'

interface MiniCartProps {
	items: CartItemData[]
	onQuantityChange?: (id: string, qty: number) => void
	onRemove?: (id: string) => void
}

export default function MiniCart({
	items,
	onQuantityChange,
	onRemove,
}: MiniCartProps) {
	const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

	if (items.length === 0) {
		return (
			<div className='p-6 text-center text-sm text-muted-foreground'>
				Корзина пуста
			</div>
		)
	}

	return (
		<div className='flex flex-col'>
			{/* Items list */}
			<div className='max-h-80 overflow-y-auto divide-y divide-border'>
				{items.map(item => (
					<div key={item.id} className='flex items-start gap-3 p-4'>
						{/* Thumbnail */}
						<Link href={item.href} className='relative h-18 w-14 shrink-0'>
							<Image
								src={item.image}
								alt={item.name}
								fill
								className='object-contain'
							/>
						</Link>

						{/* Name + price */}
						<div className='min-w-0 flex-1'>
							<Link
								href={item.href}
								className='line-clamp-2 text-xs font-medium text-foreground transition-colors hover:text-primary leading-tight'
							>
								{item.name}
							</Link>
							<div className='mt-1'>
								<span className='text-sm font-bold text-foreground'>
									{item.price.toLocaleString('ru-RU')} руб.
								</span>
								{item.oldPrice && (
									<span className='ml-2 text-xs text-muted-foreground line-through'>
										{item.oldPrice.toLocaleString('ru-RU')} руб.
									</span>
								)}
							</div>
						</div>

						{/* Quantity controls */}
						<div className='flex items-center gap-0 shrink-0'>
							<Button
								variant='icon'
								size='icon-sm'
								onClick={() =>
									onQuantityChange?.(item.id, Math.max(1, item.quantity - 1))
								}
								className='h-7 w-7'
								aria-label='Уменьшить'
							>
								<Minus className='h-3 w-3' strokeWidth={1.5} />
							</Button>
							<span className='flex h-7 w-6 items-center justify-center text-xs font-medium text-foreground'>
								{item.quantity}
							</span>
							<Button
								variant='icon'
								size='icon-sm'
								onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
								className='h-7 w-7'
								aria-label='Увеличить'
							>
								<Plus className='h-3 w-3' strokeWidth={1.5} />
							</Button>
						</div>

						{/* Remove */}
						<Button
							variant='icon'
							size='icon-sm'
							onClick={() => onRemove?.(item.id)}
							className='h-6 w-6 shrink-0'
							aria-label='Удалить'
						>
							<X className='h-3.5 w-3.5' strokeWidth={1.5} />
						</Button>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className='border-t border-border p-4 space-y-3'>
				{/* Total */}
				<div className='flex items-center justify-between'>
					<span className='text-sm font-medium text-foreground'>Итого:</span>
					<span className='text-sm font-bold text-foreground'>
						{total.toLocaleString('ru-RU')} руб.
					</span>
				</div>

				{/* Actions */}
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						fullWidth
						className='text-xs uppercase tracking-wider'
					>
						Купить в 1 клик
					</Button>
					<Button
						variant='primary'
						size='sm'
						fullWidth
						asChild
						className='text-xs uppercase tracking-wider'
					>
						<Link href='/cart'>Перейти в корзину</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
