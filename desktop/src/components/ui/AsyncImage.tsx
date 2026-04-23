import { useMemo, useState } from 'react'
import { ImageOff, LoaderCircle } from 'lucide-react'

interface AsyncImageProps {
	src?: string | null
	alt: string
	className?: string
	imageClassName?: string
	fallbackClassName?: string
	showSpinner?: boolean
	objectFit?: 'contain' | 'cover'
}

export function AsyncImage({
	src,
	alt,
	className = '',
	imageClassName = '',
	fallbackClassName = '',
	showSpinner = true,
	objectFit = 'cover',
}: AsyncImageProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const [hasError, setHasError] = useState(false)
	const normalizedSrc = useMemo(() => src?.trim() ?? '', [src])

	return (
		<div className={`relative overflow-hidden ${className}`}>
			{normalizedSrc && !hasError ? (
				<img
					src={normalizedSrc}
					alt={alt}
					draggable={false}
					onLoad={() => setIsLoaded(true)}
					onError={() => {
						setHasError(true)
						setIsLoaded(false)
					}}
					className={`h-full w-full transition-opacity duration-300 ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imageClassName}`}
				/>
			) : null}

			{!isLoaded && !hasError && normalizedSrc ? (
				<div className='absolute inset-0 flex items-center justify-center bg-muted/20'>
					<div className='absolute inset-0 animate-pulse bg-muted/50' />
					{showSpinner ? (
						<LoaderCircle className='relative z-10 h-5 w-5 animate-spin text-muted-foreground/70' />
					) : null}
				</div>
			) : null}

			{(!normalizedSrc || hasError) && (
				<div className={`absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground ${fallbackClassName}`}>
					<div className='flex flex-col items-center gap-1.5 text-center'>
						<ImageOff className='h-5 w-5 opacity-70' />
						<span className='text-[11px]'>Нет изображения</span>
					</div>
				</div>
			)}
		</div>
	)
}