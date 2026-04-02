'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
		<div className='flex gap-4'>
			{/* Thumbnail column */}
			<div className='flex w-16 shrink-0 flex-col items-center gap-2'>
				<button
					onClick={() => scrollThumbs('up')}
					disabled={thumbStart === 0}
					className='p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30'
					aria-label='Предыдущие фото'
				>
					<ChevronUp className='h-4 w-4' strokeWidth={1.5} />
				</button>

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
								className='object-contain p-1'
							/>
						</button>
					)
				})}

				<button
					onClick={() => scrollThumbs('down')}
					disabled={thumbStart + visibleThumbs >= images.length}
					className='p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30'
					aria-label='Следующие фото'
				>
					<ChevronDown className='h-4 w-4' strokeWidth={1.5} />
				</button>
			</div>

			{/* Main image */}
			<div className='relative flex-1 overflow-hidden rounded-sm bg-muted/30'>
				<div className='relative aspect-square w-full'>
					<Image
						src={images[activeIndex]}
						alt={alt}
						fill
						className='object-contain p-4'
						priority
					/>
				</div>
			</div>
		</div>
	)
}
