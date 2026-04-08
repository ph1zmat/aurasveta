'use client'

import { BarChart3, Heart } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useCart } from '@/features/cart/useCart'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import { cn } from '@/shared/lib/utils'

interface ProductActionsProps {
	productId: string
}

export function CompareButton({ productId }: ProductActionsProps) {
	const { toggle, has } = useCompare()
	const isActive = has(productId)

	return (
		<Button
			variant='link'
			size='inline-xs'
			onClick={() => toggle(productId)}
			className={cn(isActive && 'text-primary')}
		>
			<BarChart3 className='h-3.5 w-3.5' strokeWidth={1.5} />
			{isActive ? 'В сравнении' : 'В сравнение'}
		</Button>
	)
}

export function FavoriteButton({ productId }: ProductActionsProps) {
	const { toggle, has } = useFavorites()
	const isActive = has(productId)

	return (
		<Button
			variant='icon'
			aria-label={isActive ? 'Убрать из избранного' : 'В избранное'}
			onClick={() => toggle(productId)}
		>
			<Heart
				className={cn('h-5 w-5', isActive && 'fill-foreground text-foreground')}
			/>
		</Button>
	)
}

export function AddToCartButton({
	productId,
	label = 'УТОЧНИТЬ НАЛИЧИЕ',
}: ProductActionsProps & { label?: string }) {
	const { add, has } = useCart()
	const inCart = has(productId)

	return (
		<Button
			variant='primary'
			size='lg'
			fullWidth
			onClick={() => add(productId)}
			disabled={inCart}
		>
			{inCart ? 'В КОРЗИНЕ' : label}
		</Button>
	)
}
