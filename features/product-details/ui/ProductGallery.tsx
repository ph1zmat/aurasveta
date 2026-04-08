'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

interface ProductGalleryProps {
	images: string[]
	alt: string
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
	const [activeIndex, setActiveIndex] = useState(0)
	const [thumbStart, setThumbStart] = useState(0)
	const visibleThumbs = 4

	const scrollThumbs = (dir: 'up' | 'down') => {
		if (dir === 'up' && thumbStart > 0) setThumbStart(thumbStart - 1)
		if (dir === 'down' && thumbStart + visibleThumbs < images.length)
			setThumbStart(thumbStart + 1)
	}

	const visibleImages = images.slice(thumbStart, thumbStart + visibleThumbs)

	return (
		<div className='flex flex-col gap-3 md:flex-row md:gap-4 bg-muted p-2 rounded-[20px]'>
			{/* Thumbnail column — hidden on mobile, shown on md+ */}
			<div className='hidden w-16 shrink-0 flex-col items-center gap-2 md:flex'>
				<Button
					variant='icon'
					size='icon-sm'
					onClick={() => scrollThumbs('up')}
					disabled={thumbStart === 0}
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
								'relative h-16 w-16 overflow-hidden rounded-sm border transition-colors',
								realIndex === activeIndex
									? 'border-foreground'
									: 'border-border hover:border-muted-foreground',
							)}
						>
							<Image
								src={img}
								alt={`${alt} — фото ${realIndex + 1}`}
								fill
								sizes='64px'
								className='object-contain p-1'
							/>
						</button>
					)
				})}

				<Button
					variant='icon'
					size='icon-sm'
					onClick={() => scrollThumbs('down')}
					disabled={thumbStart + visibleThumbs >= images.length}
					aria-label='Следующие фото'
				>
					<ChevronDown className='h-4 w-4' strokeWidth={1.5} />
				</Button>
			</div>

			{/* Main image */}
			<div className='relative flex-1 overflow-hidden rounded-md'>
				<div className='relative aspect-square w-full'>
					<Image
						src={images[activeIndex]}
						alt={alt}
						fill
						sizes='(max-width: 768px) 100vw, 55vw'
						className='object-contain p-4'
						priority
					/>
				</div>
				{/* Mobile nav arrows */}
				{images.length > 1 && (
					<>
						<button
							onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
							disabled={activeIndex === 0}
							className='absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/70 p-1.5 shadow-sm backdrop-blur-sm disabled:opacity-30 md:hidden'
							aria-label='Предыдущее фото'
						>
							<ChevronLeft className='h-5 w-5' strokeWidth={1.5} />
						</button>
						<button
							onClick={() =>
								setActiveIndex(Math.min(images.length - 1, activeIndex + 1))
							}
							disabled={activeIndex === images.length - 1}
							className='absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/70 p-1.5 shadow-sm backdrop-blur-sm disabled:opacity-30 md:hidden'
							aria-label='Следующее фото'
						>
							<ChevronRight className='h-5 w-5' strokeWidth={1.5} />
						</button>
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
								'relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border transition-colors',
								i === activeIndex ? 'border-foreground' : 'border-border',
							)}
						>
							<Image
								src={img}
								alt={`${alt} — фото ${i + 1}`}
								fill
								sizes='56px'
								className='object-contain p-1'
							/>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
