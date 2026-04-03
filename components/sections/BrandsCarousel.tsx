'use client'

import { Slider } from '@/components/ui/Slider'

const brands = [
	{ name: 'Novotech', slug: 'novotech' },
	{ name: 'Elektrostandard', slug: 'elektrostandard' },
	{ name: 'Voltega', slug: 'voltega' },
	{ name: 'Werkel', slug: 'werkel' },
	{ name: 'Citilux', slug: 'citilux' },
	{ name: 'Maytoni', slug: 'maytoni' },
	{ name: 'Arte Lamp', slug: 'arte-lamp' },
	{ name: 'ST Luce', slug: 'st-luce' },
	{ name: 'Odeon Light', slug: 'odeon-light' },
	{ name: 'Favourite', slug: 'favourite' },
]

export default function BrandsCarousel() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-bold uppercase tracking-wider text-foreground md:mb-6 md:text-lg'>
				Бренды
			</h2>
			<Slider
				visibleItems={6}
				gap={32}
				arrows
				arrowsPosition='outside'
				loop
				breakpoints={{
					0: { visibleItems: 2, gap: 12 },
					480: { visibleItems: 3, gap: 16 },
					768: { visibleItems: 4, gap: 24 },
					1024: { visibleItems: 6, gap: 32 },
				}}
			>
				{brands.map(brand => (
					<a
						key={brand.slug}
						href={`/brands/${brand.slug}`}
						className='flex h-16 items-center justify-center rounded-lg border border-border bg-card px-6 text-lg font-bold uppercase tracking-wider text-foreground/70 transition-colors hover:border-primary hover:text-primary'
					>
						{brand.name}
					</a>
				))}
			</Slider>
		</section>
	)
}
