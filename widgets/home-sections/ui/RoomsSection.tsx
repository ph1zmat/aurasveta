import Image from 'next/image'
import Link from 'next/link'

interface RoomItem {
	label?: string
	link?: string
	icon_image?: string
}

interface RoomsSectionConfig {
	items?: RoomItem[]
	columns?: number
}

interface RoomsSectionProps {
	title?: string | null
	config?: RoomsSectionConfig | null
}

function resolveImageSrc(key: string): string {
	if (key.startsWith('http') || key.startsWith('/')) return key
	return `/api/storage/file?key=${encodeURIComponent(key)}`
}

const COLS_MAP: Record<number, string> = {
	3: 'grid-cols-3 sm:grid-cols-3',
	4: 'grid-cols-2 sm:grid-cols-4',
	6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
}

export default function RoomsSection({ title, config }: RoomsSectionProps) {
	const items: RoomItem[] = config?.items && config.items.length > 0 ? config.items : []
	const columns = config?.columns ?? 4
	const gridClass = COLS_MAP[columns] ?? 'grid-cols-2 sm:grid-cols-4'

	if (items.length === 0) return null

	const heading = title ?? 'Для каждого пространства'

	return (
		<section className='mx-auto max-w-7xl px-3 py-6 sm:px-4 md:py-10'>
			{heading && (
				<h2 className='text-xl font-bold tracking-tight mb-6 sm:text-2xl'>{heading}</h2>
			)}
			<div className={`grid gap-3 ${gridClass}`}>
				{items.map((item, i) => (
					<Link
						key={i}
						href={item.link ?? '#'}
						className='group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-foreground/20 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						{item.icon_image ? (
							<div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/40'>
								<Image
									src={resolveImageSrc(item.icon_image)}
									alt={item.label ?? ''}
									fill
									sizes='56px'
									className='object-contain p-1 transition-transform group-hover:scale-105'
								/>
							</div>
						) : (
							<div className='h-14 w-14 rounded-lg bg-muted/40' aria-hidden />
						)}
						{item.label && (
							<span className='text-xs font-semibold uppercase tracking-wider text-foreground/80 group-hover:text-foreground transition-colors leading-tight'>
								{item.label}
							</span>
						)}
					</Link>
				))}
			</div>
		</section>
	)
}
