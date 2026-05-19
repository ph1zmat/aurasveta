import { formatPriceBYN, formatPriceBYNAmount } from '@/shared/lib/currency'
import { cn } from '@/shared/lib/utils'
import { BynCurrencyIcon } from '@/shared/ui/byncurrencyicon'
import type { ComponentPropsWithoutRef } from 'react'

interface PriceBYNProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
	value: number
	amountClassName?: string
	iconClassName?: string
}

export function PriceBYN({
	value,
	className,
	amountClassName,
	iconClassName,
	...props
}: PriceBYNProps) {
	return (
		<span
			className={cn('inline-flex items-baseline gap-1 whitespace-nowrap', className)}
			aria-label={formatPriceBYN(value)}
			{...props}
		>
			<span className={amountClassName}>{formatPriceBYNAmount(value)}</span>
			<BynCurrencyIcon className={cn('h-[0.86em] w-[0.86em] opacity-85', iconClassName)} />
		</span>
	)
}
