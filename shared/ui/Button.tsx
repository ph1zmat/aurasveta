import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

/**
 * Маппинг старых кнопок → новая система:
 *
 * PRIMARY CTA (залитая):
 *   <Button variant="primary" size="xs">              — карточки товаров (px-5 py-2.5 text-xs)
 *   <Button variant="primary" size="sm">              — sticky header (px-6 py-2.5 text-xs)
 *   <Button variant="primary" size="default">         — страничные CTA (px-8 py-3 text-sm)
 *   <Button variant="primary" size="lg" fullWidth>    — полноширинные CTA (py-3.5 text-sm)
 *
 * OUTLINE CTA (рамка):
 *   <Button variant="outline" size="xs">              — карточки "УТОЧНИТЬ" (px-5 py-2.5 text-xs)
 *   <Button variant="outline" size="default">         — секции каталога (px-8 py-3 text-sm)
 *   <Button variant="outline" size="lg" fullWidth>    — ProductPriceBlock secondary (py-3.5 text-sm)
 *
 * GHOST (muted текст):
 *   <Button variant="ghost">                          — "Удалить все", "Очистить", "Поделиться"
 *
 * LINK (foreground текст, hover primary):
 *   <Button variant="link">                           — "Развернуть описание", "В сравнение"
 *
 * ICON (иконка-действие):
 *   <Button variant="icon" size="icon-sm">            — Eye/Heart/BarChart3 (p-1)
 *   <Button variant="icon" size="icon">               — carousel arrows (p-2)
 *
 * SUBTLE (мягкая рамка):
 *   <Button variant="subtle" size="compact">          — "Нашли дешевле?", "Показать еще" тэги
 *
 * CHIP (pill-форма):
 *   <Button variant="chip" size="chip">               — популярные запросы
 */

const buttonVariants = cva(
	'inline-flex items-center justify-center transition-colors disabled:pointer-events-none',
	{
		variants: {
			variant: {
				primary:
					'rounded-md bg-foreground font-medium uppercase tracking-widest text-card hover:bg-foreground/90',
				outline:
					'rounded-md border border-foreground font-medium uppercase tracking-widest text-foreground hover:bg-foreground hover:text-card',
				ghost: 'text-muted-foreground hover:text-foreground',
				link: 'font-medium text-foreground hover:text-primary disabled:text-muted-foreground',
				icon: 'text-muted-foreground hover:text-foreground disabled:opacity-30',
				subtle:
					'rounded-md border border-border text-foreground hover:bg-accent',
				chip: 'rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-card',
			},
			size: {
				xs: 'gap-2 px-5 py-2.5 text-xs',
				sm: 'gap-2 px-6 py-2.5 text-xs',
				default: 'gap-2 px-8 py-3 text-sm',
				lg: 'gap-2 py-3.5 text-sm',
				compact: 'gap-1 px-3 py-1.5 text-xs',
				'icon-sm': 'p-1',
				icon: 'p-2',
				chip: 'gap-1 px-4 py-2 text-sm',
				inline: 'gap-1 text-sm',
				'inline-xs': 'gap-1 text-xs',
			},
			fullWidth: {
				true: 'w-full',
			},
		},
		defaultVariants: {
			variant: 'primary',
		},
	},
)

function getDefaultSize(
	variant: string | null | undefined,
): VariantProps<typeof buttonVariants>['size'] {
	switch (variant) {
		case 'icon':
			return 'icon-sm'
		case 'chip':
			return 'chip'
		case 'ghost':
		case 'link':
			return 'inline'
		case 'subtle':
			return 'compact'
		default:
			return 'xs'
	}
}

interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = 'primary',
			size,
			fullWidth,
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot.Root : 'button'
		const resolvedSize = size ?? getDefaultSize(variant)

		return (
			<Comp
				className={cn(
					buttonVariants({
						variant,
						size: resolvedSize,
						fullWidth,
						className,
					}),
				)}
				ref={ref}
				{...props}
			/>
		)
	},
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
