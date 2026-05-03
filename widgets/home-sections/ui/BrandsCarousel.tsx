'use client'

import Link from 'next/link'
import { Slider } from '@/shared/ui/Slider'

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
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					{heading}
				</h2>
				{viewAllHref ? (
					<Link
						href={viewAllHref}
						className='text-xs text-muted-foreground underline-offset-4 hover:underline md:text-sm'
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
