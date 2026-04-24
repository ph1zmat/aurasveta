'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Slider } from '@/shared/ui/Slider'

const slides = [
	{
		id: 1,
		title: 'ПРАВИЛЬНЫЙ СВЕТ',
		subtitle: 'Создайте атмосферу уюта с нашими светильниками',
		cta: 'Подробнее',
		href: '/promo/1',
		bg: 'from-foreground/80 to-foreground/60',
	},
	{
		id: 2,
		title: 'НОВАЯ КОЛЛЕКЦИЯ',
		subtitle: 'Современные люстры и светильники 2026',
		cta: 'Смотреть',
		href: '/new',
		bg: 'from-primary/80 to-primary/60',
	},
	{
		id: 3,
		title: 'СКИДКИ ДО 60%',
		subtitle: 'Распродажа уличного освещения',
		cta: 'К распродаже',
		href: '/clearance',
		bg: 'from-foreground/70 to-foreground/50',
	},
]

export default function HeroBanner() {
	return (
		<section className='mx-auto max-w-7xl px-3 py-2 sm:px-4 md:py-4'>
			<Slider
				visibleItems={1}
				dots
				arrows
				arrowsPosition='inside'
				loop
				renderArrow={({ direction, onClick, disabled }) => (
					<button
						onClick={onClick}
						disabled={disabled}
						className='hidden rounded-full bg-card/20 p-2 backdrop-blur-sm transition-colors hover:bg-card/40 disabled:opacity-30 md:block'
						aria-label={direction === 'prev' ? 'Предыдущий слайд' : 'Следующий слайд'}
					>
						{direction === 'prev' ? (
							<ChevronLeft className='h-5 w-5 text-card' />
						) : (
							<ChevronRight className='h-5 w-5 text-card' />
						)}
					</button>
				)}
			>
				{slides.map(slide => (
					<div
						key={slide.id}
						className={cn(
							'relative flex min-h-[220px] items-center overflow-hidden rounded-xl bg-linear-to-r sm:min-h-[260px] md:min-h-[320px]',
							slide.bg,
						)}
					>
						<div className='relative z-10 max-w-lg px-5 py-6 md:px-16 md:py-12'>
							<h2 className='mb-2 text-xl font-semibold tracking-wider text-card sm:text-2xl md:text-5xl'>
								{slide.title}
							</h2>
							<p className='mb-5 text-sm tracking-wide text-card/80 md:mb-6 md:text-lg'>{slide.subtitle}</p>
							<a
								href={slide.href}
								className='inline-block rounded-md bg-destructive px-8 py-3 font-normal text-destructive-foreground transition-colors hover:bg-destructive/90'
							>
								{slide.cta}
							</a>
						</div>
					</div>
				))}
			</Slider>
		</section>
	)
}
