import { forwardRef, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

/**
 * Маппинг старых checkbox → новая система:
 *
 * DEFAULT (стандартный, как в FilterSection):
 *   <Checkbox size="default" />  — h-4 w-4, bg-card, focus:ring-ring
 *
 * SM (компактный, как assembly checkbox в CartItem):
 *   <Checkbox size="sm" />       — h-3.5 w-3.5, без bg/focus
 */

const checkboxVariants = cva('rounded-xs border border-border accent-primary', {
	variants: {
		size: {
			sm: 'h-3.5 w-3.5',
			default:
				'h-4 w-4 bg-card text-primary focus:ring-1 focus:ring-ring',
		},
	},
	defaultVariants: {
		size: 'default',
	},
})

interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
		VariantProps<typeof checkboxVariants> {}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, size, ...props }, ref) => {
		return (
			<input
				type='checkbox'
				className={cn(checkboxVariants({ size, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Checkbox.displayName = 'Checkbox'

export { Checkbox, checkboxVariants }
export type { CheckboxProps }
