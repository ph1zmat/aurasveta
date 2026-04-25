import { forwardRef, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

/**
 * Маппинг старых input → новая система:
 *
 * DEFAULT (стандартное текстовое поле):
 *   <Input variant="default" />  — CouponForm (rounded-sm, border-border, focus:border-ring)
 *
 * SEARCH (поле поиска с иконкой):
 *   <Input variant="search" />   — Header search (rounded-4xl, border-input, focus:ring-2)
 */

const inputVariants = cva(
	'w-full text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-[180ms] ease-out placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
					'rounded-md border border-border bg-background px-3 py-2.5 focus:border-[rgba(198,106,43,0.6)] focus:shadow-[0_0_0_3px_rgba(198,106,43,0.18)]',
				search:
					'rounded-full border border-input bg-muted py-2.5 pl-10 pr-4 focus:shadow-[0_0_0_3px_rgba(198,106,43,0.18)] focus:outline-none',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

interface InputProps
	extends
		Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
		VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<input
				className={cn(inputVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Input.displayName = 'Input'

export { Input, inputVariants }
export type { InputProps }
