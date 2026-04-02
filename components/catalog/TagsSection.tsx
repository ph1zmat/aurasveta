import { Plus } from 'lucide-react'
import type { Tag } from '@/types/catalog'

export type { Tag }

interface TagsSectionProps {
	title: string
	tags: Tag[]
	showMore?: boolean
}

export default function TagsSection({
	title,
	tags,
	showMore = true,
}: TagsSectionProps) {
	return (
		<div className='mb-5'>
			<h3 className='mb-2 text-sm font-bold uppercase tracking-wider text-foreground'>
				{title}
			</h3>
			<div className='flex flex-wrap items-center gap-2'>
				{tags.map(tag => (
					<span
						key={tag.label}
						className='cursor-pointer rounded-sm border border-foreground bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-card'
					>
						{tag.label}
					</span>
				))}
				{showMore && (
					<button className='flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground'>
						<Plus className='h-3 w-3' strokeWidth={1.5} />
						Показать еще
					</button>
				)}
			</div>
		</div>
	)
}
