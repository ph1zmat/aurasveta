import Image from 'next/image'
import Link from 'next/link'

export interface RecentlyViewedItem {
	name: string
	href: string
	image: string
}

interface RecentlyViewedMiniProps {
	items: RecentlyViewedItem[]
}

export default function RecentlyViewedMini({ items }: RecentlyViewedMiniProps) {
	if (items.length === 0) return null

	return (
		<section className='py-8'>
			<h2 className='mb-6 text-lg font-semibold uppercase tracking-widest text-foreground'>
				Вы смотрели
			</h2>
			<div className='flex gap-4 overflow-x-auto scrollbar-hide'>
				{items.map(item => (
					<Link
						key={item.href}
						href={item.href}
						className='group w-32 shrink-0'
					>
						<div className='relative mb-2 h-28 w-full overflow-hidden rounded-sm bg-muted/30'>
							<Image
								src={item.image}
								alt={item.name}
								fill
								className='object-contain p-2 transition-transform duration-300 group-hover:scale-105'
							/>
						</div>
						<p className='line-clamp-2 text-xs tracking-wider text-foreground transition-colors group-hover:text-primary'>
							{item.name}
						</p>
					</Link>
				))}
			</div>
		</section>
	)
}
