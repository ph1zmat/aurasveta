import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import type { Tag } from '@/entities/category/model/types'
import Link from 'next/link'

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
			<h3 className='mb-2 text-sm font-semibold uppercase tracking-widest text-foreground'>
				{title}
			</h3>
			<div className='flex flex-wrap items-center gap-2'>
				{tags.map(tag => (
					<Button asChild key={tag.label} variant='chip' size='compact'>
						<Link href={`/search?q=${encodeURIComponent(tag.label)}`}>
							{tag.label}
						</Link>
					</Button>
				))}
				{showMore && (
					<Button variant='chip' size='compact'>
						<Plus className='h-3 w-3' strokeWidth={1.5} />
						Показать еще
					</Button>
				)}
			</div>
		</div>
	)
}
