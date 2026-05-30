import { cn } from '@/shared/lib/utils'

interface BynCurrencyIconProps {
	className?: string
	decorative?: boolean
}

export function BynCurrencyIcon({
	className,
	decorative = true,
}: BynCurrencyIconProps) {
	return (
		<span
			role={decorative ? undefined : 'img'}
			aria-hidden={decorative ? true : undefined}
			aria-label={decorative ? undefined : 'BYN'}
			className={cn(
				'inline-block shrink-0 bg-current h-[14px] w-[14px]',
				className,
			)}
			style={{
				maskImage: "url('/BYN.svg')",
				WebkitMaskImage: "url('/BYN.svg')",
				maskRepeat: 'no-repeat',
				WebkitMaskRepeat: 'no-repeat',
				maskPosition: 'center',
				WebkitMaskPosition: 'center',
				maskSize: 'contain',
				WebkitMaskSize: 'contain',
			}}
		/>
	)
}
