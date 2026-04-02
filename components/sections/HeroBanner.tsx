'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
	const [current, setCurrent] = useState(0)

	const prev = () => setCurrent(c => (c === 0 ? slides.length - 1 : c - 1))
	const next = () => setCurrent(c => (c === slides.length - 1 ? 0 : c + 1))

	const slide = slides[current]

	return (
		<section className='relative mx-auto max-w-7xl px-4 py-4'>
			<div
				className={cn(
					'relative flex min-h-[240px] items-center overflow-hidden rounded-xl bg-gradient-to-r md:min-h-[320px]',
					slide.bg,
				)}
			>
				<div className='relative z-10 max-w-lg px-8 py-12 md:px-16'>
					<h2 className='mb-2 text-3xl font-bold tracking-wide text-card md:text-5xl'>
						{slide.title}
					</h2>
					<p className='mb-6 text-card/80 md:text-lg'>{slide.subtitle}</p>
					<a
						href={slide.href}
						className='inline-block rounded-lg bg-destructive px-8 py-3 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90'
					>
						{slide.cta}
					</a>
				</div>

				{/* Nav arrows */}
				<button
					onClick={prev}
					className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/20 p-2 backdrop-blur-sm transition-colors hover:bg-card/40'
					aria-label='Предыдущий слайд'
				>
					<ChevronLeft className='h-5 w-5 text-card' />
				</button>
				<button
					onClick={next}
					className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/20 p-2 backdrop-blur-sm transition-colors hover:bg-card/40'
					aria-label='Следующий слайд'
				>
					<ChevronRight className='h-5 w-5 text-card' />
				</button>
			</div>

			{/* Dots */}
			<div className='mt-3 flex justify-center gap-2'>
				{slides.map((s, i) => (
					<button
						key={s.id}
						onClick={() => setCurrent(i)}
						className={cn(
							'h-2 w-2 rounded-full transition-colors',
							i === current ? 'bg-foreground' : 'bg-border',
						)}
						aria-label={`Слайд ${i + 1}`}
					/>
				))}
			</div>
		</section>
	)
}
