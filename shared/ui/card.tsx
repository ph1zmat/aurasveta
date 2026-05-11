import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

/**
 * Маппинг старых card-like контейнеров → новая система:
 *
 * DEFAULT (информационный блок):
 *   <Card>                                — ProductPriceBlock, CartSummary, CouponForm (border bg-card p-6)
 *   <Card padding="compact">             — QuickSpecs (border bg-card p-4)
 *
 * BANNER (цветной фон без border):
 *   <Card variant="banner">              — DesignProjectBanner (bg-destructive/10 px-6 py-4)
 *
 * PRODUCT (flex-col контейнер для карточек товаров):
 *   <Card variant="product">             — CatalogProductCard, FavoriteProductCard (group flex flex-col)
 */

const cardVariants = cva('rounded-lg', {
	variants: {
		variant: {
			default: 'border border-border bg-card',
			banner: 'bg-destructive/10',
			product: 'group relative flex flex-col',
		},
		padding: {
			default: 'p-6',
			compact: 'p-4',
			banner: 'px-6 py-4',
			none: '',
		},
	},
	defaultVariants: {
		variant: 'default',
		padding: 'default',
	},
})

interface CardProps
	extends HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, padding, ...props }, ref) => {
		return (
			<div
				className={cn(cardVariants({ variant, padding, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Card.displayName = 'Card'

export { Card, cardVariants }
export type { CardProps }
