'use client'

import Link from 'next/link'
import { Slider } from '@/shared/ui/slider'

interface BrandItem {
	name: string
	slug: string
	href?: string
}

interface BrandsCarouselProps {
	brands?: BrandItem[]
	heading?: string
	viewAllHref?: string
	viewAllLabel?: string
}

export default function BrandsCarousel({
	brands = [],
	heading = 'Бренды',
	viewAllHref,
	viewAllLabel,
}: BrandsCarouselProps) {
	if (brands.length === 0) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-5 flex items-end justify-between gap-4 md:mb-6'>
				<div>
					<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Производители
					</p>
					<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
						{heading}
					</h2>
				</div>
				{viewAllHref ? (
					<Link
						href={viewAllHref}
						className='shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'
					>
						{viewAllLabel ?? 'Смотреть все'}
					</Link>
				) : null}
			</div>
			<Slider
				visibleItems={6}
				gap={16}
				arrows
				arrowsPosition='outside'
				dots
				loop
				slideClassName='h-full'
				breakpoints={{
					0: { visibleItems: 2, gap: 8 },
					480: { visibleItems: 3, gap: 10 },
					768: { visibleItems: 4, gap: 12 },
					1024: { visibleItems: 6, gap: 16 },
				}}
			>
				{brands.map(brand => (
					<Link
						key={brand.slug}
						href={brand.href ?? `/catalog?prop.brand=${brand.slug}`}
						className='group flex h-full min-h-[144px] items-center justify-center rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70 transition-colors hover:border-primary hover:text-primary'
					>
						{brand.name}
					</Link>
				))}
			</Slider>
		</section>
	)
}
