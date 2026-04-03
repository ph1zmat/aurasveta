import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
	label: string
	href?: string
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
	return (
		<nav aria-label='Навигация' className='py-3'>
			<ol className='flex items-center gap-1 overflow-x-auto text-xs text-muted-foreground scrollbar-hide whitespace-nowrap'>
				{items.map((item, i) => (
					<li key={i} className='flex items-center gap-1'>
						{i > 0 && <ChevronRight className='h-3 w-3' strokeWidth={1.5} />}
						{item.href ? (
							<Link
								href={item.href}
								className='transition-colors hover:text-foreground'
							>
								{item.label}
							</Link>
						) : (
							<span className='text-foreground'>{item.label}</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	)
}
