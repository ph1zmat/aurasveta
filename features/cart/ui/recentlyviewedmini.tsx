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
			<div className='mb-5'>
				<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					История
				</p>
				<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
					Вы смотрели
				</h2>
			</div>
			<div className='flex gap-3 overflow-x-auto scrollbar-hide'>
				{items.map(item => (
					<Link
						key={item.href}
						href={item.href}
						className='group w-28 shrink-0 rounded-2xl border border-border bg-card p-2 transition-shadow hover:shadow-sm'
					>
						<div className='relative mb-2 h-24 w-full overflow-hidden rounded-xl bg-background'>
							<Image
								src={item.image}
								alt={item.name}
								fill
								className='object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]'
							/>
						</div>
						<p className='line-clamp-2 text-xs leading-4 tracking-wide text-foreground transition-colors group-hover:text-primary'>
							{item.name}
						</p>
					</Link>
				))}
			</div>
		</section>
	)
}
