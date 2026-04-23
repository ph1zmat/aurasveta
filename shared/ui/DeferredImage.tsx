'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ImageOff, LoaderCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import Skeleton from '@/shared/ui/Skeleton'

interface DeferredImageProps {
	src?: string | null
	alt: string
	fill?: boolean
	width?: number
	height?: number
	sizes?: string
	priority?: boolean
	className?: string
	imageClassName?: string
	fallbackClassName?: string
	showSpinner?: boolean
}

export default function DeferredImage({
	src,
	alt,
	fill = false,
	width,
	height,
	sizes,
	priority,
	className,
	imageClassName,
	fallbackClassName,
	showSpinner = true,
}: DeferredImageProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const [hasError, setHasError] = useState(false)

	const normalizedSrc = useMemo(() => src?.trim() ?? '', [src])
	const shouldRenderImage = normalizedSrc.length > 0 && !hasError

	return (
		<div className={cn('relative overflow-hidden', className)}>
			{shouldRenderImage ? (
				<Image
					src={normalizedSrc}
					alt={alt}
					fill={fill}
					width={fill ? undefined : width}
					height={fill ? undefined : height}
					sizes={sizes}
					priority={priority}
					unoptimized
					onLoad={() => setIsLoaded(true)}
					onError={() => {
						setHasError(true)
						setIsLoaded(false)
					}}
					className={cn(
						'transition-opacity duration-300',
						isLoaded ? 'opacity-100' : 'opacity-0',
						imageClassName,
					)}
				/>
			) : null}

			{!isLoaded && !hasError ? (
				<div className='absolute inset-0 flex items-center justify-center bg-muted/20'>
					<Skeleton className='absolute inset-0 h-full w-full rounded-none bg-muted/50' />
					{showSpinner ? (
						<LoaderCircle className='relative z-10 h-6 w-6 animate-spin text-muted-foreground/70' />
					) : null}
				</div>
			) : null}

			{(hasError || !normalizedSrc) && (
				<div
					className={cn(
						'absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground',
						fallbackClassName,
					)}
				>
					<div className='flex flex-col items-center gap-2 text-center'>
						<ImageOff className='h-6 w-6 opacity-70' />
						<span className='text-xs'>Изображение недоступно</span>
					</div>
				</div>
			)}
		</div>
	)
}