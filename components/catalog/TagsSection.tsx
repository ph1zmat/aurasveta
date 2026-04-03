import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
					<Button variant='ghost' size='compact' className='rounded-sm border border-border font-medium hover:border-foreground'>
						<Plus className='h-3 w-3' strokeWidth={1.5} />
						Показать еще
					</Button>
				)}
			</div>
		</div>
	)
}
