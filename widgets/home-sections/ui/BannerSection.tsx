'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import { Slider } from '@/shared/ui/Slider'

export interface BannerSlide {
	title?: string
	subtitle?: string
	cta?: string
	href?: string
	/** Storage key (passed to /api/storage/file?key=…) */
	imageKey?: string
	/** External or absolute image URL */
	imageUrl?: string
	/** Responsive image storage keys */
	src_1300?: string
	src_992?: string
	src_768?: string
	src_375?: string
	/** Tailwind gradient class suffix, e.g. "from-primary/80 to-primary/60" */
	bg?: string
}

export interface BannerSectionConfig {
	slides?: BannerSlide[]
	/** Minimum slide height in px, default 280 */
	minHeight?: number
	autoPlay?: boolean
	autoPlayInterval?: number
}

interface BannerSectionProps {
	title?: string | null
	config?: BannerSectionConfig
}

const DEFAULT_SLIDES: BannerSlide[] = [
	{
		title: 'ПРАВИЛЬНЫЙ СВЕТ',
		subtitle: 'Создайте атмосферу уюта с нашими светильниками',
		cta: 'Перейти в каталог',
		href: '/catalog',
		bg: 'from-foreground/80 to-foreground/60',
	},
	{
		title: 'НОВАЯ КОЛЛЕКЦИЯ',
		subtitle: 'Современные люстры и светильники 2026',
		cta: 'Смотреть',
		href: '/catalog',
		bg: 'from-primary/80 to-primary/60',
	},
	{
		title: 'СКИДКИ ДО 60%',
		subtitle: 'Распродажа уличного освещения',
		cta: 'К распродаже',
		href: '/catalog',
		bg: 'from-foreground/70 to-foreground/50',
	},
]

export default function BannerSection({ config }: BannerSectionProps) {
	const slides =
		config?.slides && config.slides.length > 0 ? config.slides : DEFAULT_SLIDES
	const minH = config?.minHeight ?? 280

	return (
		<section className='mx-auto max-w-7xl px-3 py-2 sm:px-4 md:py-4'>
			<Slider
				visibleItems={1}
				dots
				arrows
				arrowsPosition='inside'
				loop
				autoPlay={config?.autoPlay ?? false}
				autoPlayInterval={config?.autoPlayInterval ?? 4000}
				renderArrow={({ direction, onClick, disabled }) => (
					<button
						onClick={onClick}
						disabled={disabled}
						className='hidden rounded-full bg-card/20 p-2 backdrop-blur-sm transition-colors hover:bg-card/40 disabled:opacity-30 md:block'
						aria-label={
							direction === 'prev' ? 'Предыдущий слайд' : 'Следующий слайд'
						}
					>
						{direction === 'prev' ? (
							<ChevronLeft className='h-5 w-5 text-card' />
						) : (
							<ChevronRight className='h-5 w-5 text-card' />
						)}
					</button>
				)}
			>
				{slides.map((slide, idx) => {
					// Responsive image sources — prefer explicit breakpoint keys, fall back to legacy
					const src1300 = slide.src_1300
						? resolveStorageFileUrl(slide.src_1300)
						: null
					const src992 = slide.src_992
						? resolveStorageFileUrl(slide.src_992)
						: null
					const src768 = slide.src_768
						? resolveStorageFileUrl(slide.src_768)
						: null
					const src375 = slide.src_375
						? resolveStorageFileUrl(slide.src_375)
						: null
					// Legacy single image
					const legacySrc =
						resolveStorageFileUrl(slide.imageKey) ??
						resolveStorageFileUrl(slide.imageUrl) ??
						null

					// Primary image (largest available)
					const primarySrc = src1300 ?? src992 ?? src768 ?? src375 ?? legacySrc
					const hasResponsive = !!(src1300 || src992 || src768 || src375)

					return (
						<div
							key={idx}
							style={{ minHeight: minH }}
							className={cn(
								'relative flex items-center overflow-hidden rounded-xl',
								primarySrc
									? 'bg-foreground/40'
									: `bg-linear-to-r ${slide.bg ?? 'from-foreground/80 to-foreground/60'}`,
							)}
						>
							{primarySrc && (
								<div className='absolute inset-0 z-0'>
									{hasResponsive ? (
										<picture>
											{src1300 && <source media='(min-width: 1300px)' srcSet={src1300} />}
											{src992 && <source media='(min-width: 992px)' srcSet={src992} />}
											{src768 && <source media='(min-width: 768px)' srcSet={src768} />}
											{src375 && <source media='(min-width: 375px)' srcSet={src375} />}

											<img
												src={primarySrc}
												alt={slide.title ?? 'Баннер'}
												className='h-full w-full object-cover'
												loading={idx === 0 ? 'eager' : 'lazy'}
												decoding='async'
											/>
										</picture>
									) : (
										/* eslint-disable-next-line @next/next/no-img-element */
										<img
											src={primarySrc}
											alt={slide.title ?? 'Баннер'}
											className='h-full w-full object-cover'
											loading={idx === 0 ? 'eager' : 'lazy'}
											decoding='async'
										/>
									)}
									<div className='absolute inset-0 bg-black/20' />
								</div>
							)}
							<div className='relative z-10 max-w-lg px-5 py-6 md:px-16 md:py-12'>
								{slide.title && (
									<h2 className='mb-2 text-xl font-semibold tracking-wider text-card sm:text-2xl md:text-5xl'>
										{slide.title}
									</h2>
								)}
								{slide.subtitle && (
									<p className='mb-5 text-sm tracking-wide text-card/80 md:mb-6 md:text-lg'>
										{slide.subtitle}
									</p>
								)}
								{slide.cta && slide.href && (
									<Link
										href={slide.href}
										className='inline-block rounded-md bg-destructive px-8 py-3 font-normal text-destructive-foreground transition-colors hover:bg-destructive/90'
									>
										{slide.cta}
									</Link>
								)}
							</div>
						</div>
					)
				})}
			</Slider>
		</section>
	)
}
