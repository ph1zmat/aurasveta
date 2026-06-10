'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import DeferredImage from '@/shared/ui/deferredimage'

interface ProductGalleryProps {
	images: string[]
	alt: string
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
	const [activeIndex, setActiveIndex] = useState(0)
	const [thumbStart, setThumbStart] = useState(0)
	const visibleThumbs = 4
	const canScrollUp = thumbStart > 0
	const canScrollDown = thumbStart + visibleThumbs < images.length

	const scrollThumbs = (dir: 'up' | 'down') => {
		if (dir === 'up' && thumbStart > 0) setThumbStart(thumbStart - 1)
		if (dir === 'down' && thumbStart + visibleThumbs < images.length)
			setThumbStart(thumbStart + 1)
	}

	const visibleImages = images.slice(thumbStart, thumbStart + visibleThumbs)

	return (
		<div className='rounded-[24px] border border-border bg-card/40 p-3 shadow-sm md:p-4'>
			<div className='mb-3 flex items-center justify-between gap-3 border-b border-border pb-3'>
				<div>
					<p className='text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Галерея товара
					</p>
					<p className='mt-1 text-sm text-foreground'>
						Фото {activeIndex + 1} из {images.length}
					</p>
				</div>
				{images.length > 1 ? (
					<div className='hidden items-center gap-2 md:flex'>
						<Button
							variant='outline'
							size='icon-sm'
							onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
							disabled={activeIndex === 0}
							aria-label='Предыдущее фото'
						>
							<ChevronLeft className='h-4 w-4' strokeWidth={1.5} />
						</Button>
						<Button
							variant='outline'
							size='icon-sm'
							onClick={() => setActiveIndex(Math.min(images.length - 1, activeIndex + 1))}
							disabled={activeIndex === images.length - 1}
							aria-label='Следующее фото'
						>
							<ChevronRight className='h-4 w-4' strokeWidth={1.5} />
						</Button>
					</div>
				) : null}
			</div>

			<div className='flex flex-col gap-3 md:flex-row md:gap-4'>
			{/* Thumbnail column — hidden on mobile, shown on md+ */}
			<div className='hidden w-16 shrink-0 flex-col items-center gap-2 md:flex'>
				<Button
					variant='outline'
					size='icon-sm'
					onClick={() => scrollThumbs('up')}
					disabled={!canScrollUp}
					aria-label='Предыдущие фото'
				>
					<ChevronUp className='h-4 w-4' strokeWidth={1.5} />
				</Button>

				{visibleImages.map((img, i) => {
					const realIndex = thumbStart + i
					return (
						<button
							key={realIndex}
							onClick={() => setActiveIndex(realIndex)}
							className={cn(
								'relative h-16 w-16 overflow-hidden rounded-xl border bg-background transition-colors',
								realIndex === activeIndex
									? 'border-foreground shadow-sm'
									: 'border-border hover:border-muted-foreground',
							)}
						>
							<DeferredImage
								src={img}
								alt={`${alt} — фото ${realIndex + 1}`}
								fill
								sizes='64px'
								imageClassName='object-contain p-1'
								fallbackClassName='rounded-sm'
								showSpinner={false}
							/>
						</button>
					)
				})}

				<Button
					variant='outline'
					size='icon-sm'
					onClick={() => scrollThumbs('down')}
					disabled={!canScrollDown}
					aria-label='Следующие фото'
				>
					<ChevronDown className='h-4 w-4' strokeWidth={1.5} />
				</Button>
			</div>

			{/* Main image */}
			<div className='relative flex-1 overflow-hidden rounded-[20px] border border-border bg-background'>
				<div className='relative aspect-square w-full'>
					<DeferredImage
						src={images[activeIndex]}
						alt={alt}
						fill
						sizes='(max-width: 768px) 100vw, 55vw'
						imageClassName='object-contain p-4 md:p-6'
						fallbackClassName='rounded-[20px]'
						priority
					/>
				</div>
				{/* Mobile nav arrows */}
				{images.length > 1 && (
					<>
						<button
							onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
							disabled={activeIndex === 0}
							className='absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-sm backdrop-blur-sm transition-opacity disabled:opacity-20 active:scale-95 md:hidden'
							aria-label='Предыдущее фото'
						>
							<ChevronLeft className='h-5 w-5' strokeWidth={1.5} />
						</button>
						<button
							onClick={() =>
								setActiveIndex(Math.min(images.length - 1, activeIndex + 1))
							}
							disabled={activeIndex === images.length - 1}
							className='absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-sm backdrop-blur-sm transition-opacity disabled:opacity-20 active:scale-95 md:hidden'
							aria-label='Следующее фото'
						>
							<ChevronRight className='h-5 w-5' strokeWidth={1.5} />
						</button>
						{/* Dot indicators */}
						<div className='absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 md:hidden'>
							{images.map((_, i) => (
								<button
									key={i}
									onClick={() => setActiveIndex(i)}
									aria-label={`Фото ${i + 1}`}
									className={cn(
										'h-1.5 rounded-full transition-all duration-200',
										i === activeIndex
											? 'w-4 bg-foreground'
											: 'w-1.5 bg-foreground/30',
									)}
								/>
							))}
						</div>
					</>
				)}
			</div>

			{/* Mobile thumbnail row */}
			{images.length > 1 && (
				<div className='flex gap-2 overflow-x-auto scrollbar-hide md:hidden'>
					{images.map((img, i) => (
						<button
							key={i}
							onClick={() => setActiveIndex(i)}
							className={cn(
								'relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-background transition-colors',
								i === activeIndex
									? 'border-foreground shadow-sm'
									: 'border-border',
							)}
						>
							<DeferredImage
								src={img}
								alt={`${alt} — фото ${i + 1}`}
								fill
								sizes='56px'
								imageClassName='object-contain p-1'
								fallbackClassName='rounded-sm'
								showSpinner={false}
							/>
						</button>
					))}
				</div>
			)}
			</div>
		</div>
	)
}
