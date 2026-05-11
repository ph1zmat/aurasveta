interface CountBadgeProps {
	count: number
	className?: string
}

export default function CountBadge({ count, className }: CountBadgeProps) {
	if (count <= 0) return null

	return (
		<span
			className={
				'absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground' +
				(className ? ` ${className}` : '')
			}
		>
			{count > 99 ? '99+' : count}
		</span>
	)
}
