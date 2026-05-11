import { cn } from '@/shared/lib/utils'

interface UnderlineAnimationProps {
	children: React.ReactNode
	className?: string
	lineClassName?: string
}

export default function UnderlineAnimation({
	children,
	className,
	lineClassName,
}: UnderlineAnimationProps) {
	return (
		<span className={cn('group relative inline-flex', className)}>
			{children}
			<span
				className={cn(
					'absolute bottom-0 left-0 h-[2px] w-full origin-center scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100',
					lineClassName,
				)}
			/>
		</span>
	)
}
