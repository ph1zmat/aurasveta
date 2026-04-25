import { cn } from '@/shared/lib/utils'

interface UnderlineAnimationProps {
	children: React.ReactNode
	className?: string
	lineClassName?: string
	/** 'default' — solid --nl-line-default colour; 'accent' — --nl-line-active (orange); 'gradient' — --nl-underline-gradient (brand) */
	variant?: 'default' | 'accent' | 'gradient'
}

export default function UnderlineAnimation({
	children,
	className,
	lineClassName,
	variant = 'default',
}: UnderlineAnimationProps) {
	const lineStyle =
		variant === 'gradient'
			? { background: 'var(--nl-underline-gradient)' }
			: variant === 'accent'
				? { background: 'var(--nl-line-active)' }
				: { background: 'var(--nl-line-default)' }

	return (
		<span className={cn('group relative inline-flex', className)}>
			{children}
			<span
				className={cn(
					'absolute bottom-0 left-0 h-[2px] w-full origin-center scale-x-0 transition-transform duration-180 ease-out group-hover:scale-x-100',
					lineClassName,
				)}
				style={lineStyle}
			/>
		</span>
	)
}
